import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { getFamily, listFamilyParents, listFamilyStaff } from "@/lib/data/families";
import { listMyChildren } from "@/lib/data/repos";

export default async function FamilyPage() {
  const user = await requireRole("parent");
  const family = user.familyId ? await getFamily(user.familyId) : undefined;
  const parents = user.familyId ? await listFamilyParents(user.familyId) : [];
  const staff = user.familyId ? await listFamilyStaff(user.familyId) : [];
  const children = await listMyChildren(user);

  return (
    <div className="space-y-5">
      <div>
        <Link href="/parent" className="text-sm text-brand-600">← Home</Link>
        <h1 className="mt-1 text-xl font-bold text-brand-900">{family?.name ?? "Your family"}</h1>
        <p className="text-sm text-brand-600">
          Everyone here shares the same family file — the same documents, goals, and progress.
        </p>
      </div>

      <section className="card">
        <h2 className="mb-2 font-semibold text-brand-900">Parents & guardians</h2>
        <ul className="space-y-1.5">
          {parents.map((p) => (
            <li key={p.id} className="flex items-center justify-between text-sm">
              <span className="text-brand-800">{p.name}{p.id === user.id ? " (you)" : ""}</span>
              <span className="text-xs text-brand-500">{p.email}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-brand-500">
          Need to add another parent? DDE administration can link them to your family.
        </p>
      </section>

      <section className="card">
        <h2 className="mb-2 font-semibold text-brand-900">Your DDE team</h2>
        {staff.length ? (
          <ul className="space-y-1.5">
            {staff.map((s) => (
              <li key={s.id} className="flex items-center justify-between text-sm">
                <span className="text-brand-800">{s.name}</span>
                <span className="pill bg-brand-50 text-brand-600">{s.title ?? "DDE staff"}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-brand-500">No staff assigned yet.</p>
        )}
        <p className="mt-2 text-xs text-brand-500">
          Assigned staff can see your family file to support your child. Progress stays consistent if
          your team changes.
        </p>
      </section>

      <section className="card">
        <h2 className="mb-2 font-semibold text-brand-900">Children</h2>
        <ul className="space-y-1.5">
          {children.map((c) => (
            <li key={c.id}>
              <Link href={`/parent/children/${c.id}`} className="text-sm font-medium text-brand-700 underline">
                {c.displayName}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
