import { requireRole } from "@/lib/auth/session";
import { AppHeader } from "@/components/AppHeader";
import { TopNav } from "@/components/TopNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("admin");
  return (
    <div className="min-h-screen">
      <AppHeader name={user.name} roleLabel="Admin" homeHref="/admin" />
      <TopNav
        links={[
          { href: "/admin", label: "Users" },
          { href: "/admin/families", label: "Families" },
          { href: "/admin/partners", label: "Partners" },
          { href: "/admin/reporting", label: "Reporting" },
        ]}
      />
      <div className="mx-auto max-w-4xl px-4 py-5">{children}</div>
    </div>
  );
}
