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
import { SocialLinks } from "@/components/SocialLinks";

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
  const activePartners = partners.filter((p) => p.status === "active");
  const deltas = aggregates.map((a) => a.avgDelta).filter((d): d is number => d !== null);
  const avgDelta = deltas.length ? Math.round((deltas.reduce((a, b) => a + b, 0) / deltas.length) * 10) / 10 : null;

  const quick = [
    { href: "/admin/families", title: "Families", desc: "Create, assign staff", icon: "👨‍👩‍👧", grad: "from-brand-100 to-brand-50" },
    { href: "/admin/partners", title: "Partners", desc: "Directory & matches", icon: "🤝", grad: "from-accent-100 to-accent-50" },
    { href: "/admin/users", title: "Users", desc: "Staff & parents", icon: "👥", grad: "from-brand-100 to-accent-50" },
    { href: "/admin/reporting", title: "Reporting", desc: "Outcomes & deltas", icon: "📊", grad: "from-accent-100 to-brand-50" },
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
          { value: String(activePartners.length), label: "Partners" },
          { value: avgDelta === null ? "—" : `${avgDelta >= 0 ? "+" : ""}${avgDelta}`, label: "Avg growth" },
        ]}
      />

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {quick.map((q) => (
          <Link key={q.href} href={q.href} className="card card-hover flex flex-col gap-2">
            <span className={`grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br ${q.grad} text-xl ring-1 ring-brand-100`}>
              {q.icon}
            </span>
            <div>
              <p className="font-display font-bold text-ink-900">{q.title}</p>
              <p className="text-xs text-ink-400">{q.desc}</p>
            </div>
          </Link>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="lg:col-span-3">
          <h2 className="eyebrow mb-2">Recent activity</h2>
          <ActivityFeed items={activity} />
        </section>

        <section className="lg:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="eyebrow">Partner spotlight</h2>
            <Link href="/admin/partners" className="text-xs font-medium text-brand-600 hover:text-brand-700">Manage →</Link>
          </div>
          {activePartners.length === 0 ? (
            <p className="card text-sm text-ink-500">No partners yet.</p>
          ) : (
            <ul className="space-y-2">
              {activePartners.slice(0, 4).map((p) => (
                <li key={p.id} className="card flex items-center gap-3 py-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-brand-100 to-accent-100 ring-1 ring-brand-100">
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span aria-hidden>🤝</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/partners/${p.id}`} className="block truncate font-semibold text-ink-900 hover:text-brand-700">
                      {p.name}
                    </Link>
                    <p className="truncate text-xs text-ink-500">{p.category || "Partner"}</p>
                  </div>
                  <SocialLinks social={p.social} size="sm" />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
