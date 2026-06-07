import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import {
  getFamily,
  listFamilyParents,
  listFamilyStaff,
} from "@/lib/data/families";
import { listUsers } from "@/lib/data/repos";
import {
  addParentToFamilyAction,
  assignStaffAction,
  renameFamilyAction,
  unassignStaffAction,
} from "@/lib/admin/actions";
import { FamilyFile } from "@/components/FamilyFile";
import { PageHeader } from "@/components/PageHeader";

export default async function AdminFamilyDetail({ params }: { params: { familyId: string } }) {
  const user = await requireRole("admin");
  const family = await getFamily(params.familyId);
  if (!family) notFound();

  const assignedStaff = await listFamilyStaff(params.familyId);
  const assignedIds = new Set(assignedStaff.map((s) => s.id));
  const allUsers = await listUsers();
  const allStaff = allUsers.filter((u) => u.role === "staff" && u.status === "active");
  const unassignedStaff = allStaff.filter((s) => !assignedIds.has(s.id));
  const parents = await listFamilyParents(params.familyId);
  const unlinkedParents = allUsers.filter(
    (u) => u.role === "parent" && u.familyId !== params.familyId
  );

  return (
    <div className="space-y-5">
      <PageHeader backHref="/admin/families" backLabel="Families" eyebrow="Family" title={family.name} />

      {/* Rename */}
      <form action={renameFamilyAction} className="card flex flex-wrap items-end gap-2">
        <div className="min-w-[200px] flex-1">
          <label className="label" htmlFor="familyName">Family name</label>
          <input id="familyName" name="name" className="input" defaultValue={family.name} />
        </div>
        <input type="hidden" name="familyId" value={family.id} />
        <button className="btn-ghost" type="submit">Rename</button>
      </form>

      {/* Management */}
      <section className="card space-y-3">
        <h2 className="font-semibold text-brand-900">Assigned staff</h2>
        <ul className="space-y-1.5">
          {assignedStaff.map((s) => (
            <li key={s.id} className="flex items-center justify-between text-sm">
              <span className="text-brand-800">{s.name} <span className="text-xs text-ink-400">{s.title}</span></span>
              <form action={unassignStaffAction}>
                <input type="hidden" name="familyId" value={family.id} />
                <input type="hidden" name="staffId" value={s.id} />
                <button className="text-xs font-medium text-accent-600 hover:underline" type="submit">Unassign</button>
              </form>
            </li>
          ))}
          {!assignedStaff.length && <li className="text-sm text-ink-400">No staff assigned.</li>}
        </ul>
        {unassignedStaff.length > 0 && (
          <form action={assignStaffAction} className="flex gap-2">
            <input type="hidden" name="familyId" value={family.id} />
            <select name="staffId" className="input flex-1">
              {unassignedStaff.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.title})</option>)}
            </select>
            <button className="btn-primary" type="submit">Assign</button>
          </form>
        )}
      </section>

      <section className="card space-y-3">
        <h2 className="font-semibold text-brand-900">Parents in this family</h2>
        <ul className="space-y-1 text-sm">
          {parents.map((p) => <li key={p.id} className="text-brand-800">{p.name} <span className="text-xs text-ink-400">{p.email}</span></li>)}
          {!parents.length && <li className="text-sm text-ink-400">No parents linked.</li>}
        </ul>
        {unlinkedParents.length > 0 && (
          <form action={addParentToFamilyAction} className="flex gap-2">
            <input type="hidden" name="familyId" value={family.id} />
            <select name="parentId" className="input flex-1">
              {unlinkedParents.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.email})</option>)}
            </select>
            <button className="btn-primary" type="submit">Link parent</button>
          </form>
        )}
      </section>

      {/* The family file (admin sees everything) */}
      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-600">Family file</h2>
        <FamilyFile user={user} familyId={params.familyId} />
      </section>
    </div>
  );
}
