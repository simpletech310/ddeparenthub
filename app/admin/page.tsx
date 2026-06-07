import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { listUsers } from "@/lib/data/repos";
import { listFamilies } from "@/lib/data/families";
import { listPartners } from "@/lib/data/partners";
import { courseAggregates } from "@/lib/data/reporting";
import { recentActivity } from "@/lib/data/activity";
import { StatHero } from "@/components/StatHero";
import { ActivityFeed } from "@/components/ActivityFeed";
import { PageHeader } from "@/components/PageHeader";

export default async function AdminDashboard() {
  const user = await requireRole("admin");
  const [users, families, partners, aggregates, activity] = await Promise.all([
    listUsers(),
    listFamilies(),
    listPartners(true),
    courseAggregates(),
    recentActivity(user, 8),
  ]);
  const parents = users.filter((u) => u.role === "parent").length;
  const staff = users.filter((u) => u.role === "staff").length;
  const deltas = aggregates.map((a) => a.avgDelta).filter((d): d is number => d !== null);
  const avgDelta = deltas.length ? Math.round((deltas.reduce((a, b) => a + b, 0) / deltas.length) * 10) / 10 : null;

  const quick = [
    { href: "/admin/families", title: "Families", desc: "Create, assign staff", icon: "👨‍👩‍👧" },
    { href: "/admin/partners", title: "Partners", desc: "Directory & matches", icon: "🤝" },
    { href: "/admin/users", title: "Users", desc: "Staff & parents", icon: "👥" },
    { href: "/admin/reporting", title: "Reporting", desc: "Outcomes & deltas", icon: "📊" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Administration" title={`Welcome, ${user.name.split(" ")[0]}`} subtitle="Your organization at a glance." />

      <StatHero
        eyebrow="Organization"
        stats={[
          { value: String(families.length), label: "Families" },
          { value: String(parents), label: "Parents" },
          { value: String(staff), label: "Staff" },
          { value: String(partners.filter((p) => p.status === "active").length), label: "Partners" },
          { value: avgDelta === null ? "—" : `${avgDelta >= 0 ? "+" : ""}${avgDelta}`, label: "Avg growth" },
        ]}
      />

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {quick.map((q) => (
          <Link key={q.href} href={q.href} className="card card-hover text-center">
            <div className="text-2xl">{q.icon}</div>
            <p className="mt-1 font-display font-bold text-ink-900">{q.title}</p>
            <p className="text-xs text-ink-400">{q.desc}</p>
          </Link>
        ))}
      </section>

      <section>
        <h2 className="eyebrow mb-2">Recent activity</h2>
        <ActivityFeed items={activity} />
      </section>
    </div>
  );
}
