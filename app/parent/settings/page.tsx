import { requireRole } from "@/lib/auth/session";
import { getFamily } from "@/lib/data/families";
import { deleteFamilyDataAction, updateSettingsAction } from "@/lib/parent/actions";

export default async function SettingsPage() {
  const user = await requireRole("parent");
  const family = user.familyId ? await getFamily(user.familyId) : undefined;

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-brand-900">Settings</h1>

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
