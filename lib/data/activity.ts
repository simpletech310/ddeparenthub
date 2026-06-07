import { getDb } from "./store";
import { accessibleFamilyIds } from "@/lib/auth/access";
import type { User } from "@/lib/types";

export interface ActivityItem {
  at: string;
  icon: "log" | "doc" | "rsvp" | "checkin";
  text: string;
}

// Recent activity across the families this user can access — merges home logs,
// uploaded documents, RSVPs, and attendance check-ins, newest first.
export async function recentActivity(user: User, limit = 8): Promise<ActivityItem[]> {
  const db = await getDb();
  const famIds = new Set(await accessibleFamilyIds(user));
  const childName = (id: string) => db.children.find((c) => c.id === id)?.displayName ?? "a child";
  const userName = (id: string) => db.users.find((u) => u.id === id)?.name ?? "Someone";
  const familyName = (id: string) => db.families.find((f) => f.id === id)?.name ?? "A family";
  const goalChild = (goalId: string) => db.extractedGoals.find((g) => g.id === goalId)?.childId ?? "";

  const items: ActivityItem[] = [];

  for (const p of db.goalProgress) {
    if (!famIds.has(p.familyId)) continue;
    items.push({ at: p.observedAt, icon: "log", text: `${userName(p.observedByParentId)} logged a note for ${childName(goalChild(p.extractedGoalId))}` });
  }
  for (const d of db.documents) {
    if (!famIds.has(d.familyId)) continue;
    items.push({ at: d.createdAt, icon: "doc", text: `${d.docType.toUpperCase()} added for ${childName(d.childId)} (${familyName(d.familyId)})` });
  }
  for (const e of db.enrollments) {
    const parent = db.users.find((u) => u.id === e.parentId);
    if (!parent?.familyId || !famIds.has(parent.familyId)) continue;
    const cls = db.classes.find((c) => c.id === e.classId);
    if (e.checkedInAt) {
      items.push({ at: e.checkedInAt, icon: "checkin", text: `${parent.name} checked in to ${cls?.title ?? "an event"}` });
    } else {
      items.push({ at: e.createdAt, icon: "rsvp", text: `${parent.name} RSVP'd to ${cls?.title ?? "an event"}` });
    }
  }

  return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
}
