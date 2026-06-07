import { Logo } from "./Logo";
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
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");
  return (
    <header className="sticky top-0 z-30 border-b border-white/50 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Logo href={homeHref} size="sm" />
        <div className="flex items-center gap-2.5">
          <div className="text-right">
            <p className="text-xs font-semibold leading-tight text-ink-900">{name}</p>
            <p className="eyebrow text-[10px]">{roleLabel}</p>
          </div>
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ backgroundImage: "linear-gradient(135deg,#36b3f7,#21b88f)" }}
          >
            {initials}
          </span>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
