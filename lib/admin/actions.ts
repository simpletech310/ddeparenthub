"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { createUser, getUser, setUserFamily, setUserStatus, updateUserProfile } from "@/lib/data/repos";
import { id } from "@/lib/data/store";
import { createSignedUploadUrl } from "@/lib/supabase/storage";
import {
  assignStaff,
  createFamily,
  unassignStaff,
  updateFamilySettings,
} from "@/lib/data/families";
import {
  createPartner,
  getPartner,
  setPartnerStatus,
  updatePartner,
} from "@/lib/data/partners";
import type { PartnerSocial } from "@/lib/types";

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

// Edit an existing user's basics (name, email, staff title) and, for parents, family assignment.
export async function updateUserAction(formData: FormData): Promise<void> {
  await requireRole("admin");
  const userId = String(formData.get("userId") ?? "");
  const target = await getUser(userId);
  if (!target) return;
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  await updateUserProfile(userId, {
    name: name || target.name,
    email: email || target.email,
    title: target.role === "staff" ? title : target.title,
  });
  if (target.role === "parent") {
    const rawFamily = String(formData.get("familyId") ?? "");
    await setUserFamily(userId, rawFamily || null);
  }
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/admin/families");
  redirect("/admin/users");
}

// ---- Partner directory ----
// Note: imageUrl is intentionally NOT read here — the photo is set via the dedicated
// upload action so saving the rest of the form never wipes an uploaded image.
function socialFields(formData: FormData): PartnerSocial {
  const get = (k: string) => String(formData.get(k) ?? "").trim() || undefined;
  return {
    instagram: get("social_instagram"),
    facebook: get("social_facebook"),
    youtube: get("social_youtube"),
    tiktok: get("social_tiktok"),
    linkedin: get("social_linkedin"),
    x: get("social_x"),
  };
}
function partnerFields(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    category: String(formData.get("category") ?? "").trim(),
    tagline: String(formData.get("tagline") ?? "").trim(),
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
    social: socialFields(formData),
  };
}
export async function createPartnerAction(formData: FormData): Promise<void> {
  await requireRole("admin");
  const f = partnerFields(formData);
  if (!f.name) {
    revalidatePath("/admin/partners");
    return;
  }
  const partner = await createPartner(f);
  revalidatePath("/admin/partners");
  // Land on the edit page so the admin can add a photo and finish details.
  redirect(`/admin/partners/${partner.id}`);
}
export async function updatePartnerAction(formData: FormData): Promise<void> {
  await requireRole("admin");
  const partnerId = String(formData.get("partnerId") ?? "");
  await updatePartner(partnerId, partnerFields(formData));
  revalidatePath("/admin/partners");
  revalidatePath(`/admin/partners/${partnerId}`);
  revalidatePath("/parent/resources");
  redirect("/admin/partners");
}
export async function archivePartnerAction(formData: FormData): Promise<void> {
  await requireRole("admin");
  const partnerId = String(formData.get("partnerId") ?? "");
  const target = String(formData.get("status") ?? "archived") as "active" | "archived";
  await setPartnerStatus(partnerId, target);
  revalidatePath("/admin/partners");
}

// ---- Partner image upload (signed direct-to-storage; same pattern as course media) ----
const ALLOWED_PARTNER_IMG: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};
export async function createPartnerUploadUrlAction(input: {
  partnerId: string;
  contentType: string;
}): Promise<{ ok: true; uploadUrl: string; path: string } | { ok: false; error: string }> {
  await requireRole("admin");
  const partner = await getPartner(input.partnerId);
  if (!partner) return { ok: false, error: "Partner not found." };
  const ext = ALLOWED_PARTNER_IMG[input.contentType];
  if (!ext) return { ok: false, error: "Use a JPG, PNG, WebP or GIF image." };
  const path = `media/partners/${input.partnerId}/${id("p")}.${ext}`;
  try {
    const uploadUrl = await createSignedUploadUrl(path);
    return { ok: true, uploadUrl, path };
  } catch {
    return { ok: false, error: "Couldn't start the upload. Please try again." };
  }
}
export async function setPartnerImageAction(input: { partnerId: string; path: string }): Promise<void> {
  await requireRole("admin");
  if (!input.path.startsWith(`media/partners/${input.partnerId}/`)) return;
  await updatePartner(input.partnerId, { imageUrl: `/api/media/${input.path}` });
  revalidatePath(`/admin/partners/${input.partnerId}`);
  revalidatePath("/admin/partners");
  revalidatePath("/parent/resources");
}

// ---- Family management ----
export async function createFamilyAction(formData: FormData): Promise<void> {
  await requireRole("admin");
  const name = String(formData.get("name") ?? "").trim();
  if (name) await createFamily(name);
  revalidatePath("/admin/families");
}
export async function renameFamilyAction(formData: FormData): Promise<void> {
  await requireRole("admin");
  const familyId = String(formData.get("familyId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (familyId && name) await updateFamilySettings(familyId, { name });
  revalidatePath("/admin/families");
  revalidatePath(`/admin/families/${familyId}`);
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
