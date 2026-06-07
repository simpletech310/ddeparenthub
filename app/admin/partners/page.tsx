import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { listPartners } from "@/lib/data/partners";
import { archivePartnerAction, createPartnerAction } from "@/lib/admin/actions";
import { PartnerFields } from "@/components/PartnerFields";
import { SocialLinks } from "@/components/SocialLinks";
import { PageHeader } from "@/components/PageHeader";
import type { Partner } from "@/lib/types";

export default async function AdminPartners() {
  await requireRole("admin");
  const partners = await listPartners(true); // include archived
  const active = partners.filter((p) => p.status === "active");
  const archived = partners.filter((p) => p.status !== "active");
  const categories = new Set(active.map((p) => p.category).filter(Boolean));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Directory"
        title="Partner directory"
        subtitle="Organizations DDE families can be matched with. Tags drive the recommendations parents see."
      />

      {/* Summary strip */}
      <section className="grid grid-cols-3 gap-3">
        {[
          { value: active.length, label: "Active" },
          { value: categories.size, label: "Categories" },
          { value: archived.length, label: "Archived" },
        ].map((s) => (
          <div key={s.label} className="card text-center">
            <p className="font-display text-2xl font-bold text-brand-700">{s.value}</p>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">{s.label}</p>
          </div>
        ))}
      </section>

      {/* Active partners */}
      <section className="space-y-3">
        <h2 className="eyebrow">Active partners</h2>
        {active.length === 0 ? (
          <p className="card text-sm text-ink-500">No active partners yet — add your first below.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {active.map((p) => <PartnerCard key={p.id} p={p} />)}
          </div>
        )}
      </section>

      {/* Archived */}
      {archived.length > 0 && (
        <section className="space-y-3">
          <h2 className="eyebrow">Archived</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {archived.map((p) => <PartnerCard key={p.id} p={p} />)}
          </div>
        </section>
      )}

      {/* Add partner */}
      <details className="card">
        <summary className="cursor-pointer font-display font-bold text-ink-900">+ Add a partner</summary>
        <p className="mt-1 text-sm text-ink-500">Save the basics, then add a photo and social links on the next screen.</p>
        <form action={createPartnerAction} className="mt-3 space-y-4">
          <PartnerFields />
          <button className="btn-primary w-full" type="submit">Create partner →</button>
        </form>
      </details>
    </div>
  );
}

function PartnerCard({ p }: { p: Partner }) {
  const tags = [...p.needTags, ...p.interestTags].slice(0, 4);
  return (
    <div className={`card flex flex-col gap-3 ${p.status !== "active" ? "opacity-70" : ""}`}>
      <div className="flex items-start gap-3">
        <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-brand-100 to-accent-100 ring-1 ring-brand-100">
          {p.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-xl" aria-hidden>🤝</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <Link href={`/admin/partners/${p.id}`} className="font-display font-bold text-ink-900 hover:text-brand-700">
              {p.name}
            </Link>
            <span className={`pill shrink-0 ${p.status === "active" ? "bg-brand-50 text-brand-700" : "bg-brand-100 text-ink-400"}`}>
              {p.status}
            </span>
          </div>
          <p className="truncate text-xs text-ink-500">{p.category || "Uncategorized"}</p>
        </div>
      </div>

      {p.tagline && <p className="text-sm italic text-ink-600">{p.tagline}</p>}

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map((t) => (
            <span key={t} className="pill bg-brand-50 text-ink-600">{t.replace(/_/g, " ")}</span>
          ))}
        </div>
      )}

      <SocialLinks social={p.social} size="sm" />

      <div className="mt-auto flex gap-2 pt-1">
        <Link href={`/admin/partners/${p.id}`} className="btn-ghost py-1.5 text-xs">Edit</Link>
        <form action={archivePartnerAction}>
          <input type="hidden" name="partnerId" value={p.id} />
          <input type="hidden" name="status" value={p.status === "active" ? "archived" : "active"} />
          <button className="btn-ghost py-1.5 text-xs" type="submit">
            {p.status === "active" ? "Archive" : "Restore"}
          </button>
        </form>
      </div>
    </div>
  );
}
