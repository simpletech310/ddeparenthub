import { requireRole } from "@/lib/auth/session";
import { AccountPanel } from "@/components/AccountPanel";
import { PageHeader } from "@/components/PageHeader";

export default async function AdminAccount() {
  const user = await requireRole("admin");
  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Account" title="Your account" subtitle="Your photo, name, and preferences." />
      <AccountPanel user={user} />
    </div>
  );
}
