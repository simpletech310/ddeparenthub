import { getDb } from "@/lib/data/store";
import type { User } from "@/lib/types";

// =====================================================================
// FAMILY ACCESS CONTRACT — the load-bearing privacy rule.
//   parent -> own family (user.familyId); staff -> assigned families; admin -> all.
// Enforced in every family-scoped repo accessor. (Async because the store is remote.)
// =====================================================================

export function isAdmin(user: User): boolean {
  return user.role === "admin";
}

export async function assignedFamilyIds(staffId: string): Promise<string[]> {
  const db = await getDb();
  return db.familyStaffAssignments.filter((a) => a.staffId === staffId).map((a) => a.familyId);
}

export async function canAccessFamily(user: User, familyId: string): Promise<boolean> {
  if (user.status !== "active") return false;
  switch (user.role) {
    case "admin":
      return true;
    case "staff":
      return (await assignedFamilyIds(user.id)).includes(familyId);
    case "parent":
      return !!user.familyId && user.familyId === familyId;
  }
}

export async function accessibleFamilyIds(user: User): Promise<string[]> {
  if (user.status !== "active") return [];
  switch (user.role) {
    case "admin":
      return (await getDb()).families.map((f) => f.id);
    case "staff":
      return assignedFamilyIds(user.id);
    case "parent":
      return user.familyId ? [user.familyId] : [];
  }
}

// Whether this user may WRITE clinical data for a family. Sync (role-only). Staff are read-only.
export function canWriteFamily(user: User, familyId: string): boolean {
  if (user.status !== "active") return false;
  if (user.role === "admin") return true;
  if (user.role === "parent") return user.familyId === familyId;
  return false;
}
