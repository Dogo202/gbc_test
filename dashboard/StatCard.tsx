"use client";

import { ReactNode } from "react";
import clsx from "clsx";

type Props = {
  label:     string;
  value:     string;
  sub?:      string;
  icon?:     ReactNode;
  accent?:   boolean;
  delay?:    number;
};

export default function StatCard({ label, value, sub, icon, accent, delay = 0 }: Props) {
  return (
    <div
      className={clsx(
        "relative overflow-hidden rounded-xl border p-5 flex flex-col gap-3 animate-slide-up",
        accent
          ? "border-accent/30 bg-accent/5 glow"
          : "border-border bg-panel"
      )}
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both", opacity: 0 }}
    >
      {/* фоновый круг */}
      <div
        className={clsx(
          "absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-20",
          accent ? "bg-accent" : "bg-white/5"
        )}
      />

      <div className="flex items-center justify-between">
        <span className="font-sans text-xs uppercase tracking-widest text-muted">{label}</span>
        {icon && (
          <span className={clsx("text-lg", accent ? "text-accent" : "text-muted")}>
            {icon}
          </span>
        )}
      </div>

      <span className={clsx(
        "font-mono text-3xl font-bold leading-none",
        accent ? "text-accent" : "text-white"
      )}>
        {value}
      </span>

      {sub && (
        <span className="font-sans text-xs text-muted">{sub}</span>
      )}
    </div>
  );
}
