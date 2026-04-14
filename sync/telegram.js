/**
 * telegram.js
 * Модуль отправки уведомлений в Telegram через Bot API.
 * Используется как из sync.js (polling), так и из webhook.js.
 */

import 'dotenv/config';
import axios from 'axios';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID   = process.env.TELEGRAM_CHAT_ID;
const THRESHOLD = Number(process.env.NOTIFY_THRESHOLD_SUM) || 50_000;

if (!BOT_TOKEN || !CHAT_ID) {
  console.warn('⚠️  TELEGRAM_BOT_TOKEN или TELEGRAM_CHAT_ID не заданы — уведомления отключены.');
}

const tg = axios.create({
  baseURL: `https://api.telegram.org/bot${BOT_TOKEN}`,
  timeout: 10_000,
});

// ── UTM-иконки ───────────────────────────────────────────────
const UTM_EMOJI = {
  instagram: '📸',
  google:    '🔍',
  tiktok:    '🎵',
  direct:    '🔗',
  referral:  '👥',
};

// ── Форматирование суммы ─────────────────────────────────────
function fmtSum(n) {
  return Number(n).toLocaleString('ru-RU') + ' ₸';
}

/**
 * Формирует красивое HTML-сообщение для Telegram.
 * @param {Object} order — объект заказа из RetailCRM
 */
function buildMessage(order) {
  const name     = [order.firstName, order.lastName].filter(Boolean).join(' ') || 'Неизвестный';
  const city     = order.delivery?.address?.city || order.deliveryAddress?.city || '—';
  const address  = order.delivery?.address?.text || '—';
  const utm      = order.customFields?.utm_source || '—';
  const utmEmoji = UTM_EMOJI[utm] || '📊';
  const total    = fmtSum(order.totalSumm ?? 0);
  const num      = order.number ? `#${order.number}` : `id:${order.id}`;

  // Список товаров
  const items = (order.items ?? [])
    .map(i => `  • ${i.productName} × ${i.quantity} — ${fmtSum(i.initialPrice * i.quantity)}`)
    .join('\n');

  return `🔔 <b>Крупный заказ!</b> ${total}

📦 <b>Заказ</b> ${num}
👤 <b>Клиент:</b> ${name}
📱 <b>Телефон:</b> ${order.phone || '—'}
🏙️ <b>Город:</b> ${city}
📍 <b>Адрес:</b> ${address}
${utmEmoji} <b>Источник:</b> ${utm}

<b>Состав заказа:</b>
${items || '  —'}

💰 <b>Итого: ${total}</b>
⏰ ${new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Almaty' })}`;
}

/**
 * Отправляет одно сообщение в Telegram.
 * @returns {boolean} успех
 */
export async function sendTelegramMessage(text) {
  if (!BOT_TOKEN || !CHAT_ID) return false;

  try {
    await tg.post('/sendMessage', {
      chat_id:    CHAT_ID,
      text,
      parse_mode: 'HTML',
      // Кнопка "Открыть в CRM" (опционально, если есть URL)
      // reply_markup: { inline_keyboard: [[{ text: '🔗 Открыть в CRM', url: CRM_ORDER_URL }]] }
    });
    return true;
  } catch (err) {
    console.error('❌  Telegram send error:', err.response?.data?.description ?? err.message);
    return false;
  }
}

/**
 * Проверяет заказ по порогу и отправляет уведомление если нужно.
 * @param {Object} order
 * @returns {boolean} было ли отправлено уведомление
 */
export async function notifyIfLargeOrder(order) {
  const total = Number(order.totalSumm ?? 0);
  if (total < THRESHOLD) return false;

  console.log(`  💬  Крупный заказ ${fmtSum(total)} — отправляю в Telegram…`);
  const text = buildMessage(order);
  const sent = await sendTelegramMessage(text);

  if (sent) console.log('  ✅  Telegram уведомление отправлено');
  return sent;
}

export { THRESHOLD };
