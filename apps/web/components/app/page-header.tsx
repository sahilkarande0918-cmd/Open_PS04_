export function PageHeader({ eyebrow, title, children, actions }: { eyebrow?: string; title: string; children?: React.ReactNode; actions?: React.ReactNode }) {
  return <div className="flex flex-wrap items-end justify-between gap-4">
    <div className="min-w-0">
      {eyebrow && <p className="studio-eyebrow mb-2">{eyebrow}</p>}
      <h1 className="studio-heading">{title}</h1>
      {children && <p className="mt-2 max-w-[68ch] text-[14px] leading-6 text-muted">{children}</p>}
    </div>
    {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
  </div>;
}

export function EmptyState({ icon, title, children, action }: { icon: React.ReactNode; title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return <div className="studio-panel flex flex-col items-center px-6 py-14 text-center">
    <span className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-surface-2 text-accent">{icon}</span>
    <h2 className="text-[18px] font-semibold tracking-[-.02em]">{title}</h2>
    <p className="mt-2 max-w-[46ch] text-[14px] leading-6 text-muted">{children}</p>
    {action && <div className="mt-6">{action}</div>}
  </div>;
}
