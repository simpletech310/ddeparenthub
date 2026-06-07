import type { ReactNode } from "react";
import type { PartnerSocial } from "@/lib/types";

type Key = keyof PartnerSocial;

const ICONS: Record<Key, ReactNode> = {
  instagram: (
    <path d="M12 2c-2.7 0-3 0-4.1.06-1 .05-1.8.24-2.4.5a4.8 4.8 0 0 0-1.8 1.1A4.8 4.8 0 0 0 2.6 5.5c-.26.6-.45 1.4-.5 2.4C2.04 9 2 9.3 2 12s0 3 .06 4.1c.05 1 .24 1.8.5 2.4a4.8 4.8 0 0 0 1.1 1.8 4.8 4.8 0 0 0 1.8 1.1c.6.26 1.4.45 2.4.5C9 21.96 9.3 22 12 22s3 0 4.1-.06c1-.05 1.8-.24 2.4-.5a5 5 0 0 0 2.9-2.9c.26-.6.45-1.4.5-2.4.06-1.1.06-1.4.06-4.1s0-3-.06-4.1c-.05-1-.24-1.8-.5-2.4a4.8 4.8 0 0 0-1.1-1.8 4.8 4.8 0 0 0-1.8-1.1c-.6-.26-1.4-.45-2.4-.5C15 2.04 14.7 2 12 2zm0 1.8c2.67 0 2.98.01 4.04.06.97.04 1.5.2 1.85.34.46.18.8.4 1.15.74.34.35.56.69.74 1.15.14.35.3.88.34 1.85.05 1.06.06 1.37.06 4.04s-.01 2.98-.06 4.04c-.04.97-.2 1.5-.34 1.85-.18.46-.4.8-.74 1.15-.35.34-.69.56-1.15.74-.35.14-.88.3-1.85.34-1.06.05-1.37.06-4.04.06s-2.98-.01-4.04-.06c-.97-.04-1.5-.2-1.85-.34a3.1 3.1 0 0 1-1.15-.74 3.1 3.1 0 0 1-.74-1.15c-.14-.35-.3-.88-.34-1.85C3.81 14.98 3.8 14.67 3.8 12s.01-2.98.06-4.04c.04-.97.2-1.5.34-1.85.18-.46.4-.8.74-1.15.35-.34.69-.56 1.15-.74.35-.14.88-.3 1.85-.34C9.02 3.81 9.33 3.8 12 3.8zm0 3.06A5.14 5.14 0 1 0 17.14 12 5.14 5.14 0 0 0 12 6.86zm0 8.48A3.34 3.34 0 1 1 15.34 12 3.34 3.34 0 0 1 12 15.34zm5.34-8.69a1.2 1.2 0 1 0 1.2 1.2 1.2 1.2 0 0 0-1.2-1.2z" />
  ),
  facebook: <path d="M13.5 9H15.5V6.2h-2.3c-2.1 0-3.4 1.3-3.4 3.4V11H8v2.7h1.8V21h2.8v-7.3h2l.4-2.7h-2.4V9.8c0-.6.3-.8.9-.8z" />,
  youtube: (
    <path d="M21.6 7.2s-.2-1.4-.8-2c-.7-.8-1.6-.8-2-.9C16 4 12 4 12 4s-4 0-6.8.3c-.4 0-1.3.1-2 .9-.6.6-.8 2-.8 2S2 8.8 2 10.5v1.9c0 1.7.2 3.4.2 3.4s.2 1.4.8 2c.7.8 1.7.8 2.1.9 1.5.1 6.9.2 6.9.2s4 0 6.8-.3c.4 0 1.3-.1 2-.9.6-.6.8-2 .8-2s.2-1.6.2-3.3v-1.9c0-1.7-.2-3.3-.2-3.3zM10 14.6V8.9l4.8 2.9-4.8 2.8z" />
  ),
  tiktok: <path d="M16.5 3c.3 2 1.5 3.5 3.5 3.7v2.4c-1.3 0-2.5-.4-3.5-1v5.6a5.4 5.4 0 1 1-5.4-5.4c.3 0 .6 0 .9.07v2.5a2.9 2.9 0 1 0 2 2.8V3h2.5z" />,
  linkedin: (
    <path d="M6.94 7.5a1.94 1.94 0 1 1 0-3.88 1.94 1.94 0 0 1 0 3.88zM5.2 9h3.5v11H5.2V9zm5.3 0h3.35v1.5h.05c.47-.85 1.6-1.75 3.3-1.75 3.5 0 4.15 2.3 4.15 5.3V20h-3.5v-4.8c0-1.15 0-2.6-1.6-2.6s-1.85 1.25-1.85 2.5V20h-3.5V9z" />
  ),
  x: <path d="M17.5 3h3l-6.6 7.5L21.5 21H15l-4-5.2L6.3 21H3.3l7-8L2.8 3h6.6l3.6 4.8L17.5 3z" />,
};

const META: Record<Key, { label: string; base: string; bg: string }> = {
  instagram: { label: "Instagram", base: "https://instagram.com/", bg: "#E1306C" },
  facebook: { label: "Facebook", base: "https://facebook.com/", bg: "#1877F2" },
  youtube: { label: "YouTube", base: "https://youtube.com/", bg: "#FF0000" },
  tiktok: { label: "TikTok", base: "https://tiktok.com/@", bg: "#111111" },
  linkedin: { label: "LinkedIn", base: "https://linkedin.com/", bg: "#0A66C2" },
  x: { label: "X", base: "https://x.com/", bg: "#111111" },
};

const ORDER: Key[] = ["instagram", "facebook", "youtube", "tiktok", "linkedin", "x"];

function toUrl(key: Key, raw: string): string {
  const v = raw.trim();
  if (/^https?:\/\//i.test(v)) return v;
  return META[key].base + v.replace(/^@/, "");
}

export function SocialLinks({ social, size = "md" }: { social?: PartnerSocial; size?: "sm" | "md" }) {
  if (!social) return null;
  const entries = ORDER.filter((k) => (social[k] ?? "").trim());
  if (!entries.length) return null;
  const dim = size === "sm" ? "h-8 w-8" : "h-9 w-9";
  const icon = size === "sm" ? "h-4 w-4" : "h-[18px] w-[18px]";
  return (
    <div className="flex flex-wrap items-center gap-2">
      {entries.map((k) => (
        <a
          key={k}
          href={toUrl(k, social[k]!)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={META[k].label}
          title={META[k].label}
          className={`grid ${dim} place-items-center rounded-full text-white shadow-sm transition hover:opacity-90 hover:-translate-y-0.5`}
          style={{ backgroundColor: META[k].bg }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className={icon} aria-hidden>
            {ICONS[k]}
          </svg>
        </a>
      ))}
    </div>
  );
}
