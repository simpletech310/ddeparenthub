import { getDb } from "./store";
import { accessibleFamilyIds } from "@/lib/auth/access";
import { listPartners } from "./partners";
import type { User } from "@/lib/types";

export interface SearchItem {
  type: "family" | "course" | "partner";
  label: string;
  sub: string;
  href: string;
}

// Build a flat, access-scoped index for the sidebar quick-search.
// Staff/admin only (parents don't get the sidebar). Families are scoped to access.
export async function searchIndex(user: User): Promise<SearchItem[]> {
  const db = await getDb();
  const items: SearchItem[] = [];

  const famIds = new Set(await accessibleFamilyIds(user));
  const basePath = user.role === "admin" ? "/admin/families" : "/staff/families";
  for (const f of db.families) {
    if (!famIds.has(f.id)) continue;
    const kids = db.children.filter((c) => c.familyId === f.id).map((c) => c.displayName);
    items.push({ type: "family", label: f.name, sub: kids.join(", ") || "Family", href: `${basePath}/${f.id}` });
  }

  for (const c of db.courses) {
    if (user.role === "staff" && c.ownerStaffId !== user.id && !c.isTemplate) continue;
    items.push({ type: "course", label: c.title, sub: `Course · ${c.status}`, href: `/staff/courses/${c.id}` });
  }

  if (user.role === "admin") {
    for (const p of await listPartners(true)) {
      items.push({ type: "partner", label: p.name, sub: `Partner · ${p.category}`, href: `/admin/partners/${p.id}` });
    }
  }

  return items;
}
