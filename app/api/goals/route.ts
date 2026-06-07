import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { listAccessibleGoals } from "@/lib/data/repos";

// Family-scoped extracted-goals endpoint (parallels /api/documents for the §7 pen-test).
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const goals = await listAccessibleGoals(user);
  return NextResponse.json({
    authenticatedAs: { id: user.id, role: user.role },
    count: goals.length,
    goals,
  });
}
