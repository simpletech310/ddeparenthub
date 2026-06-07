import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import {
  listEnrollmentsByParent,
  listMyChildren,
  listMyDocuments,
  listMyGoals,
} from "@/lib/data/repos";
import { familyInsights, learningInsights } from "@/lib/data/insights";
import { Avatar } from "@/components/Avatar";

export default async function ParentDashboard() {
  const user = await requireRole("parent");
  const children = await listMyChildren(user);
  const docs = await listMyDocuments(user);
  const enrollments = await listEnrollmentsByParent(user.id);
  const goals = await listMyGoals(user);
  const insights = await familyInsights(user, user.familyId!);
  const learning = await learningInsights(user.id);
  const trendIcon = insights.trend === "up" ? "↗" : insights.trend === "down" ? "↘" : "→";

  const cards = [
    {
      href: "/parent/understand",
      title: "Understand",
      desc: "Upload an IEP or evaluation and get a plain-language breakdown.",
      stat: `${docs.length} doc${docs.length === 1 ? "" : "s"}`,
      grad: "linear-gradient(135deg,#00a2e8,#1a84ee)",
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M7 3h7l5 5v13H7V3zM14 3v5h5M9 13h6M9 17h6" />,
    },
    {
      href: "/parent/learn",
      title: "Learn",
      desc: "Take DDE's parent classes — built by our BCBAs.",
      stat: `${enrollments.length} event${enrollments.length === 1 ? "" : "s"}`,
      grad: "linear-gradient(135deg,#019e7c,#21b88f)",
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a2 2 0 012-2h7v16H6a2 2 0 00-2 2V5zM13 3h5a2 2 0 012 2v14a2 2 0 00-2-2h-5" />,
    },
    {
      href: "/parent/track",
      title: "Track",
      desc: "Log home observations against your child's goals.",
      stat: `${goals.length} goal${goals.length === 1 ? "" : "s"}`,
      grad: "linear-gradient(135deg,#ff7a59,#f85a32)",
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M4 19V5M4 19h16M8 16v-5M12 16V8M16 16v-3" />,
    },
  ];

  return (
    <div className="space-y-6">
      <section className="flex items-center gap-4">
        <Avatar name={user.name} src={user.avatarUrl} size="lg" ring />
        <div>
          <p className="eyebrow">Welcome back</p>
          <h1 className="mt-1 font-display text-3xl font-bold text-ink-900">
            Hi, {user.name.split(" ")[0]} 👋
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Understand the plan, learn the skills, track the growth.
          </p>
        </div>
      </section>

      {/* Data-driven snapshot — hero gradient */}
      <section
        className="relative overflow-hidden rounded-3xl p-5 text-white shadow-lift"
        style={{ backgroundImage: "linear-gradient(135deg,#0a679c 0%,#00a2e8 45%,#019e7c 100%)" }}
      >
        <div aria-hidden className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/80">Your family at a glance</p>
        <div className="mt-3 grid grid-cols-4 gap-2">
          <HeroStat value={String(insights.goals)} label="Goals" />
          <HeroStat value={String(insights.observations)} label="Home logs" />
          <HeroStat value={insights.avgRecentRating === null ? "—" : `${insights.avgRecentRating} ${trendIcon}`} label="Avg rating" />
          <HeroStat value={learning.latestDelta === null ? "—" : `${learning.latestDelta >= 0 ? "+" : ""}${learning.latestDelta}`} label="Class growth" />
        </div>
        {insights.goalsNeedingAttention > 0 && (
          <Link href="/parent/track" className="mt-4 flex items-center justify-between rounded-2xl bg-white/15 px-3.5 py-2.5 text-sm font-medium backdrop-blur transition hover:bg-white/25">
            <span>
              {insights.goalsNeedingAttention} goal{insights.goalsNeedingAttention === 1 ? "" : "s"} need a first note
            </span>
            <span className="font-display font-bold">Log →</span>
          </Link>
        )}
      </section>

      <section className="grid gap-3">
        {cards.map((c) => (
          <Link key={c.href} href={c.href} className="card card-hover flex items-center gap-4">
            <span className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl text-white shadow-soft" style={{ backgroundImage: c.grad, height: "3.25rem", width: "3.25rem" }}>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>{c.icon}</svg>
            </span>
            <span className="flex-1">
              <span className="flex items-center justify-between gap-2">
                <span className="font-display text-base font-bold text-ink-900">{c.title}</span>
                <span className="pill bg-brand-50 text-brand-700">{c.stat}</span>
              </span>
              <span className="mt-0.5 block text-sm text-ink-500">{c.desc}</span>
            </span>
            <svg className="h-5 w-5 shrink-0 text-ink-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </Link>
        ))}
      </section>

      <section className="card">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display font-bold text-ink-900">Your children</h2>
            <p className="text-sm text-ink-500">
              {children.length ? children.map((c) => c.displayName).join(", ") : "No children added yet."}
            </p>
          </div>
          <Link href="/parent/children" className="btn-ghost">Manage</Link>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <Link href="/parent/resources" className="card card-hover text-center">
          <p className="font-display font-bold text-ink-900">Resources</p>
          <p className="text-xs text-ink-400">Matched partners & classes</p>
        </Link>
        <Link href="/parent/family" className="card card-hover text-center">
          <p className="font-display font-bold text-ink-900">My family</p>
          <p className="text-xs text-ink-400">Parents & your DDE team</p>
        </Link>
      </section>
    </div>
  );
}

function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-white/15 px-2 py-3 text-center backdrop-blur">
      <p className="font-display text-xl font-bold leading-none">{value}</p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-white/75">{label}</p>
    </div>
  );
}
