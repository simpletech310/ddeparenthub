import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import {
  getBreakdownByDoc,
  listMyChildren,
  listMyDocuments,
} from "@/lib/data/repos";
import { childInsights } from "@/lib/data/insights";

function trendIcon(t: "up" | "flat" | "down" | null) {
  return t === "up" ? "↗" : t === "down" ? "↘" : t === "flat" ? "→" : "";
}

export default async function TrackPage() {
  const user = await requireRole("parent");
  const children = await listMyChildren(user);
  const childCards = await Promise.all(
    children.map(async (child) => ({ child, ins: await childInsights(user, child.id) }))
  );

  // Meeting prep pulls upcoming dates + questions from this family's breakdowns.
  const docs = await listMyDocuments(user);
  const breakdowns = (await Promise.all(docs.map((d) => getBreakdownByDoc(user, d.id)))).filter(Boolean);
  const today = new Date();
  const upcomingDates = breakdowns
    .flatMap((b) => b!.payload.keyDates)
    .filter((d) => new Date(d.date) >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
  const questions = breakdowns.flatMap((b) => b!.payload.questionsToAsk).slice(0, 6);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-brand-900">Track</h1>
        <p className="text-sm text-ink-600">
          Each child has their own goals and progress. Tap a child to log a quick note, add a photo, or
          manage their goals.
        </p>
      </div>

      <section className="space-y-3">
        {childCards.map(({ child, ins }) => {
          return (
            <Link
              key={child.id}
              href={`/parent/track/child/${child.id}`}
              className="card block hover:border-brand-300"
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold text-brand-900">{child.displayName}</p>
                <span className="pill bg-brand-50 text-ink-600">Open →</span>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                <Mini value={String(ins.goals)} label="Goals" />
                <Mini value={String(ins.observations)} label="Logs" />
                <Mini value={String(ins.logsLast7Days)} label="This week" />
                <Mini
                  value={ins.avgRecentRating === null ? "—" : `${ins.avgRecentRating} ${trendIcon(ins.trend)}`}
                  label="Avg"
                />
              </div>
              {ins.goalsNeedingAttention > 0 && (
                <p className="mt-2 text-xs text-accent-700">
                  {ins.goalsNeedingAttention === 1
                    ? "1 goal needs a first note."
                    : `${ins.goalsNeedingAttention} goals need a first note.`}
                </p>
              )}
            </Link>
          );
        })}
        {!children.length && (
          <p className="card text-sm text-ink-500">
            Add a child in{" "}
            <Link href="/parent/children" className="underline">Children</Link> to start tracking.
          </p>
        )}
      </section>

      <section className="card">
        <h2 className="font-semibold text-brand-900">Meeting prep</h2>
        <p className="text-sm text-ink-600">Bring these to your next school meeting.</p>

        <h3 className="mt-3 text-xs font-semibold uppercase tracking-wide text-ink-500">Upcoming dates</h3>
        {upcomingDates.length ? (
          <ul className="mt-1 space-y-1">
            {upcomingDates.map((d, i) => (
              <li key={i} className="flex items-center justify-between text-sm">
                <span className="text-brand-700">{d.label}</span>
                <span className="pill bg-brand-50 text-brand-700">{new Date(d.date).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-sm text-ink-400">No upcoming dates on file.</p>
        )}

        <h3 className="mt-3 text-xs font-semibold uppercase tracking-wide text-ink-500">Questions to ask</h3>
        {questions.length ? (
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-brand-700">
            {questions.map((q, i) => <li key={i}>{q}</li>)}
          </ul>
        ) : (
          <p className="mt-1 text-sm text-ink-400">Upload a document to generate suggested questions.</p>
        )}
      </section>
    </div>
  );
}

function Mini({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl bg-brand-50 px-1 py-2">
      <p className="text-base font-bold leading-none text-brand-900">{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-wide text-ink-500">{label}</p>
    </div>
  );
}
