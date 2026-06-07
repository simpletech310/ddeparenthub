import Link from "next/link";

// Friendly empty state — soft gradient icon bubble, title, hint, optional CTA.
export function EmptyState({
  icon = "sparkle",
  title,
  hint,
  cta,
}: {
  icon?: "sparkle" | "doc" | "users" | "calendar" | "chart" | "search";
  title: string;
  hint?: string;
  cta?: { href: string; label: string };
}) {
  return (
    <div className="card flex flex-col items-center px-6 py-10 text-center">
      <span
        className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-soft"
        style={{ backgroundImage: "linear-gradient(135deg,#36b3f7,#21b88f)" }}
      >
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          {ICONS[icon]}
        </svg>
      </span>
      <p className="font-display font-bold text-ink-900">{title}</p>
      {hint && <p className="mt-1 max-w-xs text-sm text-ink-500">{hint}</p>}
      {cta && (
        <Link href={cta.href} className="btn-primary mt-4">
          {cta.label}
        </Link>
      )}
    </div>
  );
}

const ICONS: Record<string, JSX.Element> = {
  sparkle: <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l1.8 4.6L18 9l-4.2 1.4L12 15l-1.8-4.6L6 9l4.2-1.4L12 3zM18 14l.9 2.3L21 17l-2.1.7L18 20l-.9-2.3L15 17l2.1-.7L18 14z" />,
  doc: <path strokeLinecap="round" strokeLinejoin="round" d="M7 3h7l5 5v13H7V3zM14 3v5h5M9 13h6M9 17h6" />,
  users: <path strokeLinecap="round" strokeLinejoin="round" d="M16 19v-1a4 4 0 00-4-4H8a4 4 0 00-4 4v1M10 7a3 3 0 100 6 3 3 0 000-6zM20 19v-1a3 3 0 00-2-2.8M16 7.2a3 3 0 010 5.6" />,
  calendar: <path strokeLinecap="round" strokeLinejoin="round" d="M7 4v3M17 4v3M4 9h16M5 7h14a1 1 0 011 1v11a1 1 0 01-1 1H5a1 1 0 01-1-1V8a1 1 0 011-1z" />,
  chart: <path strokeLinecap="round" strokeLinejoin="round" d="M4 19V5M4 19h16M8 16v-5M12 16V8M16 16v-3" />,
  search: <path strokeLinecap="round" strokeLinejoin="round" d="M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3" />,
};
