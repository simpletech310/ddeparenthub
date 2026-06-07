import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { getChildById, listGoalProgress, listGoalsForChild } from "@/lib/data/repos";
import { childInsights } from "@/lib/data/insights";
import { addGoalAction, deleteGoalAction } from "@/lib/parent/actions";

const RATING_LABEL = ["", "Struggling", "Emerging", "Developing", "Progressing", "Mastering"];

export default async function ChildTrack({ params }: { params: { childId: string } }) {
  const user = await requireRole("parent");
  const child = await getChildById(user, params.childId);
  if (!child) notFound();
  const goalsRaw = await listGoalsForChild(user, child.id);
  const goals = await Promise.all(
    goalsRaw.map(async (g) => ({ g, entries: await listGoalProgress(user, g.id) }))
  );
  const ins = await childInsights(user, child.id);
  const trendIcon = ins.trend === "up" ? "↗" : ins.trend === "down" ? "↘" : ins.trend === "flat" ? "→" : "";

  return (
    <div className="space-y-5">
      <div>
        <Link href="/parent/track" className="text-sm text-ink-600">← Track</Link>
        <h1 className="mt-1 text-xl font-bold text-brand-900">{child.displayName}'s progress</h1>
      </div>

      {/* Insight summary */}
      <section className="card">
        <div className="grid grid-cols-4 gap-2 text-center">
          <Mini value={String(ins.goals)} label="Goals" />
          <Mini value={String(ins.observations)} label="Logs" />
          <Mini value={String(ins.logsLast7Days)} label="This week" />
          <Mini value={ins.avgRecentRating === null ? "—" : `${ins.avgRecentRating} ${trendIcon}`} label="Avg" />
        </div>
        {ins.goalsNeedingAttention > 0 && (
          <p className="mt-3 rounded-lg bg-accent-50 p-2 text-xs text-accent-700">
            {ins.goalsNeedingAttention === 1
              ? "1 goal has no notes yet"
              : `${ins.goalsNeedingAttention} goals have no notes yet`}{" "}
            — a quick one helps you see what's working.
          </p>
        )}
      </section>

      {/* Goals */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-600">Goals</h2>
        {goals.map(({ g, entries }) => {
          const last = entries[entries.length - 1];
          const withMedia = [...entries].reverse().find((e) => e.mediaUrl);
          return (
            <div key={g.id} className="card">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="pill bg-brand-100 text-brand-700">{g.domain}</span>
                  <span className={`pill ${g.source === "iep" ? "bg-brand-50 text-ink-600" : "bg-accent-50 text-accent-700"}`}>
                    {g.source === "iep" ? "From IEP" : "Custom"}
                  </span>
                </div>
                <span className="text-xs text-ink-500">{entries.length} log{entries.length === 1 ? "" : "s"}</span>
              </div>
              <p className="mt-1.5 text-sm font-medium text-brand-900">{g.target}</p>

              {entries.length > 0 ? (
                <div className="mt-2 flex items-end gap-3">
                  <div className="flex h-10 flex-1 items-end gap-0.5">
                    {entries.slice(-12).map((e, i) => (
                      <div key={i} className="flex-1 rounded-t bg-brand-400" style={{ height: `${(e.simpleRating / 5) * 100}%` }} title={`${e.simpleRating}/5`} />
                    ))}
                  </div>
                  {withMedia?.mediaUrl && withMedia.mediaType === "image" && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={withMedia.mediaUrl} alt="" className="h-12 w-12 rounded-lg object-cover" />
                  )}
                  <div className="text-right">
                    <p className="text-xs font-semibold text-brand-700">{last && RATING_LABEL[last.simpleRating]}</p>
                    <p className="text-[10px] text-ink-400">{last && new Date(last.observedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ) : (
                <p className="mt-1 text-xs text-ink-400">No notes yet.</p>
              )}

              <div className="mt-3 flex items-center gap-2">
                <Link href={`/parent/track/${g.id}`} className="btn-primary py-1.5 text-xs">Log / view</Link>
                <form action={deleteGoalAction}>
                  <input type="hidden" name="goalId" value={g.id} />
                  <input type="hidden" name="childId" value={child.id} />
                  <button className="text-xs font-medium text-accent-600 hover:underline" type="submit">Remove goal</button>
                </form>
              </div>
            </div>
          );
        })}
        {!goals.length && (
          <p className="card text-sm text-ink-500">
            No goals yet. Upload {child.displayName}'s IEP in{" "}
            <Link href="/parent/understand" className="underline">Understand</Link>, or add one below.
          </p>
        )}
      </section>

      {/* Add goal */}
      <details className="card">
        <summary className="cursor-pointer font-semibold text-brand-900">+ Add a goal</summary>
        <form action={addGoalAction} className="mt-3 space-y-3">
          <input type="hidden" name="childId" value={child.id} />
          <div>
            <label className="label" htmlFor="target">What are you working on?</label>
            <input id="target" name="target" className="input" required placeholder="e.g. Brush teeth with one reminder" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="domain">Area</label>
              <input id="domain" name="domain" className="input" placeholder="Self-help" />
            </div>
            <div>
              <label className="label" htmlFor="measure">How you'll measure</label>
              <input id="measure" name="measure" className="input" placeholder="Daily at bedtime" />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="baseline">Where you're starting (optional)</label>
            <input id="baseline" name="baseline" className="input" placeholder="Needs full help today" />
          </div>
          <button className="btn-primary w-full" type="submit">Add goal</button>
        </form>
      </details>
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
