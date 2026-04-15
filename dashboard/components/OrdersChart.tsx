"use client";

import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";

type DataPoint = {
  date:    string;
  count:   number;
  revenue: number;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-panel border border-border rounded-lg p-3 shadow-xl text-xs font-mono">
      <p className="text-muted mb-2">
        {format(parseISO(label), "d MMM yyyy", { locale: ru })}
      </p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="leading-5">
          {p.name === "count" ? "Заказов:" : "Выручка:"}{" "}
          <span className="text-white font-bold">
            {p.name === "revenue"
              ? `${p.value.toLocaleString("ru-RU")} ₸`
              : p.value}
          </span>
        </p>
      ))}
    </div>
  );
};

export default function OrdersChart({ data }: { data: DataPoint[] }) {
  const formatted = data.map((d) => ({
    ...d,
    label: format(parseISO(d.date), "d MMM", { locale: ru }),
  }));

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={formatted} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#00ff9d" stopOpacity={0.6} />
              <stop offset="100%" stopColor="#00ff9d" stopOpacity={0.05} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#21262d"
            vertical={false}
          />

          <XAxis
            dataKey="label"
            tick={{ fill: "#8b949e", fontSize: 11, fontFamily: "var(--font-mono)" }}
            axisLine={false}
            tickLine={false}
          />

          <YAxis
            yAxisId="count"
            orientation="left"
            tick={{ fill: "#8b949e", fontSize: 11, fontFamily: "var(--font-mono)" }}
            axisLine={false}
            tickLine={false}
            width={28}
          />

          <YAxis
            yAxisId="revenue"
            orientation="right"
            tick={{ fill: "#8b949e", fontSize: 11, fontFamily: "var(--font-mono)" }}
            axisLine={false}
            tickLine={false}
            width={70}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          />

          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />

          <Legend
            iconType="circle"
            iconSize={6}
            formatter={(val) => (
              <span style={{ color: "#8b949e", fontSize: 11, fontFamily: "var(--font-mono)" }}>
                {val === "count" ? "заказы" : "выручка ₸"}
              </span>
            )}
          />

          <Bar
            yAxisId="count"
            dataKey="count"
            fill="url(#barGrad)"
            stroke="#00ff9d"
            strokeWidth={1}
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />

          <Line
            yAxisId="revenue"
            dataKey="revenue"
            stroke="#f0a050"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#f0a050", stroke: "#0d1117", strokeWidth: 2 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
