import dynamic from "next/dynamic";
import { fetchRecentOrders, fetchOrdersByDay, fetchStats } from "@/lib/supabase";
import StatCard    from "@/components/StatCard";

const OrdersChart = dynamic(() => import("@/components/OrdersChart"), { ssr: false });
const OrdersTable = dynamic(() => import("@/components/OrdersTable"), { ssr: false });
const UtmChart    = dynamic(() => import("@/components/UtmChart"),    { ssr: false });

export const revalidate = 60; // ISR: обновлять каждую минуту

// ── Иконки (SVG inline, без внешних зависимостей) ────────────
const Icons = {
  orders:  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M3 4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4zm0 6a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-2zm1 5a1 1 0 0 0 0 2h6a1 1 0 0 0 0-2H4z"/></svg>,
  revenue: <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 0 1-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 0 1-.567.267z"/><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm1-13a1 1 0 1 0-2 0v.092a4.535 4.535 0 0 0-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 1 0-1.51 1.31c.562.649 1.413 1.077 2.353 1.253V15a1 1 0 1 0 2 0v-.092a4.535 4.535 0 0 0 1.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0 0 11 9.092V7.151c.391.127.68.317.843.504a1 1 0 1 0 1.511-1.31c-.563-.649-1.413-1.077-2.354-1.253V5z" clipRule="evenodd"/></svg>,
  city:    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 1 1 9.9 9.9L10 18.9l-4.95-4.95a7 7 0 0 1 0-9.9zM10 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" clipRule="evenodd"/></svg>,
  utm:     <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M2 11a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-5zm6-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V7zm6-3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V4z"/></svg>,
};

function fmt(n: number) {
  return n.toLocaleString("ru-RU");
}

export default async function DashboardPage() {
  // Параллельно загружаем данные
  const [orders, chartData, stats] = await Promise.all([
    fetchRecentOrders(100),
    fetchOrdersByDay(),
    fetchStats(),
  ]);

  return (
    <div className="relative min-h-screen z-10">
      {/* Hero gradient */}
      <div className="hero-gradient absolute inset-x-0 top-0 h-72 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">

        {/* ── Шапка ── */}
        <header className="animate-fade-in">
          <div className="flex items-center gap-3 mb-1">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse-slow" />
            <span className="font-mono text-xs text-muted uppercase tracking-widest">
              live sync · supabase
            </span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl text-white leading-tight">
            Nova <span className="text-accent">Orders</span>
          </h1>
          <p className="font-sans text-muted mt-1 text-sm">
            RetailCRM → Supabase · аналитика заказов в реальном времени
          </p>
        </header>

        {/* ── KPI карточки ── */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Всего заказов"
            value={fmt(stats.total)}
            icon={Icons.orders}
            accent
            delay={0}
          />
          <StatCard
            label="Выручка"
            value={`${fmt(stats.revenue)} ₸`}
            sub={`Средний чек: ${fmt(Math.round(stats.avgOrder))} ₸`}
            icon={Icons.revenue}
            delay={80}
          />
          <StatCard
            label="Топ-город"
            value={stats.topCity}
            icon={Icons.city}
            delay={160}
          />
          <StatCard
            label="Топ-источник"
            value={stats.topUtm}
            icon={Icons.utm}
            delay={240}
          />
        </section>

        {/* ── График + UTM ── */}
        <section className="grid lg:grid-cols-3 gap-6">
          {/* График заказов по дням */}
          <div
            className="lg:col-span-2 bg-panel border border-border rounded-xl p-6 animate-slide-up"
            style={{ animationDelay: "100ms", animationFillMode: "both" }}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-display text-lg text-white">Динамика заказов</h2>
                <p className="font-mono text-xs text-muted mt-0.5">
                  заказы · <span className="text-yellow-400">── выручка ₸</span>
                </p>
              </div>
              <span className="font-mono text-xs text-muted border border-border rounded px-2 py-1">
                {chartData.length} дн.
              </span>
            </div>
            <OrdersChart data={chartData} />
          </div>

          {/* UTM-источники */}
          <div
            className="bg-panel border border-border rounded-xl p-6 animate-slide-up"
            style={{ animationDelay: "200ms", animationFillMode: "both" }}
          >
            <h2 className="font-display text-lg text-white mb-1">Источники</h2>
            <p className="font-mono text-xs text-muted mb-5">utm_source</p>
            <UtmChart orders={orders} />
          </div>
        </section>

        {/* ── Таблица заказов ── */}
        <section
          className="bg-panel border border-border rounded-xl p-6 animate-slide-up"
          style={{ animationDelay: "300ms", animationFillMode: "both" }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-display text-xl text-white">Последние заказы</h2>
              <p className="font-mono text-xs text-muted mt-0.5">
                последние {orders.length} заказов из базы
              </p>
            </div>
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse-slow" />
          </div>
          <OrdersTable orders={orders} />
        </section>

        {/* ── Футер ── */}
        <footer className="text-center font-mono text-xs text-muted pb-4">
          Nova Dashboard · данные обновляются каждые 60 секунд
        </footer>
      </div>
    </div>
  );
}
