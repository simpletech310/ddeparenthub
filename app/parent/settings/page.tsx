import { requireRole } from "@/lib/auth/session";
import { getFamily } from "@/lib/data/families";
import { deleteFamilyDataAction, updateParentProfileAction, updateSettingsAction } from "@/lib/parent/actions";
import { updateMyAvatarAction, updateMyProfileAction } from "@/lib/account/actions";
import { AvatarUpload } from "@/components/AvatarUpload";
import { PageHeader } from "@/components/PageHeader";
import { StringPicker, TagPicker } from "@/components/ChipSelect";
import { INSURANCE_OPTIONS, PARENT_FOCUS_OPTIONS } from "@/lib/data/taxonomy";

export default async function SettingsPage() {
  const user = await requireRole("parent");
  const family = user.familyId ? await getFamily(user.familyId) : undefined;

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Account" title="Settings" subtitle="Your photo, name, and preferences." />

      <section className="card">
        <h2 className="mb-3 font-display font-bold text-ink-900">Your photo</h2>
        <AvatarUpload name={user.name} currentSrc={user.avatarUrl} action={updateMyAvatarAction} />
      </section>

      <form action={updateMyProfileAction} className="card space-y-3">
        <h2 className="font-display font-bold text-ink-900">Your name</h2>
        <input name="name" className="input" defaultValue={user.name} />
        <button className="btn-primary w-full" type="submit">Save name</button>
      </form>

      {/* Family profile — improves recommendations */}
      <form action={updateParentProfileAction} className="card space-y-5">
        <div>
          <h2 className="font-display font-bold text-ink-900">Help us recommend better 🎯</h2>
          <p className="text-sm text-ink-500">A few details about your family so our matches actually fit.</p>
        </div>
        <div>
          <label className="label">Insurance you have</label>
          <p className="mb-2 text-xs text-ink-400">We'll highlight partners that accept it.</p>
          <StringPicker name="insurance" options={INSURANCE_OPTIONS} initial={user.insurance ?? []} />
        </div>
        <div>
          <label className="label">What matters most to your family right now?</label>
          <TagPicker name="focus" options={PARENT_FOCUS_OPTIONS} initial={user.focus ?? []} />
        </div>
        <div>
          <label className="label" htmlFor="goals">Anything you'd love to achieve? (optional)</label>
          <textarea id="goals" name="goals" className="input min-h-[60px]" defaultValue={user.goals ?? ""} placeholder="e.g. more independence at home, a calmer morning routine" />
        </div>
        <button className="btn-primary w-full" type="submit">Save family profile</button>
      </form>

      <form action={updateSettingsAction} className="card space-y-4">
        <h2 className="font-semibold text-brand-900">Preferences</h2>
        <div>
          <label className="label" htmlFor="preferredLanguage">Preferred language for breakdowns</label>
          <select id="preferredLanguage" name="preferredLanguage" className="input" defaultValue={user.preferredLanguage}>
            <option value="en">English</option>
            <option value="es">Español</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="retentionMonths">Auto-delete family documents after</label>
          <select id="retentionMonths" name="retentionMonths" className="input" defaultValue={family?.retentionMonths ?? ""}>
            <option value="">Keep until deleted (default)</option>
            <option value="6">6 months</option>
            <option value="12">12 months</option>
            <option value="24">24 months</option>
          </select>
          <p className="mt-1 text-xs text-ink-500">Applies to documents uploaded after saving. This is a family-wide setting.</p>
        </div>
        <button className="btn-primary w-full" type="submit">Save preferences</button>
      </form>

      <section className="card">
        <h2 className="font-semibold text-brand-900">Privacy</h2>
        <p className="mt-1 text-sm text-brand-700">
          Your family's documents and breakdowns are visible to members of your family, the DDE staff
          assigned to your family, and DDE administration. They are never shared more broadly.
        </p>
        <p className="mt-2 text-xs text-ink-500">
          Consent for AI processing:{" "}
          {family?.consentAcceptedAt
            ? `accepted ${new Date(family.consentAcceptedAt).toLocaleDateString()}`
            : "not yet given"}
          .
        </p>
      </section>

      <form action={deleteFamilyDataAction} className="rounded-2xl border border-accent-200 bg-accent-50 p-5">
        <h2 className="font-semibold text-accent-800">Delete all family data</h2>
        <p className="mt-1 text-sm text-accent-700">
          Permanently deletes your family's children, documents, breakdowns, goals, and home logs, and
          deactivates your account. This cannot be undone.
        </p>
        <button className="btn-accent mt-3 w-full" type="submit">Delete everything</button>
      </form>
    </div>
  );
}
