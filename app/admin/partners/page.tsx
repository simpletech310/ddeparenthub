import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { listPartners } from "@/lib/data/partners";
import { archivePartnerAction, createPartnerAction } from "@/lib/admin/actions";
import { PartnerFields } from "@/components/PartnerFields";

export default async function AdminPartners() {
  await requireRole("admin");
  const partners = await listPartners(true); // include archived

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-brand-900">Partner directory</h1>
        <p className="text-sm text-brand-600">
          Organizations DDE partners with. Tags drive the recommendations families see — match them to
          child interests (e.g. <em>horses, outdoors</em>) and needs (e.g. <em>social, group_work</em>).
        </p>
      </div>

      <ul className="space-y-2">
        {partners.map((p) => (
          <li key={p.id} className="card">
            <div className="flex items-start justify-between gap-2">
              <div>
                <Link href={`/admin/partners/${p.id}`} className="font-semibold text-brand-900 hover:underline">
                  {p.name}
                </Link>
                <p className="text-xs text-brand-500">{p.category}</p>
              </div>
              <span className={`pill ${p.status === "active" ? "bg-brand-50 text-brand-700" : "bg-brand-100 text-brand-400"}`}>
                {p.status}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {p.needTags.map((t) => <span key={t} className="pill bg-accent-50 text-accent-700">{t.replace(/_/g, " ")}</span>)}
              {p.interestTags.map((t) => <span key={t} className="pill bg-brand-50 text-brand-600">{t.replace(/_/g, " ")}</span>)}
            </div>
            <div className="mt-2 flex gap-2">
              <Link href={`/admin/partners/${p.id}`} className="btn-ghost py-1.5 text-xs">Edit</Link>
              <form action={archivePartnerAction}>
                <input type="hidden" name="partnerId" value={p.id} />
                <input type="hidden" name="status" value={p.status === "active" ? "archived" : "active"} />
                <button className="btn-ghost py-1.5 text-xs" type="submit">
                  {p.status === "active" ? "Archive" : "Restore"}
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>

      <details className="card">
        <summary className="cursor-pointer font-semibold text-brand-900">+ Add a partner</summary>
        <PartnerForm action={createPartnerAction} />
      </details>
    </div>
  );
}

function PartnerForm({ action }: { action: (fd: FormData) => void }) {
  return (
    <form action={action} className="mt-3 space-y-3">
      <PartnerFields />
      <button className="btn-primary w-full" type="submit">Save partner</button>
    </form>
  );
}
