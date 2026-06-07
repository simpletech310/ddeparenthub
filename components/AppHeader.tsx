import { Logo } from "./Logo";
import { LogoutButton } from "./LogoutButton";
import { Avatar } from "./Avatar";

export function AppHeader({
  name,
  roleLabel,
  homeHref,
  avatarUrl,
}: {
  name: string;
  roleLabel: string;
  homeHref: string;
  avatarUrl?: string | null;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/50 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Logo href={homeHref} size="sm" />
        <div className="flex items-center gap-2.5">
          <div className="text-right">
            <p className="text-xs font-semibold leading-tight text-ink-900">{name}</p>
            <p className="eyebrow text-[10px]">{roleLabel}</p>
          </div>
          <Avatar name={name} src={avatarUrl} size="sm" ring />
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
