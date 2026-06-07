import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { getFamily, listFamilyParents, listFamilyStaff } from "@/lib/data/families";
import { listMyChildren } from "@/lib/data/repos";
import { Avatar } from "@/components/Avatar";
import { PageHeader } from "@/components/PageHeader";

export default async function FamilyPage() {
  const user = await requireRole("parent");
  const family = user.familyId ? await getFamily(user.familyId) : undefined;
  const parents = user.familyId ? await listFamilyParents(user.familyId) : [];
  const staff = user.familyId ? await listFamilyStaff(user.familyId) : [];
  const children = await listMyChildren(user);

  return (
    <div className="space-y-5">
      <PageHeader backHref="/parent" backLabel="Home" eyebrow="Family" title={family?.name ?? "Your family"}
        subtitle="Everyone here shares the same family file — the same documents, goals, and progress." />

      <section className="card">
        <h2 className="mb-3 font-display font-bold text-ink-900">Parents & guardians</h2>
        <ul className="space-y-2.5">
          {parents.map((p) => (
            <li key={p.id} className="flex items-center gap-3">
              <Avatar name={p.name} src={p.avatarUrl} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink-800">{p.name}{p.id === user.id ? " (you)" : ""}</p>
                <p className="truncate text-xs text-ink-400">{p.email}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-ink-400">
          Need to add another parent? DDE administration can link them to your family.
        </p>
      </section>

      <section className="card">
        <h2 className="mb-3 font-display font-bold text-ink-900">Your DDE team</h2>
        {staff.length ? (
          <ul className="space-y-2.5">
            {staff.map((s) => (
              <li key={s.id} className="flex items-center gap-3">
                <Avatar name={s.name} src={s.avatarUrl} size="sm" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink-800">{s.name}</p>
                </div>
                <span className="pill bg-brand-50 text-brand-700">{s.title ?? "DDE staff"}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-400">No staff assigned yet.</p>
        )}
        <p className="mt-2 text-xs text-ink-500">
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
