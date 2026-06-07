import { getDb } from "./store";
import { getChildById, listGoalsForChild, listPublishedCourses } from "./repos";
import { listPartners } from "./partners";
import { communicationNeedTags } from "./taxonomy";
import type { Partner, User } from "@/lib/types";

// Deterministic resource recommendations (fully repeatable). Now considers the child's
// interests + supports + IEP goals + communication style, AND the family's stated focus and
// insurance — so matches fit what the family actually wants and can use. Never invents partners.

const DOMAIN_NEEDS: Record<string, string[]> = {
  communication: ["communication"],
  social: ["social", "group_work"],
  behavior: ["behavior", "self_regulation"],
  motor: ["motor", "outdoor_time"],
  academic: ["academic"],
  "self-help": ["self_help"],
  adaptive: ["self_help"],
};

function domainToNeeds(domain: string): string[] {
  const key = domain.trim().toLowerCase();
  return DOMAIN_NEEDS[key] ?? [key];
}
function overlap(a: string[], b: string[]): string[] {
  const set = new Set(b.map((x) => x.toLowerCase()));
  return Array.from(new Set(a.map((x) => x.toLowerCase()))).filter((x) => set.has(x));
}

export interface Recommendation {
  kind: "partner" | "course";
  id: string;
  title: string;
  subtitle: string;
  score: number;
  matchedInterests: string[];
  matchedNeeds: string[];
  explanation: string;
  acceptsInsurance?: boolean;
  partner?: Partner;
  courseHref?: string;
}

export async function recommendationsForChild(user: User, childId: string): Promise<Recommendation[]> {
  const child = await getChildById(user, childId);
  if (!child) return [];

  const db = await getDb();
  const familyParents = db.users.filter((u) => u.role === "parent" && u.familyId === child.familyId);
  const familyInsurance = new Set(familyParents.flatMap((p) => p.insurance ?? []).map((s) => s.toLowerCase()));
  const familyFocus = familyParents.flatMap((p) => p.focus ?? []);

  const goals = await listGoalsForChild(user, childId);
  const goalNeeds = goals.flatMap((g) => domainToNeeds(g.domain));
  const needTags = Array.from(new Set([
    ...child.needTags,
    ...goalNeeds,
    ...communicationNeedTags(child.communicationStyle),
    ...familyFocus,
  ]));
  const interestTags = child.interestTags;

  const recs: Recommendation[] = [];

  for (const p of await listPartners()) {
    const mInt = overlap(p.interestTags, interestTags);
    const mNeed = overlap(p.needTags, needTags);
    const baseScore = mNeed.length * 2 + mInt.length;
    if (baseScore <= 0) continue;
    const acceptsInsurance = familyInsurance.size > 0 && p.insuranceAccepted.some((i) => familyInsurance.has(i.toLowerCase()));
    recs.push({
      kind: "partner", id: p.id, title: p.name, subtitle: p.category,
      score: baseScore + (acceptsInsurance ? 1 : 0),
      matchedInterests: mInt, matchedNeeds: mNeed,
      explanation: explain(child.displayName, mInt, mNeed, p.name),
      acceptsInsurance, partner: p,
    });
  }

  for (const c of await listPublishedCourses()) {
    const mInt = overlap(c.tags, interestTags);
    const mNeed = overlap(c.tags, needTags);
    const score = mNeed.length * 2 + mInt.length;
    if (score <= 0) continue;
    recs.push({
      kind: "course", id: c.id, title: c.title, subtitle: "DDE parent class", score,
      matchedInterests: mInt, matchedNeeds: mNeed,
      explanation: explain(child.displayName, mInt, mNeed, c.title), courseHref: "/parent/learn",
    });
  }

  return recs.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
}

function humanize(tag: string): string {
  return tag.replace(/_/g, " ");
}
function explain(childName: string, interests: string[], needs: string[], name: string): string {
  const parts: string[] = [];
  if (needs.length) parts.push(`is working on ${needs.map(humanize).join(", ")}`);
  if (interests.length) parts.push(`enjoys ${interests.map(humanize).join(", ")}`);
  const because = parts.length ? parts.join(" and ") : "matches this child's plan";
  return `Suggested because ${childName} ${because} — ${name} supports exactly that.`;
}
