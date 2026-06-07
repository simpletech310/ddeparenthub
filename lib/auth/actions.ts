"use server";

import { redirect } from "next/navigation";
import { findUserByEmail, listUsers } from "@/lib/data/repos";
import {
  clearSessionCookie,
  homePathFor,
  setSessionCookie,
} from "@/lib/auth/session";
import type { Role } from "@/lib/types";

export async function login(_prev: unknown, formData: FormData): Promise<{ error?: string }> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const user = await findUserByEmail(email);
  if (!user || user.password !== password) {
    return { error: "Invalid email or password." };
  }
  if (user.status !== "active") {
    return { error: "This account is deactivated." };
  }
  setSessionCookie(user.id);
  redirect(homePathFor(user.role));
}

export async function quickLogin(role: Role): Promise<void> {
  const user = (await listUsers()).find((u) => u.role === role && u.status === "active");
  if (!user) return;
  setSessionCookie(user.id);
  redirect(homePathFor(role));
}

export async function logout(): Promise<void> {
  clearSessionCookie();
  redirect("/login");
}
