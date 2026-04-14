/**
 * upload.js
 * Читает mock_orders.json и загружает заказы в RetailCRM через REST API v5.
 * Запуск: node src/upload.js
 *
 * Особенности реальной структуры данных:
 *  - нет поля number/id — они генерируются RetailCRM
 *  - есть orderType, orderMethod, delivery, customFields (utm_source)
 *  - totalSumm вычисляется на лету как сумма qty * price
 */

import 'dotenv/config';
import axios from 'axios';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Конфигурация ─────────────────────────────────────────────
const CRM_URL     = process.env.RETAILCRM_URL?.replace(/\/$/, '');
const CRM_API_KEY = process.env.RETAILCRM_API_KEY;
const DELAY_MS    = Number(process.env.UPLOAD_BATCH_DELAY_MS) || 500;

if (!CRM_URL || !CRM_API_KEY) {
  console.error('❌  Укажите RETAILCRM_URL и RETAILCRM_API_KEY в .env');
  process.exit(1);
}

// ── HTTP-клиент RetailCRM ────────────────────────────────────
const crm = axios.create({
  baseURL: `${CRM_URL}/api/v5`,
  params:  { apiKey: CRM_API_KEY },
  timeout: 15_000,
});

// ── Вспомогательные функции ──────────────────────────────────

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

/**
 * Запрашивает справочник типов заказов и возвращает первый доступный.
 * На демо-аккаунте RetailCRM тип "eshop-individual" не существует —
 * там только "main". Эта функция определяет реальный тип автоматически.
 */
async function getAvailableOrderType() {
  try {
    const { data } = await crm.get('/reference/order-types');
    const types = Object.keys(data.orderTypes ?? {});
    if (types.length === 0) throw new Error('Справочник типов пуст');
    console.log(`ℹ️   Доступные типы заказов: ${types.join(', ')}`);
    // Предпочитаем eshop-individual, иначе берём первый доступный
    return types.includes('eshop-individual') ? 'eshop-individual' : types[0];
  } catch (err) {
    console.warn(`⚠️  Не удалось получить типы заказов: ${err.message}. Используем "main".`);
    return 'main';
  }
}

/**
 * Считает общую сумму заказа из массива items.
 * RetailCRM не принимает totalSumm напрямую — он вычисляется из позиций.
 */
function calcTotal(items = []) {
  return items.reduce((sum, item) => sum + item.quantity * item.initialPrice, 0);
}

/**
 * Преобразует запись из mock_orders.json в payload для RetailCRM API v5.
 * POST /api/v5/orders принимает form-encoded параметр `order` с JSON-строкой.
 */
function buildCrmPayload(order, orderType) {
  const crmOrder = {
    orderType:   orderType,
    orderMethod: order.orderMethod || 'shopping-cart',
    status:      order.status      || 'new',

    // Клиент
    firstName: order.firstName,
    lastName:  order.lastName,
    phone:     order.phone,
    email:     order.email,

    // Позиции заказа
    items: order.items.map((item) => ({
      productName:  item.productName,
      quantity:     item.quantity,
      initialPrice: item.initialPrice,
    })),

    // Доставка
    delivery: {
      address: {
        city: order.delivery?.address?.city  || '',
        text: order.delivery?.address?.text  || '',
      },
    },

    // Произвольные поля (UTM и др.)
    customFields: order.customFields || {},
  };

  // RetailCRM ожидает form-urlencoded: order=<JSON>
  const params = new URLSearchParams();
  params.append('order', JSON.stringify(crmOrder));
  return params;
}

/**
 * Создаёт один заказ в RetailCRM.
 * Возвращает { success, id, number } или { success: false, error }.
 */
async function createOrder(order, orderType) {
  try {
    const { data } = await crm.post('/orders', buildCrmPayload(order, orderType), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    if (data.success) {
      return { success: true, id: data.id };
    }
    return { success: false, error: data.errorMsg || 'Неизвестная ошибка CRM' };
  } catch (err) {
    const msg = err.response?.data?.errorMsg ?? err.message;
    return { success: false, error: msg };
  }
}

// ── Основной поток ───────────────────────────────────────────

async function main() {
  const ordersPath = join(__dirname, '..', 'mock_orders.json');
  const orders = JSON.parse(readFileSync(ordersPath, 'utf-8'));

  console.log(`📦  Загружено ${orders.length} заказов из mock_orders.json`);
  console.log(`⏱   Задержка между запросами: ${DELAY_MS}мс\n`);

  // Определяем реальный тип заказа для этого аккаунта RetailCRM
  const orderType = await getAvailableOrderType();
  console.log(`✅  Будем использовать тип заказа: "${orderType}"\n`);

  const results = { ok: 0, fail: 0, errors: [] };

  for (let i = 0; i < orders.length; i++) {
    const order = orders[i];
    const label = `${order.firstName} ${order.lastName}`;
    const total = calcTotal(order.items).toLocaleString('ru-RU');

    process.stdout.write(`  [${i + 1}/${orders.length}] ${label} (${total} ₸) … `);

    const result = await createOrder(order, orderType);

    if (result.success) {
      console.log(`✅  CRM id=${result.id}`);
      results.ok++;
    } else {
      console.log(`❌  ${result.error}`);
      results.fail++;
      results.errors.push({ label, error: result.error });
    }

    if (i < orders.length - 1) await sleep(DELAY_MS);
  }

  console.log('\n── Результат ──────────────────────────');
  console.log(`✅  Успешно:  ${results.ok}`);
  console.log(`❌  Ошибки:   ${results.fail}`);

  if (results.errors.length) {
    console.log('\nПроблемные заказы:');
    results.errors.forEach(({ label, error }) =>
      console.log(`  ${label}: ${error}`)
    );
  }
}

main().catch((err) => {
  console.error('💥  Критическая ошибка:', err.message);
  process.exit(1);
});