import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { getClass, getEnrollment, seatsRemaining } from "@/lib/data/repos";
import { enrollAction } from "@/lib/learn/actions";

export default async function ClassDetail({
  params,
  searchParams,
}: {
  params: { classId: string };
  searchParams: { error?: string };
}) {
  const user = await requireRole("parent");
  const cls = await getClass(params.classId);
  if (!cls) notFound();

  const enrollment = await getEnrollment(cls.id, user.id);
  const seats = await seatsRemaining(cls.id);
  const course = cls.courseSnapshot.course;
  const lessons = cls.courseSnapshot.lessons;
  const when = new Date(cls.startsAt).toLocaleString(undefined, { dateStyle: "full", timeStyle: "short" });

  return (
    <div className="space-y-5">
      <div>
        <Link href="/parent/learn" className="text-sm text-brand-600">← Events</Link>
      </div>

      {cls.coverImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cls.coverImage} alt="" className="h-44 w-full rounded-2xl object-cover" />
      )}

      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-brand-900">{cls.title}</h1>
          <span className={`pill ${cls.deliveryMode === "telehealth" ? "bg-brand-100 text-brand-700" : "bg-accent-100 text-accent-700"}`}>
            {cls.deliveryMode === "telehealth" ? "Telehealth" : "In person"}
          </span>
        </div>
        <p className="mt-1 text-sm font-medium text-brand-700">{when}</p>
        {cls.schedule && <p className="text-xs text-brand-500">{cls.schedule}</p>}
      </div>

      <section className="card">
        <h2 className="font-semibold text-brand-900">About this event</h2>
        <p className="mt-1 text-sm text-brand-700">{cls.description || course.description}</p>
        <p className="mt-2 text-sm text-brand-700">
          <span className="font-medium">What you'll gain:</span> {course.outcomes}
        </p>
        <p className="mt-2 text-xs text-brand-500">Estimated time: {course.estimatedDuration}</p>
      </section>

      {/* Join info — only after RSVP */}
      {enrollment && (
        <section className="rounded-2xl border border-brand-200 bg-brand-50 p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-brand-800">You're RSVP'd ✓</h2>
            {enrollment.attendance === "present" && (
              <span className="pill bg-brand-600 text-white">Checked in</span>
            )}
          </div>
          {cls.deliveryMode === "telehealth" ? (
            cls.meetingLink ? (
              <a href={cls.meetingLink} target="_blank" rel="noreferrer" className="btn-primary mt-3 inline-flex">
                Join the meeting
              </a>
            ) : (
              <p className="mt-2 text-sm text-brand-600">The meeting link will appear here before the event.</p>
            )
          ) : (
            <p className="mt-2 text-sm text-brand-700">
              <span className="font-medium">Where:</span> {cls.address || "Address to be confirmed."}
            </p>
          )}
        </section>
      )}

      <section className="card">
        <h2 className="mb-2 font-semibold text-brand-900">Course included</h2>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-brand-700">
          <li className="font-medium text-brand-600">Pre-test (sets your baseline)</li>
          {lessons.map((l) => <li key={l.id}>{l.title}</li>)}
          <li className="font-medium text-brand-600">Post-test (measures your growth)</li>
        </ol>
      </section>

      {searchParams.error && (
        <p className="rounded-xl bg-accent-50 p-3 text-sm text-accent-700">{searchParams.error}</p>
      )}

      {enrollment ? (
        <Link href={`/parent/learn/${cls.id}/play`} className="btn-primary w-full">
          {enrollment.status === "completed" ? "View results" : "Start the course"}
        </Link>
      ) : seats > 0 ? (
        <form action={enrollAction}>
          <input type="hidden" name="classId" value={cls.id} />
          <button className="btn-primary w-full" type="submit">RSVP ({seats} seats left)</button>
        </form>
      ) : (
        <button className="btn w-full bg-brand-100 text-brand-400" disabled>This event is full</button>
      )}
    </div>
  );
}
