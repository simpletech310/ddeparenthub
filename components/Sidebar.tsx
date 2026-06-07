"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/auth/actions";
import { Logo } from "./Logo";
import { Avatar } from "./Avatar";
import { QuickSearch } from "./QuickSearch";
import type { SearchItem } from "@/lib/data/search";

export interface NavLink {
  href: string;
  label: string;
  icon: keyof typeof ICONS;
  exact?: boolean;
}

export function Sidebar({
  homeHref,
  links,
  name,
  roleLabel,
  avatarUrl,
  accountHref,
  searchItems,
}: {
  homeHref: string;
  links: NavLink[];
  name: string;
  roleLabel: string;
  avatarUrl?: string | null;
  accountHref: string;
  searchItems: SearchItem[];
}) {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-ink-100 bg-white/70 px-4 py-5 backdrop-blur-xl md:flex">
      <div className="px-1">
        <Logo href={homeHref} />
      </div>

      <div className="mt-5">
        <QuickSearch items={searchItems} />
      </div>

      <nav className="mt-5 flex-1 space-y-1">
        {links.map((l) => {
          const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold font-display transition ${
                active ? "text-white shadow-soft" : "text-ink-600 hover:bg-brand-50 hover:text-brand-700"
              }`}
              style={active ? { backgroundImage: "linear-gradient(135deg,#00a2e8,#019e7c)" } : undefined}
            >
              <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>{ICONS[l.icon]}</svg>
              {l.label}
            </Link>
          );
        })}
      </nav>

      <Link href={accountHref} className="mt-2 flex items-center gap-3 rounded-2xl border border-ink-100 bg-white p-2.5 shadow-soft transition hover:border-brand-200">
        <Avatar name={name} src={avatarUrl} size="sm" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-ink-900">{name}</span>
          <span className="block text-[10px] font-bold uppercase tracking-wide text-brand-600">{roleLabel}</span>
        </span>
        <form action={logout}>
          <button type="submit" title="Sign out" className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 hover:bg-ink-50 hover:text-accent-500">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17l5-5-5-5M20 12H9M9 4H6a2 2 0 00-2 2v12a2 2 0 002 2h3" /></svg>
          </button>
        </form>
      </Link>
    </aside>
  );
}

export const ICONS = {
  dashboard: <path strokeLinecap="round" strokeLinejoin="round" d="M4 13h6V4H4v9zM14 20h6V4h-6v16zM4 20h6v-4H4v4z" />,
  families: <path strokeLinecap="round" strokeLinejoin="round" d="M16 19v-1a4 4 0 00-4-4H8a4 4 0 00-4 4v1M10 7a3 3 0 100 6 3 3 0 000-6zM20 19v-1a3 3 0 00-2-2.8M16 7.2a3 3 0 010 5.6" />,
  course: <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a2 2 0 012-2h7v16H6a2 2 0 00-2 2V5zM13 3h5a2 2 0 012 2v14a2 2 0 00-2-2h-5" />,
  template: <path strokeLinecap="round" strokeLinejoin="round" d="M4 5h7v6H4V5zM13 5h7v4h-7V5zM13 12h7v7h-7v-7zM4 14h7v5H4v-5z" />,
  partners: <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-7-4.3-9.3-8.3A5.2 5.2 0 0112 6a5.2 5.2 0 019.3 6.7C19 16.7 12 21 12 21z" />,
  users: <path strokeLinecap="round" strokeLinejoin="round" d="M16 19v-1a4 4 0 00-4-4H8a4 4 0 00-4 4v1M10 7a3 3 0 100 6 3 3 0 000-6zM20 19v-1a3 3 0 00-2-2.8" />,
  chart: <path strokeLinecap="round" strokeLinejoin="round" d="M4 19V5M4 19h16M8 16v-5M12 16V8M16 16v-3" />,
  account: <path strokeLinecap="round" strokeLinejoin="round" d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 20a8 8 0 0116 0" />,
} as const;
