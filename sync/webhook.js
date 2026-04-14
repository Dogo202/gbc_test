/**
 * webhook.js
 * Express-сервер для получения вебхуков от RetailCRM.
 * Вариант 1 — используйте, если ваш аккаунт RetailCRM поддерживает webhooks.
 *
 * Запуск: node src/webhook.js
 * Для локальной разработки используйте ngrok:
 *   ngrok http 3001
 *   → скопируйте https://xxxx.ngrok.io в настройки RetailCRM
 *
 * Установить Express: npm install express
 */

import 'dotenv/config';
import express        from 'express';
import { createClient } from '@supabase/supabase-js';
import { notifyIfLargeOrder } from './telegram.js';

const PORT       = process.env.WEBHOOK_PORT   || 3001;
const SECRET     = process.env.WEBHOOK_SECRET || ''; // опциональный секрет для верификации
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const app      = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Верификация запроса от RetailCRM ─────────────────────────
function isValidRequest(req) {
  if (!SECRET) return true; // секрет не задан — пропускаем
  return req.query.secret === SECRET || req.headers['x-webhook-secret'] === SECRET;
}

// ── Маппинг заказа RetailCRM → строка Supabase ───────────────
function mapToRow(order) {
  const calcTotal = (items = []) =>
    items.reduce((s, i) => s + (i.quantity ?? 1) * (i.initialPrice ?? 0), 0);

  return {
    id:                  order.id,
    number:              order.number                   ?? null,
    order_type:          order.orderType                ?? 'eshop-individual',
    order_method:        order.orderMethod              ?? 'shopping-cart',
    status:              order.status                   ?? 'new',
    total_sum:           order.totalSumm                ?? calcTotal(order.items),
    customer_first_name: order.firstName                ?? null,
    customer_last_name:  order.lastName                 ?? null,
    customer_phone:      order.phone                    ?? null,
    customer_email:      order.email                    ?? null,
    delivery_city:       order.delivery?.address?.city  ?? null,
    delivery_address:    order.delivery?.address?.text  ?? null,
    utm_source:          order.customFields?.utm_source ?? null,
    created_at:          order.createdAt                ?? new Date().toISOString(),
    updated_at:          order.updatedAt                ?? new Date().toISOString(),
    synced_at:           new Date().toISOString(),
    raw_data:            order,
  };
}

// ── Основной webhook endpoint ─────────────────────────────────
// RetailCRM отправляет POST на этот URL при каждом событии заказа.
// Настройка: CRM → Администрирование → Уведомления → Webhook
//   URL: https://your-server.com/webhook/retailcrm
//   События: Создание заказа, Изменение заказа
app.post('/webhook/retailcrm', async (req, res) => {
  // 1. Проверка подлинности
  if (!isValidRequest(req)) {
    console.warn('⚠️  Неавторизованный webhook запрос');
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  // RetailCRM отправляет данные в разных форматах в зависимости от версии:
  // - application/json: { event, data: { order } }
  // - application/x-www-form-urlencoded: body содержит JSON-строку
  let payload = req.body;
  if (typeof payload === 'string') {
    try { payload = JSON.parse(payload); } catch { /* ignore */ }
  }

  const event = payload?.event || payload?.topic;
  const order = payload?.data?.order || payload?.order;

  console.log(`📥  Webhook: event="${event}", order id=${order?.id ?? '?'}`);

  if (!order?.id) {
    return res.status(200).json({ ok: true, message: 'no order data' });
  }

  try {
    // 2. Сохраняем / обновляем в Supabase
    const { error } = await supabase
      .from('orders')
      .upsert(mapToRow(order), { onConflict: 'id' });

    if (error) console.error('Supabase error:', error.message);

    // 3. Telegram уведомление для новых крупных заказов
    if (event === 'order.create' || event === 'orders.create') {
      await notifyIfLargeOrder(order);
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Webhook handler error:', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── Health check ──────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

app.listen(PORT, () => {
  console.log(`🚀  Webhook сервер запущен: http://localhost:${PORT}`);
  console.log(`   Endpoint: POST /webhook/retailcrm`);
  console.log(`   Health:   GET  /health`);
  if (!SECRET) console.warn('⚠️  WEBHOOK_SECRET не задан — запросы не верифицируются');
});
