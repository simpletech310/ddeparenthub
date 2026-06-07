import "server-only";
import crypto from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/data/repos";
import type { Role, User } from "@/lib/types";

// Cookie session for the launch build. The cookie stores "userId.hmac" so it can't be
// forged without SESSION_SECRET. The role is always re-read server-side from the DB
// (never trust a client role). Proper per-user auth (Supabase Auth) is the next step.

const COOKIE = "dde_session";
const SECRET = process.env.SESSION_SECRET || "dev-insecure-secret-change-me";

function sign(userId: string): string {
  return crypto.createHmac("sha256", SECRET).update(userId).digest("hex").slice(0, 32);
}
function makeValue(userId: string): string {
  return `${userId}.${sign(userId)}`;
}
function parseValue(value: string | undefined): string | null {
  if (!value) return null;
  const i = value.lastIndexOf(".");
  if (i === -1) return null;
  const userId = value.slice(0, i);
  const sig = value.slice(i + 1);
  if (!userId || sig !== sign(userId)) return null;
  return userId;
}

export function setSessionCookie(userId: string): void {
  cookies().set(COOKIE, makeValue(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearSessionCookie(): void {
  cookies().delete(COOKIE);
}

export async function getCurrentUser(): Promise<User | null> {
  const userId = parseValue(cookies().get(COOKIE)?.value);
  if (!userId) return null;
  const user = await getUser(userId);
  if (!user || user.status !== "active") return null;
  return user;
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(role: Role): Promise<User> {
  const user = await requireUser();
  if (user.role !== role) redirect(homePathFor(user.role));
  return user;
}

export function homePathFor(role: Role): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "staff":
      return "/staff";
    case "parent":
      return "/parent";
  }
}
