import { requireRole } from "@/lib/auth/session";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("parent");

  // Robustness: a parent account that an admin created but hasn't linked to a family yet
  // can't use the clinical features. Show a friendly notice instead of crashing.
  if (!user.familyId) {
    return (
      <div className="min-h-screen">
        <AppHeader name={user.name} roleLabel="Parent" homeHref="/parent" />
        <div className="mx-auto max-w-md px-4 py-16 text-center">
          <div className="card">
            <h1 className="text-lg font-bold text-brand-900">Welcome to DDE Parent Hub</h1>
            <p className="mt-2 text-sm text-ink-600">
              Your account isn't linked to a family yet. A DDE administrator will connect you to your
              family so you can see your child's plan, classes, and progress.
            </p>
            <p className="mt-3 text-xs text-ink-500">
              Already expecting access? Please reach out to your DDE contact.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28">
      <AppHeader name={user.name} roleLabel="Parent" homeHref="/parent" />
      <div className="mx-auto max-w-3xl animate-fade-up px-4 py-6">{children}</div>
      <BottomNav />
    </div>
  );
}
