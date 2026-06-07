import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { getPartner } from "@/lib/data/partners";
import { updatePartnerAction } from "@/lib/admin/actions";
import { PartnerFields } from "@/components/PartnerFields";

export default async function EditPartner({ params }: { params: { partnerId: string } }) {
  await requireRole("admin");
  const p = await getPartner(params.partnerId);
  if (!p) notFound();

  const defaults = {
    name: p.name,
    category: p.category,
    tagline: p.tagline,
    imageUrl: p.imageUrl ?? "",
    description: p.description,
    howTheyHelp: p.howTheyHelp,
    services: p.services.join("\n"),
    insuranceAccepted: p.insuranceAccepted.join(", "),
    interestTags: p.interestTags.join(", "),
    needTags: p.needTags.join(", "),
    contactName: p.contactName,
    phone: p.phone,
    email: p.email,
    website: p.website,
    address: p.address,
  };

  return (
    <div className="space-y-5">
      <div>
        <Link href="/admin/partners" className="text-sm text-brand-600">← Partners</Link>
        <h1 className="mt-1 text-xl font-bold text-brand-900">Edit {p.name}</h1>
      </div>
      <form action={updatePartnerAction} className="card space-y-3">
        <input type="hidden" name="partnerId" value={p.id} />
        <PartnerFields defaults={defaults} />
        <button className="btn-primary w-full" type="submit">Save changes</button>
      </form>
    </div>
  );
}
