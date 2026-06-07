"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function TopNav({ links }: { links: { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <nav className="sticky top-[57px] z-20 border-b border-white/50 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-4xl gap-1 overflow-x-auto px-4">
        {links.map((l) => {
          const active = l.href === "/staff" || l.href === "/admin" ? pathname === l.href : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`relative whitespace-nowrap px-3 py-3 text-sm font-semibold font-display transition-colors ${
                active ? "text-brand-700" : "text-ink-500 hover:text-ink-800"
              }`}
            >
              {l.label}
              {active && (
                <span
                  className="absolute inset-x-2 bottom-0 h-[3px] rounded-full"
                  style={{ backgroundImage: "linear-gradient(90deg,#00a2e8,#019e7c)" }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
