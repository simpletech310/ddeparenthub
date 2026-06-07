import type { ActivityItem } from "@/lib/data/activity";
import { EmptyState } from "./EmptyState";

const ICON: Record<string, JSX.Element> = {
  log: <path strokeLinecap="round" strokeLinejoin="round" d="M11 5h6M11 9h6M11 13h4M5 5h.01M5 9h.01M5 13h.01" />,
  doc: <path strokeLinecap="round" strokeLinejoin="round" d="M7 3h7l5 5v13H7V3zM14 3v5h5" />,
  rsvp: <path strokeLinecap="round" strokeLinejoin="round" d="M7 4v3M17 4v3M4 9h16M5 7h14v13H5z" />,
  checkin: <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />,
};
const TINT: Record<string, string> = {
  log: "bg-brand-50 text-brand-600",
  doc: "bg-teal-50 text-teal-600",
  rsvp: "bg-accent-50 text-accent-600",
  checkin: "bg-brand-50 text-brand-600",
};

function ago(iso: string): string {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return "just now";
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  if (!items.length) {
    return <EmptyState icon="sparkle" title="No recent activity" hint="Check-ins, new documents, and home logs will show up here." />;
  }
  return (
    <ul className="card divide-y divide-ink-100 p-0">
      {items.map((it, i) => (
        <li key={i} className="flex items-center gap-3 px-4 py-3">
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${TINT[it.icon]}`}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>{ICON[it.icon]}</svg>
          </span>
          <p className="min-w-0 flex-1 text-sm text-ink-700">{it.text}</p>
          <span className="shrink-0 text-xs text-ink-400">{ago(it.at)}</span>
        </li>
      ))}
    </ul>
  );
}
