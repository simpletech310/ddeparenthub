import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import {
  getClass,
  listEnrollmentsByParent,
  listUpcomingClasses,
  seatsRemaining,
} from "@/lib/data/repos";
import type { ClassOffering } from "@/lib/types";

function fmt(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
}

function DeliveryBadge({ cls }: { cls: ClassOffering }) {
  return (
    <span className={`pill ${cls.deliveryMode === "telehealth" ? "bg-brand-100 text-brand-700" : "bg-accent-100 text-accent-700"}`}>
      {cls.deliveryMode === "telehealth" ? "Telehealth" : "In person"}
    </span>
  );
}

export default async function LearnCatalog() {
  const user = await requireRole("parent");
  const myEnrollments = await listEnrollmentsByParent(user.id);
  const enrolledClassIds = new Set(myEnrollments.map((e) => e.classId));
  const myEvents = (await Promise.all(
    myEnrollments.map(async (e) => ({ e, cls: await getClass(e.classId) }))
  )).filter((x) => x.cls);
  const upcoming = await listUpcomingClasses();
  const upcomingCards = await Promise.all(
    upcoming.map(async (cls) => ({ cls, seats: await seatsRemaining(cls.id) }))
  );
  const next = upcoming[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-brand-900">Learn & events</h1>
        <p className="text-sm text-ink-600">ABA-informed parent classes and events from DDE's BCBAs.</p>
      </div>

      {/* Next event hero */}
      {next && (
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-600">Next event</h2>
          <Link href={`/parent/learn/${next.id}`} className="block overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm hover:border-brand-300">
            {next.coverImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={next.coverImage} alt="" className="h-40 w-full object-cover" />
            )}
            <div className="p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-brand-900">{next.title}</p>
                <DeliveryBadge cls={next} />
              </div>
              <p className="mt-1 text-sm font-medium text-brand-700">{fmt(next.startsAt)}</p>
              <p className="mt-1 text-sm text-ink-600 line-clamp-2">{next.description || next.courseSnapshot.course.description}</p>
              <span className="mt-3 inline-flex btn-primary">
                {enrolledClassIds.has(next.id) ? "View event" : "RSVP"}
              </span>
            </div>
          </Link>
        </section>
      )}

      {myEnrollments.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-600">My events</h2>
          <ul className="space-y-2">
            {myEvents.map(({ e, cls }) => {
              if (!cls) return null;
              return (
                <li key={e.id}>
                  <Link href={`/parent/learn/${cls.id}`} className="card flex items-center justify-between hover:border-brand-300">
                    <div>
                      <p className="font-semibold text-brand-900">{cls.title}</p>
                      <p className="text-xs text-ink-500">{fmt(cls.startsAt)}</p>
                    </div>
                    <span className="pill bg-brand-50 text-brand-700">
                      {e.attendance === "present" ? "Checked in" : e.status === "completed" ? "Completed" : "RSVP'd"}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-600">Upcoming events</h2>
        <ul className="space-y-2">
          {upcomingCards.map(({ cls, seats }) => {
            const enrolled = enrolledClassIds.has(cls.id);
            return (
              <li key={cls.id}>
                <Link href={`/parent/learn/${cls.id}`} className="card block hover:border-brand-300">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-brand-900">{cls.title}</p>
                    <DeliveryBadge cls={cls} />
                  </div>
                  <p className="mt-1 text-sm font-medium text-brand-700">{fmt(cls.startsAt)}</p>
                  <p className="mt-1 text-xs text-ink-500">
                    {enrolled ? "You've RSVP'd" : seats > 0 ? `${seats} seats left` : "Full"}
                  </p>
                </Link>
              </li>
            );
          })}
          {!upcoming.length && <li className="card text-sm text-ink-500">No upcoming events right now.</li>}
        </ul>
      </section>
    </div>
  );
}
