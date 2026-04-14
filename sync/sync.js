/**
 * sync.js — синхронизация RetailCRM → Supabase + Telegram уведомления.
 *
 * Режимы:
 *   node src/sync.js           — однократный запуск
 *   node src/sync.js --watch   — каждые SYNC_INTERVAL_MS мс
 */

import 'dotenv/config';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import { notifyIfLargeOrder, THRESHOLD } from './telegram.js';

// ── Конфигурация ─────────────────────────────────────────────
const CRM_URL      = process.env.RETAILCRM_URL?.replace(/\/$/, '');
const CRM_API_KEY  = process.env.RETAILCRM_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const LIMIT        = Number(process.env.ORDERS_LIMIT)     || 100;
const INTERVAL_MS  = Number(process.env.SYNC_INTERVAL_MS) || 300_000;

for (const [name, val] of [
  ['RETAILCRM_URL',        CRM_URL],
  ['RETAILCRM_API_KEY',    CRM_API_KEY],
  ['SUPABASE_URL',         SUPABASE_URL],
  ['SUPABASE_SERVICE_KEY', SUPABASE_KEY],
]) {
  if (!val) { console.error(`Не задана: ${name}`); process.exit(1); }
}

// ── Клиенты ──────────────────────────────────────────────────
const crm = axios.create({
  baseURL: `${CRM_URL}/api/v5`,
  params:  { apiKey: CRM_API_KEY },
  timeout: 15_000,
});

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Храним ID уже обработанных заказов в памяти, чтобы не дублировать уведомления
const notifiedIds = new Set();

// ── RetailCRM ─────────────────────────────────────────────────
async function fetchPage(page = 1) {
  const { data } = await crm.get('/orders', { params: { limit: LIMIT, page } });
  if (!data.success) throw new Error(`RetailCRM: ${data.errorMsg}`);
  return {
    orders:     data.orders                    ?? [],
    totalPages: data.pagination?.totalPageCount ?? 1,
  };
}

async function fetchAllOrders() {
  const all = [];
  let page = 1, totalPages = 1;
  do {
    const r = await fetchPage(page);
    totalPages = r.totalPages;
    all.push(...r.orders);
    console.log(`    Стр. ${page}/${totalPages} — +${r.orders.length} заказов`);
    page++;
  } while (page <= totalPages);
  return all;
}

// ── Маппинг → Supabase ────────────────────────────────────────
function calcTotal(items = []) {
  return items.reduce((s, i) => s + (i.quantity ?? 1) * (i.initialPrice ?? 0), 0);
}

function mapToRow(order) {
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

async function upsertBatch(rows) {
  const { error } = await supabase.from('orders').upsert(rows, { onConflict: 'id' });
  if (error) throw new Error(`Supabase: ${error.message}`);
}

// ── Telegram: только новые заказы (не старше 24ч) ────────────
function isNewForNotify(order) {
  if (notifiedIds.has(order.id)) return false;
  const ageHours = (Date.now() - new Date(order.createdAt ?? 0).getTime()) / 3_600_000;
  return ageHours < 24;
}

async function processNotifications(orders) {
  const candidates = orders.filter(isNewForNotify);
  let sent = 0;
  for (const order of candidates) {
    const ok = await notifyIfLargeOrder(order);
    notifiedIds.add(order.id); // помечаем всегда, чтобы не проверять повторно
    if (ok) sent++;
  }
  if (sent > 0) console.log(`  📬  Telegram: отправлено ${sent} уведомлений`);
}

// ── Основной прогон ───────────────────────────────────────────
async function runSync() {
  const start = Date.now();
  console.log(`\n[${new Date().toISOString()}] Синхронизация (порог: ${THRESHOLD.toLocaleString('ru-RU')} ₸)…`);

  try {
    const orders = await fetchAllOrders();
    if (!orders.length) { console.log('Заказов нет.'); return; }

    // 1. Сохраняем в Supabase
    const rows = orders.map(mapToRow);
    for (let i = 0; i < rows.length; i += 500) {
      await upsertBatch(rows.slice(i, i + 500));
    }

    // 2. Уведомляем в Telegram о крупных
    await processNotifications(orders);

    console.log(`Готово: ${rows.length} заказов за ${((Date.now()-start)/1000).toFixed(1)}с`);
  } catch (err) {
    console.error('Ошибка:', err.message);
    if (!process.argv.includes('--watch')) process.exit(1);
  }
}

// ── Запуск ────────────────────────────────────────────────────
if (process.argv.includes('--watch')) {
  console.log(`Watch-режим: каждые ${INTERVAL_MS / 1000}с`);
  runSync();
  setInterval(runSync, INTERVAL_MS);
} else {
  runSync();
}
