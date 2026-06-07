import { requireRole } from "@/lib/auth/session";
import { searchIndex } from "@/lib/data/search";
import { AppHeader } from "@/components/AppHeader";
import { TopNav } from "@/components/TopNav";
import { Sidebar, type NavLink } from "@/components/Sidebar";

const LINKS: NavLink[] = [
  { href: "/admin", label: "Dashboard", icon: "dashboard", exact: true },
  { href: "/admin/families", label: "Families", icon: "families" },
  { href: "/admin/partners", label: "Partners", icon: "partners" },
  { href: "/admin/users", label: "Users", icon: "users" },
  { href: "/admin/reporting", label: "Reporting", icon: "chart" },
  { href: "/admin/account", label: "Account", icon: "account" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("admin");
  const searchItems = await searchIndex(user);
  return (
    <div className="min-h-screen md:flex">
      <Sidebar homeHref="/admin" links={LINKS} name={user.name} roleLabel="Admin" avatarUrl={user.avatarUrl} accountHref="/admin/account" searchItems={searchItems} />
      <div className="min-w-0 flex-1">
        <div className="md:hidden">
          <AppHeader name={user.name} roleLabel="Admin" homeHref="/admin" avatarUrl={user.avatarUrl} />
          <TopNav links={LINKS.map((l) => ({ href: l.href, label: l.label }))} />
        </div>
        <main className="mx-auto max-w-4xl animate-fade-up px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
