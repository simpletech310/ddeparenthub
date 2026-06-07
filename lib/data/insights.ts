import {
  getClass,
  getGoalById,
  listAttempts,
  listDocumentsForFamily,
  listEnrollmentsByParent,
  listFamilyChildren,
  listGoalProgress,
  listGoalsForChild,
  listGoalsForFamily,
} from "./repos";
import { recommendationsForChild } from "./recommendations";
import { canAccessFamily } from "@/lib/auth/access";
import type { User } from "@/lib/types";

const RATING_LABEL = ["", "Struggling", "Emerging", "Developing", "Progressing", "Mastering"];
function daysAgo(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24);
}

export interface FamilyInsights {
  children: number;
  documents: number;
  goals: number;
  goalsNeedingAttention: number;
  observations: number;
  avgRecentRating: number | null;
  trend: "up" | "flat" | "down" | null;
  recommendations: number;
}

export async function familyInsights(user: User, familyId: string): Promise<FamilyInsights> {
  if (!(await canAccessFamily(user, familyId))) {
    return { children: 0, documents: 0, goals: 0, goalsNeedingAttention: 0, observations: 0, avgRecentRating: null, trend: null, recommendations: 0 };
  }
  const children = await listFamilyChildren(user, familyId);
  const documents = await listDocumentsForFamily(user, familyId);
  const goals = await listGoalsForFamily(user, familyId);

  let observations = 0;
  let needsAttention = 0;
  const latestRatings: number[] = [];
  let mostRecent: { at: string; ratings: number[] } | null = null;

  for (const g of goals) {
    const entries = await listGoalProgress(user, g.id);
    observations += entries.length;
    if (entries.length === 0) { needsAttention += 1; continue; }
    const last = entries[entries.length - 1];
    latestRatings.push(last.simpleRating);
    if (!mostRecent || last.observedAt > mostRecent.at) mostRecent = { at: last.observedAt, ratings: entries.map((e) => e.simpleRating) };
  }

  const avgRecentRating = latestRatings.length ? Math.round((latestRatings.reduce((a, b) => a + b, 0) / latestRatings.length) * 10) / 10 : null;
  let trend: FamilyInsights["trend"] = null;
  if (mostRecent && mostRecent.ratings.length >= 2) {
    const r = mostRecent.ratings;
    const d = r[r.length - 1] - r[0];
    trend = d > 0 ? "up" : d < 0 ? "down" : "flat";
  }

  let recommendations = 0;
  for (const c of children) recommendations += (await recommendationsForChild(user, c.id)).length;

  return {
    children: children.length, documents: documents.length, goals: goals.length,
    goalsNeedingAttention: needsAttention, observations, avgRecentRating, trend, recommendations,
  };
}

export interface ChildInsights {
  goals: number;
  goalsNeedingAttention: number;
  observations: number;
  logsLast7Days: number;
  avgRecentRating: number | null;
  trend: "up" | "flat" | "down" | null;
}

export async function childInsights(user: User, childId: string): Promise<ChildInsights> {
  const goals = await listGoalsForChild(user, childId);
  let observations = 0;
  let logsLast7Days = 0;
  let needsAttention = 0;
  const latestRatings: number[] = [];
  let mostRecent: { at: string; ratings: number[] } | null = null;

  for (const g of goals) {
    const entries = await listGoalProgress(user, g.id);
    observations += entries.length;
    logsLast7Days += entries.filter((e) => daysAgo(e.observedAt) <= 7).length;
    if (!entries.length) { needsAttention += 1; continue; }
    const last = entries[entries.length - 1];
    latestRatings.push(last.simpleRating);
    if (!mostRecent || last.observedAt > mostRecent.at) mostRecent = { at: last.observedAt, ratings: entries.map((e) => e.simpleRating) };
  }

  const avgRecentRating = latestRatings.length ? Math.round((latestRatings.reduce((a, b) => a + b, 0) / latestRatings.length) * 10) / 10 : null;
  let trend: ChildInsights["trend"] = null;
  if (mostRecent && mostRecent.ratings.length >= 2) {
    const r = mostRecent.ratings;
    const d = r[r.length - 1] - r[0];
    trend = d > 0 ? "up" : d < 0 ? "down" : "flat";
  }

  return { goals: goals.length, goalsNeedingAttention: needsAttention, observations, logsLast7Days, avgRecentRating, trend };
}

export interface GoalInsight {
  logs: number;
  logsLast7Days: number;
  trend: "up" | "flat" | "down" | null;
  currentLabel: string | null;
  lastLoggedAt: string | null;
  improvingStreak: number;
  message: string;
}

export async function goalInsight(user: User, goalId: string): Promise<GoalInsight> {
  const goal = await getGoalById(user, goalId);
  const entries = goal ? await listGoalProgress(user, goalId) : [];
  if (!entries.length) {
    return { logs: 0, logsLast7Days: 0, trend: null, currentLabel: null, lastLoggedAt: null, improvingStreak: 0, message: "No observations yet. Log a quick note after your next practice — even one line helps you see what's working." };
  }
  const ratings = entries.map((e) => e.simpleRating);
  const last = entries[entries.length - 1];
  const logsLast7Days = entries.filter((e) => daysAgo(e.observedAt) <= 7).length;
  const delta = ratings[ratings.length - 1] - ratings[0];
  const trend = ratings.length < 2 ? null : delta > 0 ? "up" : delta < 0 ? "down" : "flat";

  let streak = 1;
  for (let i = ratings.length - 1; i > 0; i--) {
    if (ratings[i] >= ratings[i - 1]) streak++;
    else break;
  }

  let message: string;
  if (trend === "up") message = `Nice momentum — trending up over the last ${ratings.length} notes. Keep doing what's working and reward the wins.`;
  else if (trend === "down") message = "This dipped recently. Try shrinking the step (more prompting, easier moment) and celebrate small tries.";
  else if (logsLast7Days === 0) message = "No notes in the last week. A quick observation keeps the picture current for your IEP team.";
  else message = "Holding steady. Consistent practice in everyday routines tends to pay off — keep logging.";

  return { logs: entries.length, logsLast7Days, trend, currentLabel: RATING_LABEL[last.simpleRating], lastLoggedAt: last.observedAt, improvingStreak: streak, message };
}

export interface LearningInsights {
  enrolled: number;
  completed: number;
  latestDelta: number | null;
}

export async function learningInsights(parentId: string): Promise<LearningInsights> {
  const enrollments = await listEnrollmentsByParent(parentId);
  let latestDelta: number | null = null;
  let latestAt = "";

  for (const e of enrollments) {
    const cls = await getClass(e.classId);
    if (!cls) continue;
    const pre = cls.courseSnapshot.assessments.find((a) => a.kind === "pretest");
    const post = cls.courseSnapshot.assessments.find((a) => a.kind === "posttest");
    if (!pre || !post) continue;
    const attempts = await listAttempts(e.id);
    const preA = attempts.find((a) => a.assessmentId === pre.id);
    const postA = attempts.find((a) => a.assessmentId === post.id);
    if (preA && postA && postA.submittedAt > latestAt) { latestAt = postA.submittedAt; latestDelta = postA.score - preA.score; }
  }

  return { enrolled: enrollments.length, completed: enrollments.filter((e) => e.status === "completed").length, latestDelta };
}
