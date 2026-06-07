import { getChildById, listGoalsForChild, listPublishedCourses } from "./repos";
import { listPartners } from "./partners";
import type { Partner, User } from "@/lib/types";

// Deterministic resource recommendations (fully repeatable). Async store.

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
  partner?: Partner;
  courseHref?: string;
}

export async function recommendationsForChild(user: User, childId: string): Promise<Recommendation[]> {
  const child = await getChildById(user, childId);
  if (!child) return [];

  const goals = await listGoalsForChild(user, childId);
  const goalNeeds = goals.flatMap((g) => domainToNeeds(g.domain));
  const needTags = Array.from(new Set([...child.needTags, ...goalNeeds]));
  const interestTags = child.interestTags;

  const recs: Recommendation[] = [];

  for (const p of await listPartners()) {
    const mInt = overlap(p.interestTags, interestTags);
    const mNeed = overlap(p.needTags, needTags);
    const score = mNeed.length * 2 + mInt.length;
    if (score <= 0) continue;
    recs.push({
      kind: "partner", id: p.id, title: p.name, subtitle: p.category, score,
      matchedInterests: mInt, matchedNeeds: mNeed,
      explanation: explain(child.displayName, mInt, mNeed, p.name), partner: p,
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
