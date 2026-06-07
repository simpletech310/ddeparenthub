import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { canAccessFamily } from "@/lib/auth/access";
import { getFamily } from "@/lib/data/families";
import { FamilyFile } from "@/components/FamilyFile";

export default async function StaffFamilyFile({ params }: { params: { familyId: string } }) {
  const user = await requireRole("staff");
  if (!(await canAccessFamily(user, params.familyId))) notFound();
  const family = await getFamily(params.familyId);
  if (!family) notFound();

  return (
    <div className="space-y-5">
      <div>
        <Link href="/staff/families" className="text-sm text-ink-600">← My families</Link>
        <h1 className="mt-1 text-xl font-bold text-brand-900">{family.name}</h1>
        <p className="text-sm text-ink-600">Read-only family file. Parents log progress; you can review it here.</p>
      </div>
      <FamilyFile user={user} familyId={params.familyId} />
    </div>
  );
}
