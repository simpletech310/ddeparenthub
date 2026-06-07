import { getDb, saveDb, id, nowIso } from "./store";
import type { Family, User } from "@/lib/types";

// Family + staff-assignment management (admin-facing) and family settings. Async store.

export async function listFamilies(): Promise<Family[]> {
  return (await getDb()).families;
}
export async function getFamily(familyId: string): Promise<Family | undefined> {
  return (await getDb()).families.find((f) => f.id === familyId);
}
export async function createFamily(name: string): Promise<Family> {
  const family: Family = { id: id("fam"), name, retentionMonths: null, consentAcceptedAt: null };
  await saveDb((db) => db.families.push(family));
  return family;
}
export async function updateFamilySettings(
  familyId: string,
  patch: Partial<Pick<Family, "name" | "retentionMonths" | "consentAcceptedAt">>
): Promise<void> {
  await saveDb((db) => {
    const f = db.families.find((x) => x.id === familyId);
    if (f) Object.assign(f, patch);
  });
}
export async function acceptFamilyConsent(familyId: string): Promise<void> {
  await saveDb((db) => {
    const f = db.families.find((x) => x.id === familyId);
    if (f && !f.consentAcceptedAt) f.consentAcceptedAt = nowIso();
  });
}

export async function listFamilyParents(familyId: string): Promise<User[]> {
  return (await getDb()).users.filter((u) => u.role === "parent" && u.familyId === familyId);
}

export async function listFamilyStaff(familyId: string): Promise<User[]> {
  const db = await getDb();
  const staffIds = db.familyStaffAssignments.filter((a) => a.familyId === familyId).map((a) => a.staffId);
  return db.users.filter((u) => staffIds.includes(u.id));
}
export async function isStaffAssigned(familyId: string, staffId: string): Promise<boolean> {
  return (await getDb()).familyStaffAssignments.some((a) => a.familyId === familyId && a.staffId === staffId);
}
export async function assignStaff(familyId: string, staffId: string): Promise<void> {
  if (await isStaffAssigned(familyId, staffId)) return;
  await saveDb((db) => db.familyStaffAssignments.push({ id: id("fsa"), familyId, staffId, assignedAt: nowIso() }));
}
export async function unassignStaff(familyId: string, staffId: string): Promise<void> {
  await saveDb((db) => {
    db.familyStaffAssignments = db.familyStaffAssignments.filter((a) => !(a.familyId === familyId && a.staffId === staffId));
  });
}
