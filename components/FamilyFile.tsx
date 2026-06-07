import { BreakdownView } from "@/app/parent/understand/[documentId]/BreakdownView";
import { getFamily, listFamilyParents, listFamilyStaff } from "@/lib/data/families";
import {
  getBreakdownByDoc,
  listDocumentsForFamily,
  listFamilyChildren,
  listGoalProgress,
  listGoalsForChild,
} from "@/lib/data/repos";
import { recommendationsForChild } from "@/lib/data/recommendations";
import { familyInsights } from "@/lib/data/insights";
import type { User } from "@/lib/types";

const RATING_LABEL = ["", "Struggling", "Emerging", "Developing", "Progressing", "Mastering"];

// Read-only family file shown to assigned staff and admin. The acting `user` scopes every
// read through the access contract; nothing here is editable (staff are read-only).
export async function FamilyFile({ user, familyId }: { user: User; familyId: string }) {
  const family = await getFamily(familyId);
  const children = await listFamilyChildren(user, familyId);
  const parents = await listFamilyParents(familyId);
  const staff = await listFamilyStaff(familyId);
  const documentsRaw = await listDocumentsForFamily(user, familyId);
  const ins = await familyInsights(user, familyId);
  const trendIcon = ins.trend === "up" ? "↗" : ins.trend === "down" ? "↘" : "→";

  const childBlocks = await Promise.all(
    children.map(async (child) => {
      const goalsRaw = await listGoalsForChild(user, child.id);
      const goals = await Promise.all(
        goalsRaw.map(async (g) => ({ g, entries: await listGoalProgress(user, g.id) }))
      );
      const recs = (await recommendationsForChild(user, child.id)).slice(0, 3);
      return { child, goals, recs };
    })
  );
  const documents = await Promise.all(
    documentsRaw.map(async (d) => ({ d, bd: await getBreakdownByDoc(user, d.id) }))
  );

  if (!family) return <p className="card text-sm text-brand-500">Family not found.</p>;

  return (
    <div className="space-y-6">
      {/* Data-driven snapshot */}
      <section className="card">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand-600">
          At a glance
        </h2>
        <div className="grid grid-cols-4 gap-2 text-center">
          <FfStat value={String(ins.goals)} label="Goals" />
          <FfStat value={String(ins.observations)} label="Home logs" />
          <FfStat value={ins.avgRecentRating === null ? "—" : `${ins.avgRecentRating} ${trendIcon}`} label="Avg rating" />
          <FfStat value={String(ins.recommendations)} label="Matches" />
        </div>
        {ins.goalsNeedingAttention > 0 && (
          <p className="mt-3 rounded-lg bg-accent-50 p-2 text-xs text-accent-700">
            {ins.goalsNeedingAttention} goal{ins.goalsNeedingAttention === 1 ? "" : "s"} have no home
            observations yet — a good prompt for your next check-in with the family.
          </p>
        )}
      </section>

      <section className="card">
        <h2 className="font-semibold text-brand-900">Family team</h2>
        <p className="mt-1 text-sm text-brand-700">
          <span className="font-medium">Parents:</span> {parents.map((p) => p.name).join(", ") || "—"}
        </p>
        <p className="text-sm text-brand-700">
          <span className="font-medium">Assigned staff:</span> {staff.map((s) => s.name).join(", ") || "—"}
        </p>
        <p className="mt-1 text-xs text-brand-400">
          Progress below is shared — every assigned staff member sees the same consistent record.
        </p>
      </section>

      {childBlocks.map(({ child, goals, recs }) => {
        return (
          <section key={child.id} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-brand-900">{child.displayName}</h2>
              {child.dob && <span className="text-xs text-brand-500">DOB {child.dob}</span>}
            </div>

            {(child.interestTags.length > 0 || child.needTags.length > 0) && (
              <div className="flex flex-wrap gap-1">
                {child.interestTags.map((t) => (
                  <span key={t} className="pill bg-brand-100 text-brand-700">{t.replace(/_/g, " ")}</span>
                ))}
                {child.needTags.map((t) => (
                  <span key={t} className="pill bg-accent-100 text-accent-700">{t.replace(/_/g, " ")}</span>
                ))}
              </div>
            )}
            {(child.strengths || child.temperament || child.notes) && (
              <div className="card space-y-1 text-sm text-brand-700">
                {child.strengths && <p><span className="font-medium">Strengths:</span> {child.strengths}</p>}
                {child.temperament && <p><span className="font-medium">Temperament:</span> {child.temperament}</p>}
                {child.notes && <p><span className="font-medium">Notes:</span> {child.notes}</p>}
              </div>
            )}

            {/* Goals + home progress trends */}
            <div>
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand-600">
                Goals & home progress
              </h3>
              {goals.length ? (
                <ul className="space-y-2">
                  {goals.map(({ g, entries }) => {
                    const last = entries[entries.length - 1];
                    return (
                      <li key={g.id} className="card">
                        <div className="flex items-center justify-between gap-2">
                          <span className="pill bg-brand-100 text-brand-700">{g.domain}</span>
                          <span className="text-xs text-brand-500">{entries.length} log{entries.length === 1 ? "" : "s"}</span>
                        </div>
                        <p className="mt-1 text-sm font-medium text-brand-900">{g.target}</p>
                        {entries.length > 0 ? (
                          <>
                            <div className="mt-2 flex h-12 items-end gap-1">
                              {entries.map((e, i) => (
                                <div key={i} className="flex-1 rounded-t bg-brand-400" style={{ height: `${(e.simpleRating / 5) * 100}%` }} title={`${e.simpleRating}/5`} />
                              ))}
                            </div>
                            <p className="mt-1 text-xs text-brand-500">Last noted: {RATING_LABEL[last.simpleRating]}</p>
                          </>
                        ) : (
                          <p className="mt-1 text-xs text-brand-400">No home observations logged yet.</p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="card text-sm text-brand-500">No IEP goals on file for {child.displayName}.</p>
              )}
            </div>

            {/* Recommended supports (deterministic) */}
            {recs.length > 0 && (
              <div>
                <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand-600">
                  Recommended supports
                </h3>
                <ul className="space-y-1.5">
                  {recs.map((r) => (
                    <li key={`${r.kind}_${r.id}`} className="card">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-brand-900">{r.title}</span>
                        <span className={`pill ${r.kind === "partner" ? "bg-accent-100 text-accent-700" : "bg-brand-100 text-brand-700"}`}>
                          {r.kind === "partner" ? "Partner" : "DDE class"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-brand-600">{r.explanation}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        );
      })}

      {/* Documents (read-only breakdowns) */}
      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-brand-600">Documents</h2>
        {documents.length ? (
          <div className="space-y-2">
            {documents.map(({ d, bd }) => {
              return (
                <details key={d.id} className="card">
                  <summary className="cursor-pointer text-sm font-semibold text-brand-900">
                    {d.fileName} <span className="text-xs font-normal uppercase text-brand-400">({d.docType})</span>
                  </summary>
                  <div className="mt-3">
                    {bd ? <BreakdownView payload={bd.payload} docType={d.docType} /> : <p className="text-sm text-brand-500">No breakdown.</p>}
                  </div>
                </details>
              );
            })}
          </div>
        ) : (
          <p className="card text-sm text-brand-500">No documents uploaded by this family yet.</p>
        )}
      </section>
    </div>
  );
}

function FfStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl bg-brand-50 px-2 py-3">
      <p className="text-lg font-bold leading-none text-brand-900">{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-wide text-brand-500">{label}</p>
    </div>
  );
}
