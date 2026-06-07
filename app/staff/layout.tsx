import { requireRole } from "@/lib/auth/session";
import { AppHeader } from "@/components/AppHeader";
import { TopNav } from "@/components/TopNav";

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("staff");
  return (
    <div className="min-h-screen">
      <AppHeader name={user.name} roleLabel="Staff" homeHref="/staff" />
      <TopNav
        links={[
          { href: "/staff", label: "Dashboard" },
          { href: "/staff/families", label: "My families" },
          { href: "/staff/courses/new", label: "New course" },
          { href: "/staff/templates", label: "Template library" },
        ]}
      />
      <div className="mx-auto max-w-4xl animate-fade-up px-4 py-6">{children}</div>
    </div>
  );
}
