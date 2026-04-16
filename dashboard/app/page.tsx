import dynamic from "next/dynamic";
import { fetchRecentOrders, fetchOrdersByDay, fetchStats } from "@/lib/supabase";
import StatCard from "@/components/StatCard";

const OrdersChart = dynamic(() => import("@/components/OrdersChart"), { ssr: false });
const OrdersTable = dynamic(() => import("@/components/OrdersTable"), { ssr: false });
const UtmChart    = dynamic(() => import("@/components/UtmChart"),    { ssr: false });

export const revalidate = 60;

function fmt(n: number) {
  return n.toLocaleString("ru-RU");
}

export default async function DashboardPage() {
  const [orders, chartData, stats] = await Promise.all([
    fetchRecentOrders(100),
    fetchOrdersByDay(),
    fetchStats(),
  ]);

  return (
    <div style={{ position: "relative", minHeight: "100vh", zIndex: 10 }}>
      {/* Hero gradient */}
      <div style={{
        position: "absolute", inset: "0 0 auto 0", height: 288, pointerEvents: "none",
        background: "radial-gradient(ellipse 60% 40% at 50% -10%, rgba(0,255,157,0.12) 0%, transparent 70%)",
      }} />

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 24px" }}>

        {/* Шапка */}
        <header style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#00ff9d", display: "inline-block" }} />
            <span style={{ fontFamily: "monospace", fontSize: 11, color: "#8b949e", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              live sync · supabase
            </span>
          </div>
          <h1 style={{ fontSize: 48, fontWeight: 400, lineHeight: 1.1, color: "#fff", margin: 0 }}>
            Orders <span style={{ color: "#00ff9d" }}>Dashboard</span>
          </h1>
          <p style={{ color: "#8b949e", fontSize: 14, marginTop: 4 }}>
            RetailCRM → Supabase · аналитика заказов в реальном времени
          </p>
        </header>

        {/* KPI карточки */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
          <StatCard label="Всего заказов" value={fmt(stats.total)} accent />
          <StatCard label="Выручка"       value={`${fmt(stats.revenue)} ₸`} sub={`Средний чек: ${fmt(Math.round(stats.avgOrder))} ₸`} />
          <StatCard label="Топ-город"     value={stats.topCity} />
          <StatCard label="Топ-источник"  value={stats.topUtm} />
        </div>

        {/* График + UTM */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24, marginBottom: 24 }}>
          <div style={{ background: "#161b22", border: "1px solid #21262d", borderRadius: 12, padding: 24 }}>
            <h2 style={{ color: "#fff", fontSize: 18, fontWeight: 400, margin: "0 0 4px 0" }}>Динамика заказов</h2>
            <p style={{ color: "#8b949e", fontSize: 12, fontFamily: "monospace", margin: "0 0 20px 0" }}>
              заказы · <span style={{ color: "#f0a050" }}>── выручка ₸</span>
            </p>
            <OrdersChart data={chartData} />
          </div>
          <div style={{ background: "#161b22", border: "1px solid #21262d", borderRadius: 12, padding: 24 }}>
            <h2 style={{ color: "#fff", fontSize: 18, fontWeight: 400, margin: "0 0 4px 0" }}>Источники</h2>
            <p style={{ color: "#8b949e", fontSize: 12, fontFamily: "monospace", margin: "0 0 20px 0" }}>utm_source</p>
            <UtmChart orders={orders} />
          </div>
        </div>

        {/* Таблица */}
        <div style={{ background: "#161b22", border: "1px solid #21262d", borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 400, margin: 0 }}>Последние заказы</h2>
              <p style={{ color: "#8b949e", fontSize: 12, fontFamily: "monospace", margin: "4px 0 0 0" }}>
                последние {orders.length} заказов из базы
              </p>
            </div>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#00ff9d", display: "inline-block" }} />
          </div>
          <OrdersTable orders={orders} />
        </div>

        <footer style={{ textAlign: "center", color: "#8b949e", fontSize: 12, fontFamily: "monospace", paddingBottom: 16 }}>
          Orders Dashboard · данные обновляются каждые 60 секунд
        </footer>
      </div>
    </div>
  );
}
