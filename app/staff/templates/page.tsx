import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { getUser, listTemplates } from "@/lib/data/repos";
import { cloneTemplateAction } from "@/lib/staff/actions";
import { EmptyState } from "@/components/EmptyState";

export default async function TemplateLibrary() {
  await requireRole("staff");
  const templatesRaw = await listTemplates();
  const templates = await Promise.all(
    templatesRaw.map(async (t) => ({ t, ownerName: (await getUser(t.ownerStaffId))?.name ?? "DDE staff" }))
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-brand-900">Template library</h1>
        <p className="text-sm text-ink-600">
          Shared, reusable courses any staff member can clone or launch. Teacher instructions are
          shown so you understand the intent even if you didn't author it.
        </p>
      </div>

      <ul className="space-y-3">
        {templates.map(({ t, ownerName }) => (
          <li key={t.id} className="card">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-brand-900">{t.title}</p>
                <p className="text-xs text-ink-500">
                  by {ownerName} · {t.category}
                </p>
              </div>
              <span className="pill bg-brand-100 text-brand-700">Template</span>
            </div>
            <p className="mt-1 text-sm text-ink-600">{t.description}</p>
            <p className="mt-2 rounded-lg bg-brand-50 p-2 text-xs italic text-ink-600">
              Teacher note: {t.teacherInstructions}
            </p>
            <div className="mt-3 flex gap-2">
              <Link href={`/staff/courses/${t.id}`} className="btn-ghost">
                Preview
              </Link>
              <form action={cloneTemplateAction}>
                <input type="hidden" name="courseId" value={t.id} />
                <button className="btn-primary" type="submit">
                  Clone to edit
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>
      {!templates.length && (
        <EmptyState
          icon="doc"
          title="No templates published yet"
          hint="When you publish a course to the template library, it'll appear here for any staff member to clone."
          cta={{ href: "/staff/courses/new", label: "Create a course" }}
        />
      )}
    </div>
  );
}
