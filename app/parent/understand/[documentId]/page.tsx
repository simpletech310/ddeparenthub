import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { getBreakdownByDoc, getChildById, getDocumentById } from "@/lib/data/repos";
import { recommendationsForChild } from "@/lib/data/recommendations";
import { deleteDocumentAction, reanalyzeDocumentAction } from "@/lib/parent/actions";
import { BreakdownView } from "./BreakdownView";
import { RecommendationList } from "@/components/RecommendationList";

// Re-analyze runs the live two-step AI breakdown (~30s); allow time beyond the default timeout.
export const maxDuration = 60;

export default async function DocumentPage({
  params,
  searchParams,
}: {
  params: { documentId: string };
  searchParams: { reanalyzed?: string };
}) {
  const user = await requireRole("parent");
  const doc = await getDocumentById(user, params.documentId);
  if (!doc) notFound();
  const breakdown = await getBreakdownByDoc(user, params.documentId);
  if (!breakdown) notFound();

  const child = await getChildById(user, doc.childId);
  const recs = (await recommendationsForChild(user, doc.childId)).slice(0, 4);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link href="/parent/understand" className="text-sm text-ink-600">← Understand</Link>
          <h1 className="mt-1 text-xl font-bold text-brand-900">{doc.fileName}</h1>
          <p className="text-xs text-ink-500">
            {child?.displayName} ·{" "}
            <span className="uppercase">{doc.docType === "iep" ? "IEP" : "Triennial"}</span>
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <form action={reanalyzeDocumentAction}>
            <input type="hidden" name="documentId" value={doc.id} />
            <button className="btn-ghost py-1.5 text-xs" type="submit">Re-analyze</button>
          </form>
          <form action={deleteDocumentAction}>
            <input type="hidden" name="documentId" value={doc.id} />
            <button className="text-xs font-medium text-accent-600 hover:underline" type="submit">Delete</button>
          </form>
        </div>
      </div>

      {searchParams.reanalyzed === "same" && (
        <div className="rounded-xl border border-brand-200 bg-brand-50 p-3 text-xs text-brand-700">
          ✓ Re-analyzed — your breakdown is unchanged. The same document always produces the same
          result (analysis version {breakdown.promptVersion}).
        </div>
      )}
      {searchParams.reanalyzed === "changed" && (
        <div className="rounded-xl border border-accent-200 bg-accent-50 p-3 text-xs text-accent-700">
          Updated to the latest analysis version ({breakdown.promptVersion}).
        </div>
      )}

      <BreakdownView payload={breakdown.payload} docType={doc.docType} />

      {recs.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-600">
            Recommended supports{child ? ` for ${child.displayName}` : ""}
          </h2>
          <p className="mb-2 text-xs text-ink-500">
            Grounded in this IEP's goals and {child?.displayName}'s profile — real DDE classes and partners.
          </p>
          <RecommendationList recs={recs} />
        </section>
      )}
    </div>
  );
}
