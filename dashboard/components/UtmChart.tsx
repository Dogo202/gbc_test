"use client";

import type { Order } from "@/lib/supabase";

const COLORS: Record<string, string> = {
  instagram: "#ec4899",
  google:    "#60a5fa",
  tiktok:    "#22d3ee",
  direct:    "#8b949e",
  referral:  "#fbbf24",
};

export default function UtmChart({ orders }: { orders: Order[] }) {
  const counts = new Map<string, number>();
  for (const o of orders) {
    const src = o.utm_source ?? "direct";
    counts.set(src, (counts.get(src) ?? 0) + 1);
  }

  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const max = sorted[0]?.[1] ?? 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {sorted.map(([src, cnt]) => (
        <div key={src} style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: COLORS[src] ?? "#8b949e", fontFamily: "monospace", fontSize: 12, width: 72, textAlign: "right", flexShrink: 0 }}>
            {src}
          </span>
          <div style={{ flex: 1, height: 20, background: "#30363d", borderRadius: 999, overflow: "hidden" }}>
            <div style={{
              width: `${(cnt / max) * 100}%`,
              height: "100%",
              background: COLORS[src] ?? "#8b949e",
              borderRadius: 999,
              opacity: 0.75,
              transition: "width 0.7s ease",
            }} />
          </div>
          <span style={{ color: "#fff", fontFamily: "monospace", fontSize: 12, width: 28, flexShrink: 0 }}>{cnt}</span>
        </div>
      ))}
    </div>
  );
}
