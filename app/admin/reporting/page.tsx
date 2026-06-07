import { requireRole } from "@/lib/auth/session";
import { courseAggregates } from "@/lib/data/reporting";

export default async function AdminReporting() {
  await requireRole("admin");
  const aggregates = await courseAggregates();

  const totalEnrollments = aggregates.reduce((a, c) => a + c.enrollments, 0);
  const totalCompletions = aggregates.reduce((a, c) => a + c.completions, 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-brand-900">Aggregate reporting</h1>
        <p className="text-sm text-ink-600">
          Org-wide learning outcomes. This report intentionally contains no document, breakdown, or
          goal data (§7 / §13).
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Courses" value={String(aggregates.length)} />
        <Stat label="Enrollments" value={String(totalEnrollments)} />
        <Stat label="Completions" value={String(totalCompletions)} />
      </div>

      <section className="card overflow-x-auto">
        <h2 className="mb-2 font-semibold text-brand-900">By course</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-ink-500">
              <th className="py-1.5">Course</th>
              <th className="py-1.5">Classes</th>
              <th className="py-1.5">Enrolled</th>
              <th className="py-1.5">Done</th>
              <th className="py-1.5">Avg Δ</th>
            </tr>
          </thead>
          <tbody>
            {aggregates.map((a) => (
              <tr key={a.courseId} className="border-t border-brand-50">
                <td className="py-2 font-medium text-brand-800">{a.courseTitle}</td>
                <td className="py-2 text-ink-600">{a.classes}</td>
                <td className="py-2 text-ink-600">{a.enrollments}</td>
                <td className="py-2 text-ink-600">{a.completions}</td>
                <td className="py-2 font-semibold text-brand-800">
                  {a.avgDelta === null ? "—" : `${a.avgDelta >= 0 ? "+" : ""}${a.avgDelta}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
