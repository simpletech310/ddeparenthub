import Link from "next/link";

export interface HeroStat {
  value: string;
  label: string;
}

// Gradient hero panel with a row of stats — reused on every role dashboard.
export function StatHero({
  eyebrow,
  title,
  stats,
  cta,
}: {
  eyebrow: string;
  title?: string;
  stats: HeroStat[];
  cta?: { href: string; label: string };
}) {
  return (
    <section
      className="relative overflow-hidden rounded-3xl p-5 text-white shadow-lift"
      style={{ backgroundImage: "linear-gradient(135deg,#0a679c 0%,#00a2e8 45%,#019e7c 100%)" }}
    >
      <div aria-hidden className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/80">{eyebrow}</p>
      {title && <h2 className="mt-1 font-display text-xl font-bold">{title}</h2>}
      <div
        className="mt-3 grid gap-2"
        style={{ gridTemplateColumns: `repeat(${Math.min(stats.length, 5)}, minmax(0,1fr))` }}
      >
        {stats.map((s, i) => (
          <div key={i} className="rounded-2xl bg-white/15 px-2 py-3 text-center backdrop-blur">
            <p className="font-display text-xl font-bold leading-none">{s.value}</p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-white/75">{s.label}</p>
          </div>
        ))}
      </div>
      {cta && (
        <Link
          href={cta.href}
          className="mt-4 flex items-center justify-between rounded-2xl bg-white/15 px-3.5 py-2.5 text-sm font-medium backdrop-blur transition hover:bg-white/25"
        >
          <span>{cta.label}</span>
          <span className="font-display font-bold">→</span>
        </Link>
      )}
    </section>
  );
}
