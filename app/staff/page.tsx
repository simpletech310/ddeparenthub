import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { accessibleFamilyIds } from "@/lib/auth/access";
import { getFamily } from "@/lib/data/families";
import {
  listClassesByStaff,
  listCoursesByOwner,
  listEnrollmentsByClass,
  listFamilyChildren,
} from "@/lib/data/repos";
import { familyInsights } from "@/lib/data/insights";
import { recentActivity } from "@/lib/data/activity";
import { Avatar } from "@/components/Avatar";
import { StatHero } from "@/components/StatHero";
import { ActivityFeed } from "@/components/ActivityFeed";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";

function fmt(iso: string) {
  return new Date(iso).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default async function StaffDashboard() {
  const user = await requireRole("staff");
  const courses = await listCoursesByOwner(user.id);
  const classesRaw = await listClassesByStaff(user.id);
  const classes = await Promise.all(classesRaw.map(async (cls) => ({ cls, count: (await listEnrollmentsByClass(cls.id)).length })));
  const familyIds = await accessibleFamilyIds(user);
  const familyCards = (await Promise.all(
    familyIds.map(async (fid) => ({ fid, fam: await getFamily(fid), ins: await familyInsights(user, fid), children: await listFamilyChildren(user, fid) }))
  )).filter((x) => x.fam);
  const activity = await recentActivity(user, 6);

  const totalGoals = familyCards.reduce((a, c) => a + c.ins.goals, 0);
  const needAttention = familyCards.reduce((a, c) => a + c.ins.goalsNeedingAttention, 0);
  const totalLogs = familyCards.reduce((a, c) => a + c.ins.observations, 0);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Staff" title={`Welcome, ${user.name.split(" ")[0]}`} subtitle="Support your families and run parent classes." action={{ href: "/staff/courses/new", label: "+ New course" }} />

      <StatHero
        eyebrow="Your caseload"
        stats={[
          { value: String(familyCards.length), label: "Families" },
          { value: String(needAttention), label: "Need attention" },
          { value: String(totalLogs), label: "Home logs" },
          { value: String(classes.length), label: "Events" },
        ]}
      />

      <section>
        <h2 className="eyebrow mb-2">My families</h2>
        {familyCards.length ? (
          <ul className="grid gap-3 sm:grid-cols-2">
            {familyCards.map(({ fid, fam, ins, children }) => {
              if (!fam) return null;
              return (
                <li key={fid}>
                  <Link href={`/staff/families/${fid}`} className="card card-hover block">
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        {children.slice(0, 3).map((c) => <Avatar key={c.id} name={c.displayName} src={c.avatarUrl} size="sm" ring />)}
                        {!children.length && <Avatar name={fam.name} size="sm" ring />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-display font-bold text-ink-900">{fam.name}</p>
                        <p className="truncate text-xs text-ink-400">{children.map((c) => c.displayName).join(", ") || "No children"}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1">
                      <span className="pill bg-brand-50 text-brand-700">{ins.goals} goals</span>
                      {ins.goalsNeedingAttention > 0 && <span className="pill bg-accent-100 text-accent-700">{ins.goalsNeedingAttention} need attention</span>}
                      <span className="pill bg-teal-50 text-teal-700">{ins.observations} logs</span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState icon="users" title="No families assigned yet" hint="An administrator assigns families to you. Once assigned, you'll see their progress here." />
        )}
      </section>

      <section>
        <h2 className="eyebrow mb-2">Recent activity</h2>
        <ActivityFeed items={activity} />
      </section>

      <section>
        <h2 className="eyebrow mb-2">My courses</h2>
        {courses.length ? (
          <ul className="grid gap-3 sm:grid-cols-2">
            {courses.map((c) => (
              <li key={c.id}>
                <Link href={`/staff/courses/${c.id}`} className="card card-hover block">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-display font-bold text-ink-900">{c.title}</p>
                    <span className={`pill ${c.status === "published" ? "bg-brand-50 text-brand-700" : "bg-accent-50 text-accent-700"}`}>{c.status}</span>
                  </div>
                  <p className="mt-1 text-sm text-ink-500 line-clamp-2">{c.description}</p>
                  {c.isTemplate && <span className="mt-2 inline-block pill bg-teal-100 text-teal-700">Template</span>}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon="doc" title="No courses yet" hint="Generate a course with AI or start from scratch." cta={{ href: "/staff/courses/new", label: "Create a course" }} />
        )}
      </section>

      <section>
        <h2 className="eyebrow mb-2">My events</h2>
        {classes.length ? (
          <ul className="space-y-2">
            {classes.map(({ cls, count }) => (
              <li key={cls.id}>
                <Link href={`/staff/classes/${cls.id}`} className="card card-hover flex items-center justify-between">
                  <div>
                    <p className="font-display font-bold text-ink-900">{cls.title}</p>
                    <p className="text-xs text-ink-400">{fmt(cls.startsAt)} · {cls.deliveryMode === "telehealth" ? "Telehealth" : "In person"}</p>
                  </div>
                  <span className="pill bg-brand-50 text-brand-700">{count}/{cls.capacity}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon="calendar" title="No events yet" hint="Open a course and launch an event to start a cohort." />
        )}
      </section>
    </div>
  );
}
