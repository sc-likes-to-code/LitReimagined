import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="mb-14 max-w-2xl">
      <p className="eyebrow mb-4">{eyebrow}</p>
      <h1 className="font-display text-5xl tracking-tight sm:text-6xl">{title}</h1>
      {children && (
        <div className="text-muted mt-5 max-w-lg leading-relaxed">{children}</div>
      )}
    </header>
  );
}
