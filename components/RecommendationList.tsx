import Link from "next/link";
import type { Recommendation } from "@/lib/data/recommendations";

export function RecommendationList({ recs }: { recs: Recommendation[] }) {
  if (!recs.length) {
    return (
      <p className="card text-sm text-brand-500">
        No matches yet. Add interests/needs to the child profile, or upload an IEP, and grounded
        suggestions will appear here.
      </p>
    );
  }
  return (
    <ul className="space-y-3">
      {recs.map((r) => (
        <li key={`${r.kind}_${r.id}`} className="overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm">
          {r.kind === "partner" && r.partner?.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={r.partner.imageUrl} alt="" className="h-28 w-full object-cover" />
          )}
          <div className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-brand-900">{r.title}</p>
                <p className="text-xs text-brand-500">{r.subtitle}</p>
              </div>
              <span className={`pill ${r.kind === "partner" ? "bg-accent-100 text-accent-700" : "bg-brand-100 text-brand-700"}`}>
                {r.kind === "partner" ? "Partner" : "DDE class"}
              </span>
            </div>

            {r.kind === "partner" && r.partner?.tagline && (
              <p className="mt-1 text-sm italic text-brand-600">{r.partner.tagline}</p>
            )}

            <p className="mt-2 text-sm text-brand-700">{r.explanation}</p>

            {r.kind === "partner" && r.partner && r.partner.insuranceAccepted.length > 0 && (
              <p className="mt-2 text-xs text-brand-600">
                <span className="font-medium">Insurance:</span> {r.partner.insuranceAccepted.join(" · ")}
              </p>
            )}

            {(r.matchedNeeds.length > 0 || r.matchedInterests.length > 0) && (
              <div className="mt-2 flex flex-wrap gap-1">
                {r.matchedNeeds.map((t) => (
                  <span key={`n_${t}`} className="pill bg-brand-50 text-brand-700">{t.replace(/_/g, " ")}</span>
                ))}
                {r.matchedInterests.map((t) => (
                  <span key={`i_${t}`} className="pill bg-brand-50 text-brand-600">{t.replace(/_/g, " ")}</span>
                ))}
              </div>
            )}

            <div className="mt-3">
              {r.kind === "course" ? (
                <Link href={r.courseHref ?? "/parent/learn"} className="btn-ghost">View events →</Link>
              ) : (
                <Link href={`/parent/resources/${r.id}`} className="btn-ghost">View partner →</Link>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
