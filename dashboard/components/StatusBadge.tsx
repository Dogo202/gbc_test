const MAP: Record<string, { label: string; cls: string }> = {
  "new":         { label: "Новый",    cls: "text-accent text-accent bg-accent/10 border-accent/30" },
  "in-progress": { label: "В работе", cls: "text-blue-400 bg-blue-400/10 border-blue-400/30" },
  "complete":    { label: "Выполнен", cls: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30" },
  "cancel":      { label: "Отменён",  cls: "text-red-400 bg-red-400/10 border-red-400/30" },
};

export default function StatusBadge({ status }: { status: string }) {
  const s = MAP[status] ?? { label: status, cls: "text-muted bg-dim border-dim" };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-xs ${s.cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80 shrink-0" />
      {s.label}
    </span>
  );
}
