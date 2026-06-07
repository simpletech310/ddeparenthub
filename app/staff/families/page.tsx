import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { accessibleFamilyIds } from "@/lib/auth/access";
import { getFamily, listFamilyParents } from "@/lib/data/families";
import { listFamilyChildren } from "@/lib/data/repos";

export default async function StaffFamilies() {
  const user = await requireRole("staff");
  const familyIds = await accessibleFamilyIds(user);
  const cards = (await Promise.all(
    familyIds.map(async (fid) => ({
      fid,
      fam: await getFamily(fid),
      children: await listFamilyChildren(user, fid),
      parents: await listFamilyParents(fid),
    }))
  )).filter((x) => x.fam);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-brand-900">My families</h1>
        <p className="text-sm text-ink-600">
          Families you're assigned to. Open a family to see their children, progress, and documents.
          Records are shared across the whole assigned team.
        </p>
      </div>

      {cards.length ? (
        <ul className="space-y-2">
          {cards.map(({ fid, fam, children, parents }) => {
            if (!fam) return null;
            return (
              <li key={fid}>
                <Link href={`/staff/families/${fid}`} className="card block hover:border-brand-300">
                  <p className="font-semibold text-brand-900">{fam.name}</p>
                  <p className="text-xs text-ink-500">
                    {children.map((c) => c.displayName).join(", ") || "No children"} ·{" "}
                    {parents.map((p) => p.name.split(" ")[0]).join(", ")}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="card text-sm text-ink-500">
          You aren't assigned to any families yet. An administrator assigns families to staff.
        </p>
      )}
    </div>
  );
}
