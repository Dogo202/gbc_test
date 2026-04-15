import clsx from "clsx";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  new:          { label: "Новый",      color: "text-accent    bg-accent/10    border-accent/30"  },
  "in-progress":{ label: "В работе",   color: "text-blue-400  bg-blue-400/10  border-blue-400/30" },
  complete:     { label: "Выполнен",   color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30" },
  cancel:       { label: "Отменён",    color: "text-red-400   bg-red-400/10   border-red-400/30" },
};

export default function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_MAP[status] ?? { label: status, color: "text-muted bg-dim border-dim" };
  return (
    <span className={clsx(
      "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs font-mono",
      cfg.color
    )}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {cfg.label}
    </span>
  );
}
