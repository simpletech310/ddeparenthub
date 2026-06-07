import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { getPartner } from "@/lib/data/partners";
import { archivePartnerAction, updatePartnerAction } from "@/lib/admin/actions";
import { PartnerFields } from "@/components/PartnerFields";
import { PartnerImageUpload } from "@/components/PartnerImageUpload";
import { PageHeader } from "@/components/PageHeader";

export default async function EditPartner({ params }: { params: { partnerId: string } }) {
  await requireRole("admin");
  const p = await getPartner(params.partnerId);
  if (!p) notFound();
  const s = p.social ?? {};

  const defaults = {
    name: p.name,
    category: p.category,
    tagline: p.tagline,
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
    social_instagram: s.instagram ?? "",
    social_facebook: s.facebook ?? "",
    social_youtube: s.youtube ?? "",
    social_tiktok: s.tiktok ?? "",
    social_linkedin: s.linkedin ?? "",
    social_x: s.x ?? "",
  };

  return (
    <div className="space-y-5">
      <PageHeader
        backHref="/admin/partners"
        backLabel="Partner directory"
        eyebrow="Edit partner"
        title={p.name}
        subtitle={p.category || "Organization profile"}
      />

      <section className="card space-y-3">
        <h2 className="font-display font-bold text-ink-900">Photo</h2>
        <PartnerImageUpload partnerId={p.id} name={p.name} currentSrc={p.imageUrl} />
      </section>

      <form action={updatePartnerAction} className="card space-y-4">
        <input type="hidden" name="partnerId" value={p.id} />
        <PartnerFields defaults={defaults} />
        <button className="btn-primary w-full" type="submit">Save changes</button>
      </form>

      <form
        action={archivePartnerAction}
        className="rounded-2xl border border-accent-200 bg-accent-50 p-4"
      >
        <input type="hidden" name="partnerId" value={p.id} />
        <input type="hidden" name="status" value={p.status === "active" ? "archived" : "active"} />
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-accent-700">
            {p.status === "active"
              ? "Archiving hides this partner from families, but keeps the record."
              : "This partner is archived and hidden from families."}
          </p>
          <button className="btn-ghost shrink-0 text-sm" type="submit">
            {p.status === "active" ? "Archive" : "Restore"}
          </button>
        </div>
      </form>
    </div>
  );
}
