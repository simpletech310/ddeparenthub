"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { SearchItem } from "@/lib/data/search";

const TYPE_STYLE: Record<string, string> = {
  family: "bg-brand-100 text-brand-700",
  course: "bg-teal-100 text-teal-700",
  partner: "bg-accent-100 text-accent-700",
};

export function QuickSearch({ items }: { items: SearchItem[] }) {
  const [q, setQ] = useState("");
  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return [];
    return items.filter((i) => i.label.toLowerCase().includes(t) || i.sub.toLowerCase().includes(t)).slice(0, 7);
  }, [q, items]);

  return (
    <div className="relative">
      <div className="relative">
        <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3" />
        </svg>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search families, courses…"
          className="w-full rounded-xl border border-ink-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
        />
      </div>
      {results.length > 0 && (
        <ul className="absolute z-50 mt-1.5 w-full overflow-hidden rounded-xl border border-ink-100 bg-white shadow-card">
          {results.map((r, i) => (
            <li key={i}>
              <Link href={r.href} onClick={() => setQ("")} className="flex items-center justify-between gap-2 px-3 py-2 hover:bg-brand-50">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-ink-800">{r.label}</span>
                  <span className="block truncate text-xs text-ink-400">{r.sub}</span>
                </span>
                <span className={`pill capitalize ${TYPE_STYLE[r.type]}`}>{r.type}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
