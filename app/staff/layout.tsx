import { requireRole } from "@/lib/auth/session";
import { searchIndex } from "@/lib/data/search";
import { AppHeader } from "@/components/AppHeader";
import { TopNav } from "@/components/TopNav";
import { Sidebar, type NavLink } from "@/components/Sidebar";

const LINKS: NavLink[] = [
  { href: "/staff", label: "Dashboard", icon: "dashboard", exact: true },
  { href: "/staff/families", label: "My families", icon: "families" },
  { href: "/staff/courses/new", label: "New course", icon: "course" },
  { href: "/staff/templates", label: "Templates", icon: "template" },
  { href: "/staff/account", label: "Account", icon: "account" },
];

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("staff");
  const searchItems = await searchIndex(user);
  return (
    <div className="min-h-screen md:flex">
      <Sidebar homeHref="/staff" links={LINKS} name={user.name} roleLabel="Staff" avatarUrl={user.avatarUrl} accountHref="/staff/account" searchItems={searchItems} />
      <div className="min-w-0 flex-1">
        <div className="md:hidden">
          <AppHeader name={user.name} roleLabel="Staff" homeHref="/staff" avatarUrl={user.avatarUrl} />
          <TopNav links={LINKS.map((l) => ({ href: l.href, label: l.label }))} />
        </div>
        <main className="mx-auto max-w-4xl animate-fade-up px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
