import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { listMyChildren } from "@/lib/data/repos";
import { listPartners } from "@/lib/data/partners";
import { recommendationsForChild } from "@/lib/data/recommendations";
import { RecommendationList } from "@/components/RecommendationList";

export default async function ResourcesPage() {
  const user = await requireRole("parent");
  const children = await listMyChildren(user);
  const childRecs = await Promise.all(
    children.map(async (child) => ({ child, recs: (await recommendationsForChild(user, child.id)).slice(0, 4) }))
  );
  const partners = await listPartners();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/parent" className="text-sm text-ink-600">← Home</Link>
        <h1 className="mt-1 text-xl font-bold text-brand-900">Resources</h1>
        <p className="text-sm text-ink-600">
          Personalized matches from each child's IEP + profile, plus DDE's full partner directory.
        </p>
      </div>

      {childRecs.map(({ child, recs }) => {
        return (
          <section key={child.id}>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-600">
              For {child.displayName}
            </h2>
            <RecommendationList recs={recs} />
          </section>
        );
      })}

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-600">
          DDE partner directory
        </h2>
        <ul className="space-y-3">
          {partners.map((p) => (
            <li key={p.id}>
              <Link href={`/parent/resources/${p.id}`} className="block overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm hover:border-brand-300">
                {p.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.imageUrl} alt="" className="h-28 w-full object-cover" />
                )}
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-brand-900">{p.name}</p>
                    <span className="pill bg-brand-50 text-ink-600">{p.category}</span>
                  </div>
                  {p.tagline && <p className="mt-0.5 text-sm italic text-ink-600">{p.tagline}</p>}
                  {p.insuranceAccepted.length > 0 && (
                    <p className="mt-1 text-xs text-ink-500">Insurance: {p.insuranceAccepted.join(" · ")}</p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
