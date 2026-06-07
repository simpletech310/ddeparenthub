"use client";

import { useState } from "react";
import type { ChoiceOption, TagGroup, TagOption } from "@/lib/data/taxonomy";

// Tappable chip picker. Writes the selection into a hidden input (comma-joined tags)
// so it submits with the surrounding form. Supports grouped/flat multi-select and
// single-select. Friendly + touch-first.

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3.5 py-2 text-sm font-semibold transition ${
        active
          ? "text-white shadow-soft"
          : "border border-ink-200 bg-white text-ink-600 hover:border-brand-300 hover:text-brand-700"
      }`}
      style={active ? { backgroundImage: "linear-gradient(135deg,#00a2e8,#019e7c)" } : undefined}
    >
      {label}
    </button>
  );
}

// Multi-select, optionally grouped.
export function TagPicker({
  name,
  groups,
  options,
  initial = [],
}: {
  name: string;
  groups?: TagGroup[];
  options?: TagOption[];
  initial?: string[];
}) {
  const [sel, setSel] = useState<Set<string>>(new Set(initial));
  const toggle = (tag: string) =>
    setSel((s) => {
      const n = new Set(s);
      n.has(tag) ? n.delete(tag) : n.add(tag);
      return n;
    });

  return (
    <div>
      <input type="hidden" name={name} value={Array.from(sel).join(",")} />
      {groups ? (
        <div className="space-y-3">
          {groups.map((g) => (
            <div key={g.label}>
              <p className="mb-1.5 text-xs font-bold text-ink-500">
                <span className="mr-1">{g.emoji}</span>
                {g.label}
              </p>
              <div className="flex flex-wrap gap-2">
                {g.options.map((o) => (
                  <Chip key={o.tag} label={o.label} active={sel.has(o.tag)} onClick={() => toggle(o.tag)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {options?.map((o) => (
            <Chip key={o.tag} label={o.label} active={sel.has(o.tag)} onClick={() => toggle(o.tag)} />
          ))}
        </div>
      )}
    </div>
  );
}

// Single-select choice chips (e.g. communication style).
export function ChoicePicker({
  name,
  options,
  initial,
}: {
  name: string;
  options: ChoiceOption[];
  initial?: string;
}) {
  const [val, setVal] = useState<string>(initial ?? "");
  return (
    <div>
      <input type="hidden" name={name} value={val} />
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <Chip key={o.value} label={o.label} active={val === o.value} onClick={() => setVal(val === o.value ? "" : o.value)} />
        ))}
      </div>
    </div>
  );
}

// Multi-select for plain string values (e.g. insurance names — preserve case).
export function StringPicker({
  name,
  options,
  initial = [],
}: {
  name: string;
  options: string[];
  initial?: string[];
}) {
  const [sel, setSel] = useState<Set<string>>(new Set(initial));
  const toggle = (v: string) =>
    setSel((s) => {
      const n = new Set(s);
      n.has(v) ? n.delete(v) : n.add(v);
      return n;
    });
  return (
    <div>
      <input type="hidden" name={name} value={Array.from(sel).join("|")} />
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <Chip key={o} label={o} active={sel.has(o)} onClick={() => toggle(o)} />
        ))}
      </div>
    </div>
  );
}
