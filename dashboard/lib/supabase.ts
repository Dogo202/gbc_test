import { createClient } from "@supabase/supabase-js";

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnon);

// ── Types ────────────────────────────────────────────────────

export type Order = {
  id:                  number;
  number:              string | null;
  order_type:          string;
  order_method:        string;
  status:              string;
  total_sum:           number;
  customer_first_name: string | null;
  customer_last_name:  string | null;
  customer_phone:      string | null;
  customer_email:      string | null;
  delivery_city:       string | null;
  delivery_address:    string | null;
  utm_source:          string | null;
  created_at:          string;
  updated_at:          string;
  synced_at:           string;
};

// ── Queries ──────────────────────────────────────────────────

/** Последние N заказов для таблицы */
export async function fetchRecentOrders(limit = 50): Promise<Order[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Агрегат заказов по дням для графика */
export async function fetchOrdersByDay(): Promise<{ date: string; count: number; revenue: number }[]> {
  // Используем Supabase RPC или группируем на клиенте
  const { data, error } = await supabase
    .from("orders")
    .select("created_at, total_sum")
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  const map = new Map<string, { count: number; revenue: number }>();

  for (const row of data ?? []) {
    if (!row.created_at) continue;
    const day = row.created_at.slice(0, 10); // YYYY-MM-DD
    const cur = map.get(day) ?? { count: 0, revenue: 0 };
    map.set(day, {
      count:   cur.count + 1,
      revenue: cur.revenue + Number(row.total_sum),
    });
  }

  return Array.from(map.entries()).map(([date, val]) => ({ date, ...val }));
}

/** Сводная статистика */
export async function fetchStats(): Promise<{
  total: number;
  revenue: number;
  avgOrder: number;
  topCity: string;
  topUtm: string;
}> {
  const { data, error } = await supabase
    .from("orders")
    .select("total_sum, delivery_city, utm_source");

  if (error) throw new Error(error.message);
  const rows = data ?? [];

  const total   = rows.length;
  const revenue = rows.reduce((s, r) => s + Number(r.total_sum), 0);
  const avgOrder = total ? revenue / total : 0;

  // Топ-город
  const cityCount = new Map<string, number>();
  const utmCount  = new Map<string, number>();
  for (const r of rows) {
    if (r.delivery_city) cityCount.set(r.delivery_city, (cityCount.get(r.delivery_city) ?? 0) + 1);
    if (r.utm_source)    utmCount.set(r.utm_source,    (utmCount.get(r.utm_source)    ?? 0) + 1);
  }

  const topCity = [...cityCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
  const topUtm  = [...utmCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  return { total, revenue, avgOrder, topCity, topUtm };
}
