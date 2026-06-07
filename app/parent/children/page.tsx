import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { listMyChildren } from "@/lib/data/repos";
import { addChildAction } from "@/lib/parent/actions";

export default async function ChildrenPage() {
  const user = await requireRole("parent");
  const children = await listMyChildren(user);

  return (
    <div className="space-y-5">
      <div>
        <Link href="/parent" className="text-sm text-ink-600">
          ← Home
        </Link>
        <h1 className="mt-1 text-xl font-bold text-brand-900">Your children</h1>
        <p className="text-sm text-ink-600">
          A profile helps us suggest the right resources. Tap a child to edit their interests and needs.
        </p>
      </div>

      <ul className="space-y-2">
        {children.map((c) => (
          <li key={c.id}>
            <Link href={`/parent/children/${c.id}`} className="card block hover:border-brand-300">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-brand-900">{c.displayName}</p>
                <span className="pill bg-brand-50 text-ink-600">Edit profile →</span>
              </div>
              {(c.interestTags.length > 0 || c.needTags.length > 0) && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {c.interestTags.map((t) => (
                    <span key={t} className="pill bg-brand-100 text-brand-700">{t.replace(/_/g, " ")}</span>
                  ))}
                  {c.needTags.map((t) => (
                    <span key={t} className="pill bg-accent-100 text-accent-700">{t.replace(/_/g, " ")}</span>
                  ))}
                </div>
              )}
            </Link>
          </li>
        ))}
        {!children.length && <li className="card text-sm text-ink-500">No children added yet.</li>}
      </ul>

      <form action={addChildAction} className="card space-y-3">
        <h2 className="font-semibold text-brand-900">Add a child</h2>
        <div>
          <label className="label" htmlFor="displayName">First name or nickname</label>
          <input id="displayName" name="displayName" className="input" required placeholder="Leo" />
        </div>
        <div>
          <label className="label" htmlFor="dob">Date of birth (optional)</label>
          <input id="dob" name="dob" type="date" className="input" />
        </div>
        <p className="text-xs text-ink-500">We store the minimum needed — no full legal name required.</p>
        <button className="btn-primary w-full" type="submit">Add child</button>
      </form>
    </div>
  );
}
