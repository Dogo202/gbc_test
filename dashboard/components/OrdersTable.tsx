"use client";

import { useState } from "react";
import type { Order } from "@/lib/supabase";

function fmtDate(str: string | null): string {
  if (!str) return "—";
  const d = new Date(str);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}
import StatusBadge from "./StatusBadge";

export default function OrdersTable({ orders }: { orders: Order[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = orders.filter((o) => {
    const name = `${o.customer_first_name ?? ""} ${o.customer_last_name ?? ""}`.toLowerCase();
    const matchSearch =
      !search ||
      name.includes(search.toLowerCase()) ||
      (o.customer_phone ?? "").includes(search) ||
      (o.delivery_city ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Фильтры */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Поиск по имени, телефону, городу…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1, minWidth: 200, background: "#0d1117", border: "1px solid #21262d",
            borderRadius: 8, padding: "8px 12px", color: "#fff", fontSize: 13,
            outline: "none", fontFamily: "monospace",
          }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            background: "#0d1117", border: "1px solid #21262d", borderRadius: 8,
            padding: "8px 12px", color: "#fff", fontSize: 13, fontFamily: "monospace",
          }}
        >
          <option value="all">Все статусы</option>
          <option value="new">Новый</option>
          <option value="in-progress">В работе</option>
          <option value="complete">Выполнен</option>
          <option value="cancel">Отменён</option>
        </select>
      </div>

      {/* Таблица */}
      <div style={{ overflowX: "auto", borderRadius: 12, border: "1px solid #21262d" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #21262d", background: "rgba(22,27,34,0.8)" }}>
              {["#", "Клиент", "Город", "Сумма", "Статус", "Дата"].map((h) => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", color: "#8b949e", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", whiteSpace: "nowrap" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: "48px 16px", textAlign: "center", color: "#8b949e" }}>
                  Заказов не найдено
                </td>
              </tr>
            ) : (
              filtered.map((order, i) => (
                <tr key={order.id} style={{ borderBottom: "1px solid rgba(33,38,45,0.5)", background: i % 2 === 0 ? "transparent" : "rgba(22,27,34,0.3)" }}>
                  <td style={{ padding: "10px 16px", color: "#8b949e", fontFamily: "monospace", fontSize: 12, whiteSpace: "nowrap" }}>
                    {order.number ?? `#${order.id}`}
                  </td>
                  <td style={{ padding: "10px 16px", whiteSpace: "nowrap" }}>
                    <div style={{ color: "#fff" }}>{order.customer_first_name} {order.customer_last_name}</div>
                    <div style={{ color: "#8b949e", fontSize: 12, fontFamily: "monospace" }}>{order.customer_phone}</div>
                  </td>
                  <td style={{ padding: "10px 16px", color: "#fff", whiteSpace: "nowrap" }}>
                    {order.delivery_city ?? "—"}
                  </td>
                  <td style={{ padding: "10px 16px", color: "#00ff9d", fontFamily: "monospace", whiteSpace: "nowrap" }}>
                    {Number(order.total_sum).toLocaleString("ru-RU")} ₸
                  </td>
                  <td style={{ padding: "10px 16px", whiteSpace: "nowrap" }}>
                    <StatusBadge status={order.status} />
                  </td>
                  <td style={{ padding: "10px 16px", color: "#8b949e", fontFamily: "monospace", fontSize: 12, whiteSpace: "nowrap" }}>
                    {fmtDate(order.created_at)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p style={{ color: "#8b949e", fontSize: 12, fontFamily: "monospace", textAlign: "right" }}>
        Показано {filtered.length} из {orders.length} заказов
      </p>
    </div>
  );
}
