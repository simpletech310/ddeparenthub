import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { listFamilies, listFamilyParents, listFamilyStaff } from "@/lib/data/families";
import { getDb } from "@/lib/data/store";
import { createFamilyAction, createUserAction } from "@/lib/admin/actions";

export default async function AdminFamilies() {
  await requireRole("admin");
  const families = await listFamilies();
  const db = await getDb();
  const rows = await Promise.all(
    families.map(async (f) => ({
      family: f,
      children: db.children.filter((c) => c.familyId === f.id),
      parents: await listFamilyParents(f.id),
      staff: await listFamilyStaff(f.id),
    }))
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-brand-900">Families</h1>
        <p className="text-sm text-ink-600">
          Create families, link parents, and assign staff. Assigned staff see the family file; you see all.
        </p>
      </div>

      <ul className="space-y-2">
        {rows.map(({ family: f, children, parents, staff }) => (
          <li key={f.id}>
            <Link href={`/admin/families/${f.id}`} className="card block hover:border-brand-300">
              <p className="font-semibold text-brand-900">{f.name}</p>
              <p className="text-xs text-ink-500">
                {children.map((c) => c.displayName).join(", ") || "No children"} ·{" "}
                Parents: {parents.map((p) => p.name.split(" ")[0]).join(", ") || "none"} ·{" "}
                Staff: {staff.map((s) => s.name.split(" ")[0]).join(", ") || "none"}
              </p>
            </Link>
          </li>
        ))}
      </ul>

      <details className="card">
        <summary className="cursor-pointer font-semibold text-brand-900">+ Create a family</summary>
        <form action={createFamilyAction} className="mt-3 flex gap-2">
          <input name="name" className="input flex-1" placeholder="Family name (e.g. Rivera Family)" required />
          <button className="btn-primary" type="submit">Create</button>
        </form>
      </details>

      <details className="card">
        <summary className="cursor-pointer font-semibold text-brand-900">+ Add a user (staff or parent)</summary>
        <form action={createUserAction} className="mt-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Role</label>
              <select name="role" className="input">
                <option value="parent">Parent</option>
                <option value="staff">Staff</option>
              </select>
            </div>
            <div>
              <label className="label">Link to family (parents)</label>
              <select name="familyId" className="input">
                <option value="">— none —</option>
                {families.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Name</label><input name="name" className="input" required /></div>
            <div><label className="label">Email</label><input name="email" type="email" className="input" required /></div>
          </div>
          <div><label className="label">Title (staff)</label><input name="title" className="input" placeholder="BCBA / Behavior Technician" /></div>
          <p className="text-xs text-ink-500">New users get the demo password <span className="font-mono">demo</span>.</p>
          <button className="btn-primary w-full" type="submit">Create user</button>
        </form>
      </details>
    </div>
  );
}
