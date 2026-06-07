import Link from "next/link";
import type { Recommendation } from "@/lib/data/recommendations";

export function RecommendationList({ recs }: { recs: Recommendation[] }) {
  if (!recs.length) {
    return (
      <p className="card text-sm text-ink-500">
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
                <p className="text-xs text-ink-500">{r.subtitle}</p>
              </div>
              <span className={`pill ${r.kind === "partner" ? "bg-accent-100 text-accent-700" : "bg-brand-100 text-brand-700"}`}>
                {r.kind === "partner" ? "Partner" : "DDE class"}
              </span>
            </div>

            {r.kind === "partner" && r.partner?.tagline && (
              <p className="mt-1 text-sm italic text-ink-600">{r.partner.tagline}</p>
            )}

            {r.acceptsInsurance && (
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-700">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                Accepts your insurance
              </span>
            )}

            <p className="mt-2 text-sm text-ink-600">{r.explanation}</p>

            {r.kind === "partner" && r.partner && r.partner.insuranceAccepted.length > 0 && (
              <p className="mt-2 text-xs text-ink-600">
                <span className="font-medium">Insurance:</span> {r.partner.insuranceAccepted.join(" · ")}
              </p>
            )}

            {(r.matchedNeeds.length > 0 || r.matchedInterests.length > 0) && (
              <div className="mt-2 flex flex-wrap gap-1">
                {r.matchedNeeds.map((t) => (
                  <span key={`n_${t}`} className="pill bg-brand-50 text-brand-700">{t.replace(/_/g, " ")}</span>
                ))}
                {r.matchedInterests.map((t) => (
                  <span key={`i_${t}`} className="pill bg-brand-50 text-ink-600">{t.replace(/_/g, " ")}</span>
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
