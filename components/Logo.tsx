import Link from "next/link";

// DDE brand lockup: gradient rounded mark with a "D" + sunny dot, and a Quicksand wordmark.
export function Logo({
  href = "/",
  size = "md",
  wordmark = true,
}: {
  href?: string;
  size?: "sm" | "md";
  wordmark?: boolean;
}) {
  const dim = size === "sm" ? "h-8 w-8 text-base" : "h-9 w-9 text-lg";
  return (
    <Link href={href} className="group flex items-center gap-2.5">
      <span
        className={`relative flex ${dim} items-center justify-center rounded-xl font-display font-bold text-white shadow-glow transition-transform group-hover:scale-105`}
        style={{ backgroundImage: "linear-gradient(135deg,#00a2e8,#019e7c)" }}
      >
        D
        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-sun-400" />
      </span>
      {wordmark && (
        <span className="font-display text-[15px] font-bold leading-none text-ink-900">
          DDE <span className="text-brand-500">Hub</span>
        </span>
      )}
    </Link>
  );
}
