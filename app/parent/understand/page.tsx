import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { listMyChildren, listMyDocuments } from "@/lib/data/repos";

export default async function UnderstandPage() {
  const user = await requireRole("parent");
  const docs = await listMyDocuments(user);
  const children = await listMyChildren(user);
  const childName = (childId: string) =>
    children.find((c) => c.id === childId)?.displayName ?? "Child";

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-brand-900">Understand</h1>
        <p className="text-sm text-ink-600">
          Upload your child's IEP or triennial evaluation and get a plain-language breakdown.
          Your documents are private to you — DDE staff and admins cannot see them.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/parent/understand/upload?type=iep" className="card text-center hover:border-brand-300">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
            IEP
          </div>
          <p className="text-sm font-semibold text-brand-900">Upload an IEP</p>
          <p className="text-xs text-ink-500">Goals, services, accommodations</p>
        </Link>
        <Link href="/parent/understand/upload?type=triennial" className="card text-center hover:border-brand-300">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-accent-500 text-white">
            3yr
          </div>
          <p className="text-sm font-semibold text-brand-900">Triennial evaluation</p>
          <p className="text-xs text-ink-500">Assessment scores, eligibility</p>
        </Link>
      </div>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-600">
          Your documents
        </h2>
        <ul className="space-y-2">
          {docs.map((d) => (
            <li key={d.id}>
              <Link
                href={`/parent/understand/${d.id}`}
                className="card flex items-center justify-between hover:border-brand-300"
              >
                <div>
                  <p className="font-semibold text-brand-900">{d.fileName}</p>
                  <p className="text-xs text-ink-500">
                    {childName(d.childId)} ·{" "}
                    <span className="uppercase">{d.docType === "iep" ? "IEP" : "Triennial"}</span> ·{" "}
                    {new Date(d.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="pill bg-brand-50 text-ink-600">View →</span>
              </Link>
            </li>
          ))}
          {!docs.length && (
            <li className="card text-sm text-ink-500">
              No documents yet. Upload one above to see a breakdown.
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}
