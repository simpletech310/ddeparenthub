"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/parent", label: "Home", icon: HomeIcon, exact: true },
  { href: "/parent/understand", label: "Understand", icon: DocIcon },
  { href: "/parent/learn", label: "Learn", icon: BookIcon },
  { href: "/parent/track", label: "Track", icon: ChartIcon },
  { href: "/parent/settings", label: "Settings", icon: GearIcon },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-2">
      <div className="mx-auto grid max-w-md grid-cols-5 rounded-3xl border border-white/60 bg-white/80 p-1.5 shadow-[0_-2px_30px_-10px_rgba(20,33,50,0.25)] backdrop-blur-xl">
        {TABS.map((t) => {
          const active = t.exact ? pathname === t.href : pathname.startsWith(t.href);
          const Icon = t.icon;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`flex flex-col items-center gap-1 rounded-2xl py-1.5 text-[10px] font-semibold font-display transition-all ${
                active ? "text-white" : "text-ink-400 hover:text-brand-600"
              }`}
              style={active ? { backgroundImage: "linear-gradient(135deg,#00a2e8,#019e7c)" } : undefined}
            >
              <Icon />
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

const cls = "h-[22px] w-[22px]";
function HomeIcon() {
  return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 11l9-7 9 7M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" />
    </svg>
  );
}
function DocIcon() {
  return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 3h7l5 5v13H7V3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5h5M9 13h6M9 17h6" />
    </svg>
  );
}
function BookIcon() {
  return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a2 2 0 012-2h7v16H6a2 2 0 00-2 2V5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 3h5a2 2 0 012 2v14a2 2 0 00-2-2h-5" />
    </svg>
  );
}
function ChartIcon() {
  return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 19V5M4 19h16M8 16v-5M12 16V8M16 16v-3" />
    </svg>
  );
}
function GearIcon() {
  return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.4 13a7.5 7.5 0 000-2l1.5-1.2-1.5-2.6-1.8.7a7.5 7.5 0 00-1.7-1l-.3-1.9h-3l-.3 1.9a7.5 7.5 0 00-1.7 1l-1.8-.7L4 9.8 5.5 11a7.5 7.5 0 000 2L4 14.2l1.5 2.6 1.8-.7a7.5 7.5 0 001.7 1l.3 1.9h3l.3-1.9a7.5 7.5 0 001.7-1l1.8.7 1.5-2.6L19.4 13z" />
    </svg>
  );
}
