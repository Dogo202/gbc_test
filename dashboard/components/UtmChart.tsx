"use client";

import type { Order } from "@/lib/supabase";

const UTM_COLORS: Record<string, string> = {
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
    <div className="flex flex-col gap-3">
      {sorted.map(([src, cnt]) => (
        <div key={src} className="flex items-center gap-3">
          <span
            className="font-mono text-xs w-20 text-right shrink-0"
            style={{ color: UTM_COLORS[src] ?? "#8b949e" }}
          >
            {src}
          </span>
          <div className="flex-1 h-5 bg-dim rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${(cnt / max) * 100}%`,
                background: UTM_COLORS[src] ?? "#8b949e",
                opacity: 0.75,
              }}
            />
          </div>
          <span className="font-mono text-xs text-white w-8 shrink-0">{cnt}</span>
        </div>
      ))}
    </div>
  );
}
