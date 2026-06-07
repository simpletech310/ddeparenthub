import { requireRole } from "@/lib/auth/session";
import { listUsers } from "@/lib/data/repos";
import { toggleUserStatusAction } from "@/lib/admin/actions";
import { Avatar } from "@/components/Avatar";
import { PageHeader } from "@/components/PageHeader";

const ROLE_STYLE: Record<string, string> = {
  admin: "bg-accent-100 text-accent-700",
  staff: "bg-brand-100 text-brand-700",
  parent: "bg-teal-100 text-teal-700",
};

export default async function AdminUsers() {
  const me = await requireRole("admin");
  const users = await listUsers();

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Administration" title="User management"
        subtitle="Manage staff and parent accounts. Admins cannot view a parent's private documents — there is no override." />

      <ul className="space-y-2">
        {users.map((u) => (
          <li key={u.id} className="card flex items-center gap-3">
            <Avatar name={u.name} src={u.avatarUrl} size="md" />
            <div className="min-w-0 flex-1">
              <p className="font-display font-bold text-ink-900">{u.name}</p>
              <p className="truncate text-xs text-ink-400">{u.email}{u.title ? ` · ${u.title}` : ""}</p>
            </div>
            <span className={`pill capitalize ${ROLE_STYLE[u.role]}`}>{u.role}</span>
            <span className={`pill ${u.status === "active" ? "bg-brand-50 text-brand-700" : "bg-ink-100 text-ink-500"}`}>{u.status}</span>
            {u.id !== me.id && (
              <form action={toggleUserStatusAction}>
                <input type="hidden" name="userId" value={u.id} />
                <button className="text-xs font-medium text-ink-500 hover:text-accent-600 hover:underline" type="submit">
                  {u.status === "active" ? "Deactivate" : "Reactivate"}
                </button>
              </form>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
