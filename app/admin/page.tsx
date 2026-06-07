import { requireRole } from "@/lib/auth/session";
import { listUsers } from "@/lib/data/repos";
import { toggleUserStatusAction } from "@/lib/admin/actions";

const ROLE_STYLE: Record<string, string> = {
  admin: "bg-accent-100 text-accent-700",
  staff: "bg-brand-100 text-brand-700",
  parent: "bg-brand-50 text-brand-600",
};

export default async function AdminUsers() {
  const me = await requireRole("admin");
  const users = await listUsers();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-brand-900">User management</h1>
        <p className="text-sm text-brand-600">
          Manage staff and parent accounts. Admins cannot view any parent's private documents or
          breakdowns — there is no override.
        </p>
      </div>

      <section className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-brand-500">
              <th className="py-1.5">Name</th>
              <th className="py-1.5">Role</th>
              <th className="py-1.5">Status</th>
              <th className="py-1.5"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-brand-50">
                <td className="py-2">
                  <p className="font-medium text-brand-800">{u.name}</p>
                  <p className="text-xs text-brand-500">{u.email}</p>
                </td>
                <td className="py-2">
                  <span className={`pill capitalize ${ROLE_STYLE[u.role]}`}>{u.role}</span>
                </td>
                <td className="py-2">
                  <span
                    className={`pill ${
                      u.status === "active" ? "bg-brand-50 text-brand-700" : "bg-accent-50 text-accent-700"
                    }`}
                  >
                    {u.status}
                  </span>
                </td>
                <td className="py-2 text-right">
                  {u.id !== me.id && (
                    <form action={toggleUserStatusAction} className="inline">
                      <input type="hidden" name="userId" value={u.id} />
                      <button className="text-xs font-medium text-brand-600 hover:underline" type="submit">
                        {u.status === "active" ? "Deactivate" : "Reactivate"}
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
