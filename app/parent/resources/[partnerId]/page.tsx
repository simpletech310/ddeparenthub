import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { getPartner } from "@/lib/data/partners";

export default async function PartnerDetail({ params }: { params: { partnerId: string } }) {
  await requireRole("parent");
  const p = await getPartner(params.partnerId);
  if (!p || p.status !== "active") notFound();

  return (
    <div className="space-y-5">
      <Link href="/parent/resources" className="text-sm text-brand-600">← Resources</Link>

      {p.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.imageUrl} alt="" className="h-44 w-full rounded-2xl object-cover" />
      )}

      <div>
        <h1 className="text-xl font-bold text-brand-900">{p.name}</h1>
        <span className="pill bg-brand-50 text-brand-600">{p.category}</span>
        {p.tagline && <p className="mt-2 text-sm italic text-brand-600">{p.tagline}</p>}
      </div>

      <section className="card space-y-3">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-brand-500">What they do</h2>
          <p className="text-sm text-brand-800">{p.description}</p>
        </div>
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-brand-500">How they help</h2>
          <p className="text-sm text-brand-800">{p.howTheyHelp}</p>
        </div>
        {p.services.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-brand-500">Services</h2>
            <ul className="list-disc pl-5 text-sm text-brand-700">
              {p.services.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        )}
      </section>

      {p.insuranceAccepted.length > 0 && (
        <section className="card">
          <h2 className="mb-2 font-semibold text-brand-900">Insurance accepted</h2>
          <div className="flex flex-wrap gap-1.5">
            {p.insuranceAccepted.map((ins) => (
              <span key={ins} className="pill bg-brand-100 text-brand-700">{ins}</span>
            ))}
          </div>
        </section>
      )}

      <section className="card space-y-1 text-sm">
        <h2 className="mb-1 font-semibold text-brand-900">Contact</h2>
        {p.contactName && <p className="text-brand-700">{p.contactName}</p>}
        {p.phone && <p className="text-brand-700">📞 {p.phone}</p>}
        {p.email && <p className="text-brand-700">✉️ {p.email}</p>}
        {p.website && <p className="text-brand-700">🌐 {p.website}</p>}
        {p.address && <p className="text-brand-500">📍 {p.address}</p>}
      </section>

      <p className="text-xs text-brand-400">
        DDE partners are independent organizations. DDE shares this directory to help families find
        supportive resources; please vet any provider and confirm coverage for your child's needs.
      </p>
    </div>
  );
}
