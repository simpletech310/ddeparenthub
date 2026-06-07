import Link from "next/link";

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
  backHref,
  backLabel,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: { href: string; label: string };
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        {backHref && (
          <Link href={backHref} className="text-sm font-medium text-brand-600 hover:text-brand-700">
            ← {backLabel ?? "Back"}
          </Link>
        )}
        {eyebrow && <p className="eyebrow mt-1">{eyebrow}</p>}
        <h1 className="mt-0.5 font-display text-2xl font-bold text-ink-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-500">{subtitle}</p>}
      </div>
      {action && (
        <Link href={action.href} className="btn-primary shrink-0">
          {action.label}
        </Link>
      )}
    </div>
  );
}
