import Link from "next/link";
import { LogoutButton } from "./LogoutButton";

export function AppHeader({
  name,
  roleLabel,
  homeHref,
}: {
  name: string;
  roleLabel: string;
  homeHref: string;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-brand-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link href={homeHref} className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
            D
          </span>
          <span className="text-sm font-semibold text-brand-900">DDE Hub</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs font-medium leading-tight text-brand-900">{name}</p>
            <p className="text-[10px] uppercase tracking-wide text-brand-500">{roleLabel}</p>
          </div>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
