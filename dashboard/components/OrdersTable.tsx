"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ru }     from "date-fns/locale";
import type { Order } from "@/lib/supabase";
import StatusBadge from "./StatusBadge";
import clsx from "clsx";

const UTM_COLORS: Record<string, string> = {
  instagram: "text-pink-400",
  google:    "text-blue-400",
  tiktok:    "text-cyan-400",
  direct:    "text-muted",
  referral:  "text-yellow-400",
};

export default function OrdersTable({ orders }: { orders: Order[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = orders.filter((o) => {
    const name = `${o.customer_first_name ?? ""} ${o.customer_last_name ?? ""}`.toLowerCase();
    const matchSearch =
      !search ||
      name.includes(search.toLowerCase()) ||
      (o.customer_phone ?? "").includes(search) ||
      (o.delivery_city  ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Фильтры */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Поиск по имени, телефону, городу…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="
            flex-1 bg-surface border border-border rounded-lg px-3 py-2
            font-mono text-sm text-white placeholder:text-muted
            focus:outline-none focus:border-accent/60 transition-colors
          "
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="
            bg-surface border border-border rounded-lg px-3 py-2
            font-mono text-sm text-white
            focus:outline-none focus:border-accent/60 transition-colors
          "
        >
          <option value="all">Все статусы</option>
          <option value="new">Новый</option>
          <option value="in-progress">В работе</option>
          <option value="complete">Выполнен</option>
          <option value="cancel">Отменён</option>
        </select>
      </div>

      {/* Таблица */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-border bg-panel/80">
              {["#", "Клиент", "Город", "Сумма", "Статус", "Источник", "Дата"].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left font-sans text-xs uppercase tracking-widest text-muted whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center font-mono text-muted text-sm">
                  Заказов не найдено
                </td>
              </tr>
            ) : (
              filtered.map((order, i) => (
                <tr
                  key={order.id}
                  className={clsx(
                    "row-animate border-b border-border/50 transition-colors hover:bg-accent/3",
                    i % 2 === 0 ? "bg-transparent" : "bg-panel/30"
                  )}
                  style={{ animationDelay: `${Math.min(i * 20, 400)}ms` }}
                >
                  {/* ID */}
                  <td className="px-4 py-3 font-mono text-xs text-muted whitespace-nowrap">
                    {order.number ?? `#${order.id}`}
                  </td>

                  {/* Клиент */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="font-sans text-white text-sm">
                      {order.customer_first_name} {order.customer_last_name}
                    </div>
                    <div className="font-mono text-xs text-muted mt-0.5">
                      {order.customer_phone}
                    </div>
                  </td>

                  {/* Город */}
                  <td className="px-4 py-3 font-sans text-sm text-white whitespace-nowrap">
                    {order.delivery_city ?? "—"}
                  </td>

                  {/* Сумма */}
                  <td className="px-4 py-3 font-mono text-sm text-accent whitespace-nowrap">
                    {Number(order.total_sum).toLocaleString("ru-RU")} ₸
                  </td>

                  {/* Статус */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <StatusBadge status={order.status} />
                  </td>

                  {/* UTM */}
                  <td className={clsx(
                    "px-4 py-3 font-mono text-xs whitespace-nowrap",
                    UTM_COLORS[order.utm_source ?? ""] ?? "text-muted"
                  )}>
                    {order.utm_source ?? "—"}
                  </td>

                  {/* Дата */}
                  <td className="px-4 py-3 font-mono text-xs text-muted whitespace-nowrap">
                    {format(new Date(order.created_at), "d MMM, HH:mm", { locale: ru })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="font-mono text-xs text-muted text-right">
        Показано {filtered.length} из {orders.length} заказов
      </p>
    </div>
  );
}
