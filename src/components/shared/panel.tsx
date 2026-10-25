export function Panel({ title, action, children, className = "" }: { title: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section
      className={`relative overflow-hidden rounded-xl border bg-card ${className}`}
      style={{ backgroundImage: "var(--card-wash)" }}
    >
      <div className="relative flex items-center justify-between gap-3 border-b border-border/70 px-4 py-3">
        <h2 className="text-sm font-medium">{title}</h2>
        {action}
      </div>
      <div className="relative p-4">{children}</div>
    </section>
  );
}
