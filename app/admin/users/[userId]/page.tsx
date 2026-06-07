import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { getUser } from "@/lib/data/repos";
import { listFamilies } from "@/lib/data/families";
import { updateUserAction } from "@/lib/admin/actions";
import { PageHeader } from "@/components/PageHeader";
import { Avatar } from "@/components/Avatar";

export default async function EditUser({ params }: { params: { userId: string } }) {
  await requireRole("admin");
  const u = await getUser(params.userId);
  if (!u) notFound();
  const families = u.role === "parent" ? await listFamilies() : [];

  return (
    <div className="space-y-5">
      <PageHeader
        backHref="/admin/users"
        backLabel="User management"
        eyebrow="Edit user"
        title={u.name}
        subtitle={`${u.role}${u.title ? ` · ${u.title}` : ""}`}
      />

      <div className="card flex items-center gap-3">
        <Avatar name={u.name} src={u.avatarUrl} size="lg" />
        <div>
          <p className="font-display font-bold text-ink-900">{u.name}</p>
          <p className="text-xs text-ink-400">{u.email}</p>
        </div>
        <span className={`pill ml-auto ${u.status === "active" ? "bg-brand-50 text-brand-700" : "bg-ink-100 text-ink-500"}`}>{u.status}</span>
      </div>

      <form action={updateUserAction} className="card space-y-4">
        <input type="hidden" name="userId" value={u.id} />
        <div>
          <label className="label" htmlFor="name">Name</label>
          <input id="name" name="name" className="input" defaultValue={u.name} />
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" className="input" defaultValue={u.email} />
        </div>
        {u.role === "staff" && (
          <div>
            <label className="label" htmlFor="title">Title</label>
            <input id="title" name="title" className="input" defaultValue={u.title ?? ""} placeholder="BCBA · Behavior Technician" />
          </div>
        )}
        {u.role === "parent" && (
          <div>
            <label className="label" htmlFor="familyId">Family</label>
            <select id="familyId" name="familyId" className="input" defaultValue={u.familyId ?? ""}>
              <option value="">— No family —</option>
              {families.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-ink-400">Moving a parent changes which family's records they can see.</p>
          </div>
        )}
        <button className="btn-primary w-full" type="submit">Save changes</button>
      </form>
    </div>
  );
}
