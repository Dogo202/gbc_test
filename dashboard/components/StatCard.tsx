import { ReactNode } from "react";

type Props = {
  label:   string;
  value:   string;
  sub?:    string;
  icon?:   ReactNode;
  accent?: boolean;
};

export default function StatCard({ label, value, sub, icon, accent }: Props) {
  return (
    <div className={`relative overflow-hidden rounded-xl border p-5 flex flex-col gap-3 ${
      accent ? "border-accent/30 bg-accent/5 glow" : "border-border bg-panel"
    }`}>
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-20"
           style={{ background: accent ? "#00ff9d" : "rgba(255,255,255,0.05)" }} />

      <div className="flex items-center justify-between">
        <span className="font-sans text-xs uppercase tracking-widest text-muted">{label}</span>
        {icon && (
          <span className={`${accent ? "text-accent" : "text-muted"}`}>{icon}</span>
        )}
      </div>

      <span className={`font-mono text-3xl font-bold leading-none ${accent ? "text-accent" : "text-white"}`}>
        {value}
      </span>

      {sub && <span className="font-sans text-xs text-muted">{sub}</span>}
    </div>
  );
}
