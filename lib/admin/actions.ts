"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createUser, getUser, setUserFamily, setUserStatus } from "@/lib/data/repos";
import {
  assignStaff,
  createFamily,
  unassignStaff,
} from "@/lib/data/families";
import {
  createPartner,
  setPartnerStatus,
  updatePartner,
} from "@/lib/data/partners";

function tags(raw: FormDataEntryValue | null): string[] {
  return String(raw ?? "")
    .split(",")
    .map((t) => t.trim().toLowerCase().replace(/\s+/g, "_"))
    .filter(Boolean);
}
function lines(raw: FormDataEntryValue | null): string[] {
  return String(raw ?? "")
    .split("\n")
    .map((t) => t.trim())
    .filter(Boolean);
}
// Comma list that PRESERVES case/spacing (for human-readable values like insurance names).
function commaList(raw: FormDataEntryValue | null): string[] {
  return String(raw ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export async function toggleUserStatusAction(formData: FormData): Promise<void> {
  await requireRole("admin");
  const userId = String(formData.get("userId") ?? "");
  const target = await getUser(userId);
  if (!target) return;
  await setUserStatus(userId, target.status === "active" ? "deactivated" : "active");
  revalidatePath("/admin/users");
}

// ---- Partner directory ----
function partnerFields(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    category: String(formData.get("category") ?? "").trim(),
    tagline: String(formData.get("tagline") ?? "").trim(),
    imageUrl: String(formData.get("imageUrl") ?? "").trim() || undefined,
    description: String(formData.get("description") ?? "").trim(),
    howTheyHelp: String(formData.get("howTheyHelp") ?? "").trim(),
    services: lines(formData.get("services")),
    insuranceAccepted: commaList(formData.get("insuranceAccepted")),
    interestTags: tags(formData.get("interestTags")),
    needTags: tags(formData.get("needTags")),
    contactName: String(formData.get("contactName") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    website: String(formData.get("website") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim(),
  };
}
export async function createPartnerAction(formData: FormData): Promise<void> {
  await requireRole("admin");
  const f = partnerFields(formData);
  if (f.name) await createPartner(f);
  revalidatePath("/admin/partners");
}
export async function updatePartnerAction(formData: FormData): Promise<void> {
  await requireRole("admin");
  const partnerId = String(formData.get("partnerId") ?? "");
  await updatePartner(partnerId, partnerFields(formData));
  revalidatePath("/admin/partners");
  revalidatePath(`/admin/partners/${partnerId}`);
}
export async function archivePartnerAction(formData: FormData): Promise<void> {
  await requireRole("admin");
  const partnerId = String(formData.get("partnerId") ?? "");
  const target = String(formData.get("status") ?? "archived") as "active" | "archived";
  await setPartnerStatus(partnerId, target);
  revalidatePath("/admin/partners");
}

// ---- Family management ----
export async function createFamilyAction(formData: FormData): Promise<void> {
  await requireRole("admin");
  const name = String(formData.get("name") ?? "").trim();
  if (name) await createFamily(name);
  revalidatePath("/admin/families");
}
export async function assignStaffAction(formData: FormData): Promise<void> {
  await requireRole("admin");
  await assignStaff(String(formData.get("familyId") ?? ""), String(formData.get("staffId") ?? ""));
  revalidatePath(`/admin/families/${String(formData.get("familyId") ?? "")}`);
}
export async function unassignStaffAction(formData: FormData): Promise<void> {
  await requireRole("admin");
  await unassignStaff(String(formData.get("familyId") ?? ""), String(formData.get("staffId") ?? ""));
  revalidatePath(`/admin/families/${String(formData.get("familyId") ?? "")}`);
}
export async function addParentToFamilyAction(formData: FormData): Promise<void> {
  await requireRole("admin");
  const familyId = String(formData.get("familyId") ?? "");
  const parentId = String(formData.get("parentId") ?? "");
  await setUserFamily(parentId, familyId);
  revalidatePath(`/admin/families/${familyId}`);
}
export async function createUserAction(formData: FormData): Promise<void> {
  await requireRole("admin");
  const role = String(formData.get("role") ?? "parent") as "staff" | "parent";
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim() || undefined;
  const familyId = String(formData.get("familyId") ?? "") || null;
  if (name && email) await createUser({ role, name, email, title, familyId });
  revalidatePath("/admin/users");
  revalidatePath("/admin/families");
}
