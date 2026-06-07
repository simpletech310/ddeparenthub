// Circular avatar: shows the photo if provided, else gradient initials.
const SIZES = {
  xs: "h-7 w-7 text-[10px]",
  sm: "h-9 w-9 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-16 w-16 text-lg",
  xl: "h-24 w-24 text-2xl",
} as const;

// Deterministic gradient per name so fallbacks feel intentional.
const GRADIENTS = [
  "linear-gradient(135deg,#00a2e8,#019e7c)",
  "linear-gradient(135deg,#36b3f7,#1a84ee)",
  "linear-gradient(135deg,#21b88f,#019e7c)",
  "linear-gradient(135deg,#ff7a59,#f85a32)",
  "linear-gradient(135deg,#0a679c,#00a2e8)",
];

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Avatar({
  name,
  src,
  size = "md",
  ring = false,
}: {
  name: string;
  src?: string | null;
  size?: keyof typeof SIZES;
  ring?: boolean;
}) {
  const ringCls = ring ? "ring-2 ring-white shadow-soft" : "";
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={name}
        className={`${SIZES[size]} ${ringCls} shrink-0 rounded-full object-cover`}
      />
    );
  }
  const grad = GRADIENTS[(name.charCodeAt(0) || 0) % GRADIENTS.length];
  return (
    <span
      className={`${SIZES[size]} ${ringCls} flex shrink-0 items-center justify-center rounded-full font-display font-bold text-white`}
      style={{ backgroundImage: grad }}
      aria-label={name}
    >
      {initials(name) || "·"}
    </span>
  );
}
