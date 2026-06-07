import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { getClass, getUser, listEnrollmentsByClass } from "@/lib/data/repos";
import { classRoster, lessonCheckPassRates } from "@/lib/data/reporting";
import { checkInAction } from "@/lib/staff/actions";

export default async function ClassRoster({ params }: { params: { classId: string } }) {
  await requireRole("staff");
  const cls = await getClass(params.classId);
  if (!cls) notFound();

  const enrollmentsRaw = await listEnrollmentsByClass(cls.id);
  const enrollments = await Promise.all(
    enrollmentsRaw.map(async (e) => ({ e, name: (await getUser(e.parentId))?.name ?? "Parent" }))
  );
  const roster = await classRoster(cls.id);
  const passRates = await lessonCheckPassRates(cls.id);
  const present = enrollmentsRaw.filter((e) => e.attendance === "present").length;
  const deltas = roster.map((r) => r.delta).filter((d): d is number => d !== null);
  const avgDelta = deltas.length
    ? Math.round((deltas.reduce((a, b) => a + b, 0) / deltas.length) * 10) / 10
    : null;

  return (
    <div className="space-y-5">
      <div>
        <Link href="/staff" className="text-sm text-ink-600">← Dashboard</Link>
        <h1 className="mt-1 text-xl font-bold text-brand-900">{cls.title}</h1>
        <p className="text-sm text-ink-600">{cls.schedule}</p>
      </div>

      {/* Event details */}
      {cls.coverImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cls.coverImage} alt="" className="h-36 w-full rounded-2xl object-cover" />
      )}
      <section className="card space-y-1 text-sm">
        <p className="text-brand-800">
          <span className="font-medium">When:</span>{" "}
          {new Date(cls.startsAt).toLocaleString(undefined, { dateStyle: "full", timeStyle: "short" })}
        </p>
        <p className="text-brand-800">
          <span className="font-medium">Delivery:</span>{" "}
          {cls.deliveryMode === "telehealth" ? "Telehealth" : "In person"}
        </p>
        {cls.deliveryMode === "in_person" && cls.address && (
          <p className="text-brand-800"><span className="font-medium">Address:</span> {cls.address}</p>
        )}
        {cls.deliveryMode === "telehealth" && cls.meetingLink && (
          <p className="text-brand-800">
            <span className="font-medium">Meeting link:</span>{" "}
            <a href={cls.meetingLink} className="text-ink-600 underline" target="_blank" rel="noreferrer">{cls.meetingLink}</a>
          </p>
        )}
        {cls.description && <p className="text-ink-600">{cls.description}</p>}
      </section>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="RSVP'd" value={String(enrollments.length)} />
        <Stat label="Present" value={`${present}/${enrollments.length}`} />
        <Stat label="Avg delta" value={avgDelta === null ? "—" : `${avgDelta >= 0 ? "+" : ""}${avgDelta}`} />
      </div>

      {/* Check-in */}
      <section className="card">
        <h2 className="mb-2 font-semibold text-brand-900">Attendance check-in</h2>
        <ul className="space-y-2">
          {enrollments.map(({ e, name }) => {
            return (
              <li key={e.id} className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-brand-800">{name}</p>
                  <p className="text-[11px] text-ink-400">
                    {e.attendance === "present"
                      ? `Checked in${e.checkedInAt ? " " + new Date(e.checkedInAt).toLocaleTimeString() : ""}`
                      : e.attendance === "absent"
                      ? "Marked absent"
                      : "Not checked in"}
                  </p>
                </div>
                <div className="flex gap-1">
                  {(["present", "absent"] as const).map((s) => (
                    <form action={checkInAction} key={s}>
                      <input type="hidden" name="classId" value={cls.id} />
                      <input type="hidden" name="enrollmentId" value={e.id} />
                      <input type="hidden" name="status" value={s} />
                      <button
                        type="submit"
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                          e.attendance === s
                            ? s === "present"
                              ? "bg-brand-600 text-white"
                              : "bg-accent-500 text-white"
                            : "bg-brand-50 text-ink-600 hover:bg-brand-100"
                        }`}
                      >
                        {s === "present" ? "Present" : "Absent"}
                      </button>
                    </form>
                  ))}
                </div>
              </li>
            );
          })}
          {!enrollments.length && <li className="text-sm text-ink-400">No RSVPs yet.</li>}
        </ul>
      </section>

      {/* Scores */}
      <section className="card overflow-x-auto">
        <h2 className="mb-2 font-semibold text-brand-900">Roster & scores</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-ink-500">
              <th className="py-1.5">Parent</th><th className="py-1.5">Pre</th><th className="py-1.5">Post</th><th className="py-1.5">Δ</th><th className="py-1.5">Done</th>
            </tr>
          </thead>
          <tbody>
            {roster.map((r) => (
              <tr key={r.enrollmentId} className="border-t border-brand-50">
                <td className="py-2 font-medium text-brand-800">{r.parentName}</td>
                <td className="py-2 text-ink-600">{r.preScore === null ? "—" : `${r.preScore}/${r.preMax}`}</td>
                <td className="py-2 text-ink-600">{r.postScore === null ? "—" : `${r.postScore}/${r.postMax}`}</td>
                <td className="py-2 font-semibold text-brand-800">{r.delta === null ? "—" : `${r.delta >= 0 ? "+" : ""}${r.delta}`}</td>
                <td className="py-2 text-ink-600">{r.completionPct}%</td>
              </tr>
            ))}
            {!roster.length && <tr><td colSpan={5} className="py-3 text-center text-ink-400">No parents enrolled yet.</td></tr>}
          </tbody>
        </table>
      </section>

      <section className="card">
        <h2 className="mb-2 font-semibold text-brand-900">Where parents struggled</h2>
        <ul className="space-y-2">
          {passRates.map((p, i) => (
            <li key={i}>
              <div className="flex items-center justify-between text-sm">
                <span className="text-brand-700">{p.lessonTitle}</span>
                <span className="text-xs text-ink-500">{p.passRate}% pass ({p.attempts})</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-brand-100">
                <div className={`h-full ${p.passRate >= 60 ? "bg-brand-500" : "bg-accent-500"}`} style={{ width: `${p.passRate}%` }} />
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-ink-400">Learning scores only — never any parent's private documents.</p>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card text-center">
      <p className="text-xs uppercase tracking-wide text-ink-500">{label}</p>
      <p className="text-xl font-bold text-brand-900">{value}</p>
    </div>
  );
}
