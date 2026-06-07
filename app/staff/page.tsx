import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { accessibleFamilyIds } from "@/lib/auth/access";
import { getFamily, listFamilyParents } from "@/lib/data/families";
import {
  listClassesByStaff,
  listCoursesByOwner,
  listEnrollmentsByClass,
  listFamilyChildren,
} from "@/lib/data/repos";
import { familyInsights } from "@/lib/data/insights";

export default async function StaffDashboard() {
  const user = await requireRole("staff");
  const courses = await listCoursesByOwner(user.id);
  const classesRaw = await listClassesByStaff(user.id);
  const classes = await Promise.all(
    classesRaw.map(async (cls) => ({ cls, count: (await listEnrollmentsByClass(cls.id)).length }))
  );
  const familyIds = await accessibleFamilyIds(user);
  const familyCards = (await Promise.all(
    familyIds.map(async (fid) => ({
      fid,
      fam: await getFamily(fid),
      ins: await familyInsights(user, fid),
      children: await listFamilyChildren(user, fid),
    }))
  )).filter((x) => x.fam);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-brand-900">Welcome, {user.name.split(" ")[0]}</h1>
          <p className="text-sm text-ink-600">Support your families and run parent classes.</p>
        </div>
        <Link href="/staff/courses/new" className="btn-primary">
          + New course
        </Link>
      </div>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-600">
          My families
        </h2>
        {familyCards.length ? (
          <ul className="grid gap-2 sm:grid-cols-2">
            {familyCards.map(({ fid, fam, ins, children }) => {
              if (!fam) return null;
              return (
                <li key={fid}>
                  <Link href={`/staff/families/${fid}`} className="card block hover:border-brand-300">
                    <p className="font-semibold text-brand-900">{fam.name}</p>
                    <p className="text-xs text-ink-500">
                      {children.map((c) => c.displayName).join(", ") || "No children"}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <span className="pill bg-brand-50 text-brand-700">{ins.goals} goals</span>
                      {ins.goalsNeedingAttention > 0 && (
                        <span className="pill bg-accent-100 text-accent-700">
                          {ins.goalsNeedingAttention} need attention
                        </span>
                      )}
                      <span className="pill bg-brand-50 text-ink-600">{ins.observations} logs</span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="card text-sm text-ink-500">
            No families assigned yet. An administrator assigns families to you.
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-600">
          My courses
        </h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {courses.map((c) => (
            <li key={c.id}>
              <Link href={`/staff/courses/${c.id}`} className="card block hover:border-brand-300">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-brand-900">{c.title}</p>
                  <span
                    className={`pill ${
                      c.status === "published"
                        ? "bg-brand-50 text-brand-700"
                        : "bg-accent-50 text-accent-700"
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-ink-600 line-clamp-2">{c.description}</p>
                {c.isTemplate && (
                  <span className="mt-2 inline-block pill bg-brand-100 text-brand-700">Template</span>
                )}
              </Link>
            </li>
          ))}
          {!courses.length && (
            <li className="card text-sm text-ink-500">
              No courses yet. Create one or generate with AI.
            </li>
          )}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-600">
          My classes
        </h2>
        <ul className="space-y-2">
          {classes.map(({ cls, count }) => {
            return (
              <li key={cls.id}>
                <Link
                  href={`/staff/classes/${cls.id}`}
                  className="card flex items-center justify-between hover:border-brand-300"
                >
                  <div>
                    <p className="font-semibold text-brand-900">{cls.title}</p>
                    <p className="text-xs text-ink-500">{cls.schedule}</p>
                  </div>
                  <span className="pill bg-brand-50 text-brand-700">
                    {count}/{cls.capacity} enrolled
                  </span>
                </Link>
              </li>
            );
          })}
          {!classes.length && (
            <li className="card text-sm text-ink-500">
              No classes yet. Open a course and launch one.
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}
