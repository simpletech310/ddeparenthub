import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import {
  listEnrollmentsByParent,
  listMyChildren,
  listMyDocuments,
  listMyGoals,
} from "@/lib/data/repos";
import { familyInsights, learningInsights } from "@/lib/data/insights";

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
      stat: `${docs.length} document${docs.length === 1 ? "" : "s"}`,
      cls: "bg-brand-600",
    },
    {
      href: "/parent/learn",
      title: "Learn",
      desc: "Take DDE's parent classes — built by our BCBAs.",
      stat: `${enrollments.length} class${enrollments.length === 1 ? "" : "es"}`,
      cls: "bg-accent-500",
    },
    {
      href: "/parent/track",
      title: "Track",
      desc: "Log home observations against your child's goals.",
      stat: `${goals.length} goal${goals.length === 1 ? "" : "s"}`,
      cls: "bg-brand-500",
    },
  ];

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-xl font-bold text-brand-900">
          Welcome, {user.name.split(" ")[0]} 👋
        </h1>
        <p className="mt-1 text-sm text-brand-600">
          One connected loop: understand the plan, learn the skills, track the growth.
        </p>
      </section>

      {/* Data-driven snapshot */}
      <section className="rounded-2xl border border-brand-100 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand-600">
          Your family at a glance
        </h2>
        <div className="grid grid-cols-4 gap-2 text-center">
          <Stat value={String(insights.goals)} label="Goals" />
          <Stat value={String(insights.observations)} label="Home logs" />
          <Stat
            value={insights.avgRecentRating === null ? "—" : `${insights.avgRecentRating} ${trendIcon}`}
            label="Avg rating"
          />
          <Stat
            value={learning.latestDelta === null ? "—" : `${learning.latestDelta >= 0 ? "+" : ""}${learning.latestDelta}`}
            label="Class growth"
          />
        </div>
        {insights.goalsNeedingAttention > 0 && (
          <p className="mt-3 rounded-lg bg-accent-50 p-2 text-xs text-accent-700">
            {insights.goalsNeedingAttention} goal{insights.goalsNeedingAttention === 1 ? "" : "s"} have no
            home observations yet —{" "}
            <Link href="/parent/track" className="font-semibold underline">log one in Track</Link>.
          </p>
        )}
      </section>

      <section className="grid gap-3">
        {cards.map((c) => (
          <Link key={c.href} href={c.href} className="card flex items-center gap-4 hover:border-brand-300">
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${c.cls} text-lg font-bold text-white`}>
              {c.title[0]}
            </span>
            <span className="flex-1">
              <span className="flex items-center justify-between">
                <span className="font-semibold text-brand-900">{c.title}</span>
                <span className="pill bg-brand-50 text-brand-600">{c.stat}</span>
              </span>
              <span className="mt-0.5 block text-sm text-brand-600">{c.desc}</span>
            </span>
          </Link>
        ))}
      </section>

      <section className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-brand-900">Your children</h2>
            <p className="text-sm text-brand-600">
              {children.length
                ? children.map((c) => c.displayName).join(", ")
                : "No children added yet."}
            </p>
          </div>
          <Link href="/parent/children" className="btn-ghost">
            Manage
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <Link href="/parent/resources" className="card text-center hover:border-brand-300">
          <p className="font-semibold text-brand-900">Resources</p>
          <p className="text-xs text-brand-500">Matched partners & classes</p>
        </Link>
        <Link href="/parent/family" className="card text-center hover:border-brand-300">
          <p className="font-semibold text-brand-900">My family</p>
          <p className="text-xs text-brand-500">Parents & your DDE team</p>
        </Link>
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl bg-brand-50 px-2 py-3">
      <p className="text-lg font-bold leading-none text-brand-900">{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-wide text-brand-500">{label}</p>
    </div>
  );
}
