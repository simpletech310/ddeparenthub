import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { listMyChildren } from "@/lib/data/repos";
import { getFamily } from "@/lib/data/families";
import { uploadDocumentAction } from "@/lib/parent/actions";
import type { DocType } from "@/lib/types";

export default async function UploadPage({
  searchParams,
}: {
  searchParams: { type?: string };
}) {
  const user = await requireRole("parent");
  const children = await listMyChildren(user);
  const docType: DocType = searchParams.type === "triennial" ? "triennial" : "iep";
  const family = user.familyId ? await getFamily(user.familyId) : undefined;
  const needsConsent = !family?.consentAcceptedAt;

  if (!children.length) {
    return (
      <div className="space-y-4">
        <Link href="/parent/understand" className="text-sm text-brand-600">
          ← Understand
        </Link>
        <div className="card">
          <p className="text-sm text-brand-700">
            Add a child first so we can attach this document to them.
          </p>
          <Link href="/parent/children" className="btn-primary mt-3 inline-flex">
            Add a child
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link href="/parent/understand" className="text-sm text-brand-600">
        ← Understand
      </Link>
      <div>
        <h1 className="text-xl font-bold text-brand-900">
          Upload {docType === "iep" ? "an IEP" : "a triennial evaluation"}
        </h1>
        <p className="text-sm text-brand-600">
          We'll create a plain-language breakdown you can revisit anytime.
        </p>
      </div>

      <form action={uploadDocumentAction} className="card space-y-4">
        <input type="hidden" name="docType" value={docType} />

        <div>
          <label className="label" htmlFor="childId">
            Which child is this for?
          </label>
          <select id="childId" name="childId" className="input" required>
            {children.map((c) => (
              <option key={c.id} value={c.id}>
                {c.displayName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="file">
            Document (PDF or photo)
          </label>
          <input id="file" name="fileName" type="text" className="input" placeholder="e.g. Leo-IEP-2026.pdf" />
          <p className="mt-1 text-xs text-brand-500">
            Prototype note: file parsing/OCR is stubbed — type a file name to simulate the upload.
          </p>
        </div>

        {needsConsent && (
          <label className="flex items-start gap-2 rounded-xl bg-brand-50 p-3 text-xs text-brand-700">
            <input type="checkbox" name="consent" className="mt-0.5" required />
            <span>
              I understand this tool uses AI to help me understand my child's document, that it is not
              legal advice, and I consent to processing this document. See our Privacy Policy.
            </span>
          </label>
        )}

        <button className="btn-primary w-full" type="submit">
          Create breakdown
        </button>
      </form>
    </div>
  );
}
