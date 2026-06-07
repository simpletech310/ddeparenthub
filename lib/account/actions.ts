"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { updateUserProfile } from "@/lib/data/repos";

// Update the signed-in user's photo (any role). Called by AvatarUpload on pick.
export async function updateMyAvatarAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const avatarUrl = String(formData.get("avatarUrl") ?? "").trim();
  if (!avatarUrl.startsWith("data:image/")) return;
  await updateUserProfile(user.id, { avatarUrl });
  revalidatePath("/", "layout");
}

// Update the signed-in user's name / title / language (any role).
export async function updateMyProfileAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const lang = String(formData.get("preferredLanguage") ?? "");
  await updateUserProfile(user.id, {
    name: name || user.name,
    ...(user.role === "staff" ? { title } : {}),
    ...(lang === "en" || lang === "es" ? { preferredLanguage: lang } : {}),
  });
  revalidatePath("/", "layout");
}
