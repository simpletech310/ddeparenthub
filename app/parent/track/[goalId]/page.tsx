import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { getChildById, getGoalById, listGoalProgress } from "@/lib/data/repos";
import { goalInsight } from "@/lib/data/insights";
import { deleteGoalAction, logProgressAction } from "@/lib/parent/actions";

const RATINGS = [
  { value: 5, label: "Mastering 🎉" },
  { value: 4, label: "Progressing 🙂" },
  { value: 3, label: "Developing 👍" },
  { value: 2, label: "Emerging 🌱" },
  { value: 1, label: "Struggling 💛" },
];
const RATING_LABEL = ["", "Struggling", "Emerging", "Developing", "Progressing", "Mastering"];

export default async function GoalDetail({ params }: { params: { goalId: string } }) {
  const user = await requireRole("parent");
  const goal = await getGoalById(user, params.goalId);
  if (!goal) notFound();
  const child = await getChildById(user, goal.childId);
  const entries = await listGoalProgress(user, goal.id);
  const insight = await goalInsight(user, goal.id);

  return (
    <div className="space-y-5">
      <div>
        <Link href={`/parent/track/child/${goal.childId}`} className="text-sm text-brand-600">
          ← {child?.displayName ?? "Child"}'s progress
        </Link>
        <div className="mt-1 flex items-center gap-2">
          <span className="pill bg-brand-100 text-brand-700">{goal.domain}</span>
          <span className={`pill ${goal.source === "iep" ? "bg-brand-50 text-brand-600" : "bg-accent-50 text-accent-700"}`}>
            {goal.source === "iep" ? "From IEP" : "Custom"}
          </span>
        </div>
        <h1 className="mt-1 text-lg font-bold text-brand-900">{goal.target}</h1>
      </div>

      {/* Actionable insight */}
      <section className="rounded-2xl border border-brand-200 bg-brand-50 p-4">
        <div className="flex items-center justify-between text-center">
          <I value={String(insight.logs)} label="Notes" />
          <I value={String(insight.logsLast7Days)} label="This week" />
          <I value={insight.currentLabel ?? "—"} label="Latest" />
          <I value={insight.improvingStreak > 1 ? `${insight.improvingStreak}×` : "—"} label="Streak" />
        </div>
        <p className="mt-3 text-sm text-brand-800">{insight.message}</p>
      </section>

      {goal.source === "iep" && (
        <section className="card space-y-2 text-sm">
          <Field label="Goal (from the IEP)" value={goal.verbatimText} quote />
          {goal.baseline && <Field label="Baseline" value={goal.baseline} />}
          {goal.measure && <Field label="How it's measured" value={goal.measure} />}
        </section>
      )}

      {/* Quick log */}
      <form action={logProgressAction} className="card space-y-3">
        <input type="hidden" name="goalId" value={goal.id} />
        <h2 className="font-semibold text-brand-900">Log an observation</h2>
        <div>
          <label className="label" htmlFor="rating">How did it go?</label>
          <select id="rating" name="rating" className="input" defaultValue="3">
            {RATINGS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="note">Note (optional)</label>
          <textarea id="note" name="note" className="input min-h-[70px]" placeholder="e.g. Said 'want ball' with one reminder at snack time." />
        </div>
        <div>
          <label className="label" htmlFor="media">Add a photo or video (optional)</label>
          <input id="media" name="media" type="file" accept="image/*,video/*" className="input" />
          <input name="mediaUrl" className="input mt-2" placeholder="…or paste an image/video link" />
          <p className="mt-1 text-xs text-brand-500">Photos/short videos up to ~5MB. Private to your family.</p>
        </div>
        <button className="btn-primary w-full" type="submit">Save observation</button>
      </form>

      {/* History */}
      <section className="card">
        <h2 className="mb-2 font-semibold text-brand-900">History</h2>
        {entries.length ? (
          <ul className="space-y-3">
            {[...entries].reverse().map((e) => (
              <li key={e.id} className="border-l-2 border-brand-200 pl-3">
                <div className="flex items-center justify-between">
                  <span className="pill bg-brand-50 text-brand-700">{RATING_LABEL[e.simpleRating]}</span>
                  <span className="text-xs text-brand-400">{new Date(e.observedAt).toLocaleDateString()}</span>
                </div>
                {e.note && <p className="mt-1 text-sm text-brand-700">{e.note}</p>}
                {e.mediaUrl && e.mediaType === "image" && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={e.mediaUrl} alt="" className="mt-2 max-h-56 rounded-xl object-cover" />
                )}
                {e.mediaUrl && e.mediaType === "video" && (
                  <video src={e.mediaUrl} controls className="mt-2 max-h-56 rounded-xl" />
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-brand-500">No observations yet — log your first one above.</p>
        )}
      </section>

      <form action={deleteGoalAction} className="rounded-2xl border border-accent-200 bg-accent-50 p-4">
        <input type="hidden" name="goalId" value={goal.id} />
        <input type="hidden" name="childId" value={goal.childId} />
        <p className="text-sm text-accent-700">Remove this goal and its notes.</p>
        <button className="btn-accent mt-2" type="submit">Remove goal</button>
      </form>
    </div>
  );
}

function I({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex-1">
      <p className="text-sm font-bold text-brand-900">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-brand-500">{label}</p>
    </div>
  );
}

function Field({ label, value, quote }: { label: string; value: string; quote?: boolean }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">{label}</p>
      {quote ? (
        <blockquote className="mt-0.5 border-l-2 border-brand-300 pl-3 text-xs italic text-brand-600">“{value}”</blockquote>
      ) : (
        <p className="mt-0.5 text-brand-800">{value}</p>
      )}
    </div>
  );
}
