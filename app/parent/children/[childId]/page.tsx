import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { getChildById } from "@/lib/data/repos";
import { recommendationsForChild } from "@/lib/data/recommendations";
import { deleteChildAction, updateChildAvatarAction, updateChildProfileAction } from "@/lib/parent/actions";
import { RecommendationList } from "@/components/RecommendationList";
import { AvatarUpload } from "@/components/AvatarUpload";
import { PageHeader } from "@/components/PageHeader";
import { ChoicePicker, TagPicker } from "@/components/ChipSelect";
import {
  COMMUNICATION_OPTIONS,
  INTEREST_GROUPS,
  SUPPORT_OPTIONS,
  ageFromDob,
} from "@/lib/data/taxonomy";

export default async function ChildProfile({ params }: { params: { childId: string } }) {
  const user = await requireRole("parent");
  const child = await getChildById(user, params.childId);
  if (!child) notFound();
  const recs = await recommendationsForChild(user, child.id);
  const age = ageFromDob(child.dob);
  const name = child.displayName;

  return (
    <div className="space-y-5">
      <PageHeader backHref="/parent/children" backLabel="Children" eyebrow="Profile"
        title={`${name}'s profile`}
        subtitle={`A few friendly questions help us match the right DDE classes and partners for ${name}.`} />

      <section className="card">
        <h2 className="mb-3 font-display font-bold text-ink-900">Photo</h2>
        <AvatarUpload name={name} currentSrc={child.avatarUrl} action={updateChildAvatarAction} hiddenFields={{ childId: child.id }} />
      </section>

      <form action={updateChildProfileAction} className="space-y-5">
        <input type="hidden" name="childId" value={child.id} />

        {/* Basics */}
        <section className="card space-y-4">
          <h2 className="font-display font-bold text-ink-900">About {name}</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="displayName">Name</label>
              <input id="displayName" name="displayName" className="input" defaultValue={name} />
            </div>
            <div>
              <label className="label" htmlFor="dob">Birthday {age !== null && <span className="font-normal text-ink-400">· age {age}</span>}</label>
              <input id="dob" name="dob" type="date" className="input" defaultValue={child.dob ?? ""} />
            </div>
          </div>
          <div>
            <label className="label">How does {name} communicate?</label>
            <p className="mb-2 text-xs text-ink-400">There's no wrong answer — this just helps us suggest the right fit.</p>
            <ChoicePicker name="communicationStyle" options={COMMUNICATION_OPTIONS} initial={child.communicationStyle} />
          </div>
        </section>

        {/* Interests */}
        <section className="card space-y-3">
          <div>
            <h2 className="font-display font-bold text-ink-900">What does {name} love? ✨</h2>
            <p className="text-sm text-ink-500">Tap everything that sparks joy — things they like to do, play, eat, and explore.</p>
          </div>
          <TagPicker name="interestTags" groups={INTEREST_GROUPS} initial={child.interestTags} />
        </section>

        {/* Supports */}
        <section className="card space-y-3">
          <div>
            <h2 className="font-display font-bold text-ink-900">What helps {name}? 💛</h2>
            <p className="text-sm text-ink-500">Pick the supports that make {name}'s day go well. (IEP goals are added automatically too.)</p>
          </div>
          <TagPicker name="needTags" options={SUPPORT_OPTIONS} initial={child.needTags} />
        </section>

        {/* Aspirations + notes */}
        <section className="card space-y-4">
          <div>
            <label className="label" htmlFor="aspirations">What would you love to see {name} grow in?</label>
            <textarea id="aspirations" name="aspirations" className="input min-h-[60px]" defaultValue={child.aspirations ?? ""} placeholder="e.g. asking for things with words, playing alongside other kids" />
          </div>
          <div>
            <label className="label" htmlFor="strengths">{name}'s strengths</label>
            <textarea id="strengths" name="strengths" className="input min-h-[50px]" defaultValue={child.strengths} placeholder="Great memory, loves to help…" />
          </div>
          <div>
            <label className="label" htmlFor="temperament">Anything that helps you understand {name}?</label>
            <textarea id="temperament" name="temperament" className="input min-h-[50px]" defaultValue={child.temperament} placeholder="Calmer outdoors, gets overwhelmed in loud rooms…" />
          </div>
          <input type="hidden" name="notes" value={child.notes} />
          <button className="btn-primary w-full" type="submit">Save profile</button>
        </section>
      </form>

      <section>
        <h2 className="eyebrow mb-2">Recommended supports for {name}</h2>
        <RecommendationList recs={recs} />
      </section>

      <form action={deleteChildAction} className="rounded-2xl border border-accent-200 bg-accent-50 p-4">
        <input type="hidden" name="childId" value={child.id} />
        <p className="text-sm text-accent-700">Remove {name} and their documents, goals, and logs.</p>
        <button className="btn-accent mt-2" type="submit">Remove {name}</button>
      </form>
    </div>
  );
}
