import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { getChildById } from "@/lib/data/repos";
import { recommendationsForChild } from "@/lib/data/recommendations";
import { deleteChildAction, updateChildProfileAction } from "@/lib/parent/actions";
import { RecommendationList } from "@/components/RecommendationList";

export default async function ChildProfile({ params }: { params: { childId: string } }) {
  const user = await requireRole("parent");
  const child = await getChildById(user, params.childId);
  if (!child) notFound();
  const recs = await recommendationsForChild(user, child.id);

  return (
    <div className="space-y-5">
      <div>
        <Link href="/parent/children" className="text-sm text-ink-600">← Children</Link>
        <h1 className="mt-1 text-xl font-bold text-brand-900">{child.displayName}'s profile</h1>
        <p className="text-sm text-ink-600">
          The more we know, the better we can match real DDE classes and partner resources.
        </p>
      </div>

      <form action={updateChildProfileAction} className="card space-y-4">
        <input type="hidden" name="childId" value={child.id} />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="displayName">Name</label>
            <input id="displayName" name="displayName" className="input" defaultValue={child.displayName} />
          </div>
          <div>
            <label className="label" htmlFor="dob">Date of birth</label>
            <input id="dob" name="dob" type="date" className="input" defaultValue={child.dob ?? ""} />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="interestTags">Interests (comma-separated)</label>
          <input id="interestTags" name="interestTags" className="input" defaultValue={child.interestTags.join(", ")} placeholder="animals, horses, outdoors, music" />
          <p className="mt-1 text-xs text-ink-500">What does {child.displayName} love? These drive resource matches.</p>
        </div>
        <div>
          <label className="label" htmlFor="needTags">Areas of need (comma-separated)</label>
          <input id="needTags" name="needTags" className="input" defaultValue={child.needTags.join(", ")} placeholder="communication, social, group work, outdoor time" />
          <p className="mt-1 text-xs text-ink-500">Goals from the IEP are also added automatically.</p>
        </div>
        <div>
          <label className="label" htmlFor="temperament">Temperament</label>
          <textarea id="temperament" name="temperament" className="input min-h-[60px]" defaultValue={child.temperament} placeholder="Energetic, calmer outdoors…" />
        </div>
        <div>
          <label className="label" htmlFor="strengths">Strengths</label>
          <textarea id="strengths" name="strengths" className="input min-h-[60px]" defaultValue={child.strengths} />
        </div>
        <div>
          <label className="label" htmlFor="notes">Other notes</label>
          <textarea id="notes" name="notes" className="input min-h-[60px]" defaultValue={child.notes} />
        </div>
        <button className="btn-primary w-full" type="submit">Save profile</button>
      </form>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-600">
          Recommended supports for {child.displayName}
        </h2>
        <RecommendationList recs={recs} />
      </section>

      <form action={deleteChildAction} className="rounded-2xl border border-accent-200 bg-accent-50 p-4">
        <input type="hidden" name="childId" value={child.id} />
        <p className="text-sm text-accent-700">Remove this child and their documents, goals, and logs.</p>
        <button className="btn-accent mt-2" type="submit">Remove {child.displayName}</button>
      </form>
    </div>
  );
}
