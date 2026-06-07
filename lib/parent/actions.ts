"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clearSessionCookie, requireRole } from "@/lib/auth/session";
import {
  addChild,
  addManualGoal,
  createDocument,
  deleteChild,
  deleteDocument,
  deleteFamilyData,
  deleteGoal,
  logGoalProgress,
  reprocessDocument,
  setUserLanguage,
  updateChildProfile,
} from "@/lib/data/repos";
import {
  acceptFamilyConsent,
  getFamily,
  updateFamilySettings,
} from "@/lib/data/families";
import type { DocType, GoalProgress } from "@/lib/types";

function tags(raw: FormDataEntryValue | null): string[] {
  return String(raw ?? "")
    .split(",")
    .map((t) => t.trim().toLowerCase().replace(/\s+/g, "_"))
    .filter(Boolean);
}

export async function addChildAction(formData: FormData): Promise<void> {
  const user = await requireRole("parent");
  if (!user.familyId) return;
  const name = String(formData.get("displayName") ?? "").trim();
  const dob = String(formData.get("dob") ?? "").trim() || undefined;
  if (name) await addChild(user, user.familyId, { displayName: name, dob });
  revalidatePath("/parent/children");
  revalidatePath("/parent");
}

export async function updateChildProfileAction(formData: FormData): Promise<void> {
  const user = await requireRole("parent");
  const childId = String(formData.get("childId") ?? "");
  await updateChildProfile(user, childId, {
    displayName: String(formData.get("displayName") ?? "").trim() || undefined,
    dob: String(formData.get("dob") ?? "").trim() || undefined,
    interestTags: tags(formData.get("interestTags")),
    needTags: tags(formData.get("needTags")),
    temperament: String(formData.get("temperament") ?? "").trim(),
    strengths: String(formData.get("strengths") ?? "").trim(),
    notes: String(formData.get("notes") ?? "").trim(),
  });
  revalidatePath(`/parent/children/${childId}`);
  revalidatePath("/parent/resources");
}

export async function deleteChildAction(formData: FormData): Promise<void> {
  const user = await requireRole("parent");
  await deleteChild(user, String(formData.get("childId") ?? ""));
  revalidatePath("/parent/children");
  revalidatePath("/parent/track");
}

export async function updateChildAvatarAction(formData: FormData): Promise<void> {
  const user = await requireRole("parent");
  const childId = String(formData.get("childId") ?? "");
  const avatarUrl = String(formData.get("avatarUrl") ?? "").trim();
  if (!avatarUrl.startsWith("data:image/")) return;
  await updateChildProfile(user, childId, { avatarUrl });
  revalidatePath(`/parent/children/${childId}`);
  revalidatePath("/parent/children");
  revalidatePath("/parent");
}

export async function uploadDocumentAction(formData: FormData): Promise<void> {
  const user = await requireRole("parent");
  if (!user.familyId) return;
  const family = await getFamily(user.familyId);
  if (family && !family.consentAcceptedAt) {
    if (String(formData.get("consent") ?? "") !== "on") {
      throw new Error("Consent is required before uploading.");
    }
    await acceptFamilyConsent(user.familyId);
  }
  const childId = String(formData.get("childId") ?? "");
  const docType = String(formData.get("docType") ?? "iep") as DocType;
  const fileName = String(formData.get("fileName") ?? "").trim() || `${docType}-upload.pdf`;
  const doc = await createDocument(user, childId, docType, fileName);
  revalidatePath("/parent/understand");
  revalidatePath("/parent/track");
  redirect(`/parent/understand/${doc.id}`);
}

export async function reanalyzeDocumentAction(formData: FormData): Promise<void> {
  const user = await requireRole("parent");
  const documentId = String(formData.get("documentId") ?? "");
  const { changed } = await reprocessDocument(user, documentId);
  revalidatePath(`/parent/understand/${documentId}`);
  redirect(`/parent/understand/${documentId}?reanalyzed=${changed ? "changed" : "same"}`);
}

export async function deleteDocumentAction(formData: FormData): Promise<void> {
  const user = await requireRole("parent");
  await deleteDocument(user, String(formData.get("documentId") ?? ""));
  revalidatePath("/parent/understand");
  revalidatePath("/parent/track");
  redirect("/parent/understand");
}

const MEDIA_CAP_BYTES = 5 * 1024 * 1024;

async function readMedia(formData: FormData): Promise<{ url: string; type: "image" | "video" } | undefined> {
  const file = formData.get("media");
  if (file && typeof file === "object" && "arrayBuffer" in file && (file as File).size > 0) {
    const f = file as File;
    const isVideo = f.type.startsWith("video/");
    const isImage = f.type.startsWith("image/");
    if ((isImage || isVideo) && f.size <= MEDIA_CAP_BYTES) {
      const buf = Buffer.from(await f.arrayBuffer());
      return { url: `data:${f.type};base64,${buf.toString("base64")}`, type: isVideo ? "video" : "image" };
    }
  }
  const url = String(formData.get("mediaUrl") ?? "").trim();
  if (url) {
    const type = /\.(mp4|webm|mov)$/i.test(url) ? "video" : "image";
    return { url, type };
  }
  return undefined;
}

export async function logProgressAction(formData: FormData): Promise<void> {
  const user = await requireRole("parent");
  const goalId = String(formData.get("goalId") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  const rating = Number(formData.get("rating") ?? 3) as GoalProgress["simpleRating"];
  const media = await readMedia(formData);
  await logGoalProgress(user, goalId, note, rating, media);
  revalidatePath("/parent/track");
  revalidatePath(`/parent/track/${goalId}`);
}

export async function addGoalAction(formData: FormData): Promise<void> {
  const user = await requireRole("parent");
  const childId = String(formData.get("childId") ?? "");
  const target = String(formData.get("target") ?? "").trim();
  if (!target) return;
  await addManualGoal(user, childId, {
    domain: String(formData.get("domain") ?? "").trim() || "Custom",
    target,
    baseline: String(formData.get("baseline") ?? "").trim() || undefined,
    measure: String(formData.get("measure") ?? "").trim() || undefined,
  });
  revalidatePath(`/parent/track/child/${childId}`);
  revalidatePath("/parent/track");
}

export async function deleteGoalAction(formData: FormData): Promise<void> {
  const user = await requireRole("parent");
  const goalId = String(formData.get("goalId") ?? "");
  const childId = String(formData.get("childId") ?? "");
  await deleteGoal(user, goalId);
  revalidatePath(`/parent/track/child/${childId}`);
  revalidatePath("/parent/track");
  redirect(`/parent/track/child/${childId}`);
}

export async function updateSettingsAction(formData: FormData): Promise<void> {
  const user = await requireRole("parent");
  const preferredLanguage = String(formData.get("preferredLanguage") ?? "en") as "en" | "es";
  await setUserLanguage(user.id, preferredLanguage);
  if (user.familyId) {
    const raw = String(formData.get("retentionMonths") ?? "");
    await updateFamilySettings(user.familyId, { retentionMonths: raw === "" ? null : Number(raw) });
  }
  revalidatePath("/parent/settings");
}

export async function deleteFamilyDataAction(): Promise<void> {
  const user = await requireRole("parent");
  if (user.familyId) await deleteFamilyData(user, user.familyId);
  clearSessionCookie();
  redirect("/login");
}
