import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { listAccessibleDocuments } from "@/lib/data/repos";

// Family-scoped documents endpoint — the v2 pen-test (§7 access model):
//  parents -> their family's docs; assigned staff + admin -> their families' docs;
//  UNASSIGNED staff -> ZERO rows. Enforced by listAccessibleDocuments + access.ts.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const documents = await listAccessibleDocuments(user);
  return NextResponse.json({
    authenticatedAs: { id: user.id, role: user.role },
    count: documents.length,
    documents,
  });
}
