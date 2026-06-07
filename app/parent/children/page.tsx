import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { listMyChildren } from "@/lib/data/repos";
import { addChildAction } from "@/lib/parent/actions";
import { Avatar } from "@/components/Avatar";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";

export default async function ChildrenPage() {
  const user = await requireRole("parent");
  const children = await listMyChildren(user);

  return (
    <div className="space-y-5">
      <PageHeader backHref="/parent" backLabel="Home" eyebrow="Family" title="Your children"
        subtitle="A profile helps us suggest the right resources. Tap a child to edit their photo, interests, and needs." />

      {children.length ? (
        <ul className="space-y-2">
          {children.map((c) => (
            <li key={c.id}>
              <Link href={`/parent/children/${c.id}`} className="card card-hover flex items-center gap-3">
                <Avatar name={c.displayName} src={c.avatarUrl} size="md" ring />
                <div className="min-w-0 flex-1">
                  <p className="font-display font-bold text-ink-900">{c.displayName}</p>
                  {(c.interestTags.length > 0 || c.needTags.length > 0) && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {c.interestTags.slice(0, 3).map((t) => (
                        <span key={t} className="pill bg-brand-100 text-brand-700">{t.replace(/_/g, " ")}</span>
                      ))}
                      {c.needTags.slice(0, 2).map((t) => (
                        <span key={t} className="pill bg-accent-100 text-accent-700">{t.replace(/_/g, " ")}</span>
                      ))}
                    </div>
                  )}
                </div>
                <span className="pill bg-brand-50 text-brand-700">Edit →</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon="users" title="No children yet" hint="Add your child below to start understanding their plan and tracking progress." />
      )}

      <form action={addChildAction} className="card space-y-3">
        <h2 className="font-display font-bold text-ink-900">Add a child</h2>
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
