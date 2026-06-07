import type {
  Assessment,
  ContentBlock,
  Course,
  Lesson,
  Question,
} from "@/lib/types";
import { id } from "@/lib/data/store";
// Real build: send COURSE_BUILDER_SYSTEM + MODEL_SETTINGS (temperature 0) to Claude and
// validate the JSON against the course schema before persisting. See lib/ai/config.ts.
import { COURSE_BUILDER_SYSTEM, MODEL_SETTINGS } from "./config";

// Course builder (PRD §8.1).
//
// Real build: prompt Claude (BCBA persona in COURSE_BUILDER_SYSTEM, temperature 0) to
// return the SAME editable course/lesson/test objects staff build by hand, as strict JSON.
// Always a DRAFT — never auto-published.
//
// Local MVP: a DETERMINISTIC generator that produces genuine, ready-to-teach ABA content
// (no "lorem"/placeholder text). Same input -> same complete course every time, so staff
// can reliably generate a real course and then edit it. Prompt + settings are referenced so
// the swap to a live call is a drop-in.
export const BUILDER_PROMPT = COURSE_BUILDER_SYSTEM;
export const BUILDER_SETTINGS = MODEL_SETTINGS;

export interface CourseBuilderInput {
  title: string;
  description: string;
  outcomes: string;
  audience: string;
  lessonCount: number;
}

export interface GeneratedCourse {
  course: Course;
  lessons: Lesson[];
  contentBlocks: ContentBlock[];
  assessments: Assessment[];
  questions: Question[];
}

// A real ABA parent-education arc. Each entry is genuine, teachable content.
const LESSON_LIBRARY: {
  title: string;
  body: (skill: string, audience: string) => string;
  check: (skill: string) => Omit<Question, "id" | "assessmentId">[];
}[] = [
  {
    title: "Understanding the Skill",
    body: (skill) =>
      `<p>Before we teach <strong>${skill}</strong>, it helps to picture what success looks like and why it matters for your child's day. In ABA we start by <em>noticing</em>: when does your child already show a piece of this skill, even a small one?</p>` +
      `<p>Think about the moments at home where ${skill.toLowerCase()} naturally comes up — meals, play, getting ready. Those everyday moments are your best teaching opportunities because your child is motivated and the skill is useful right away.</p>`,
    check: () => [
      {
        orderIndex: 0, type: "multiple_choice",
        prompt: "In ABA, a good first step before teaching a skill is to…",
        options: ["Notice when your child already shows a piece of it", "Wait until they can do all of it", "Only practice during therapy"],
        answerKey: [0], scored: true,
      },
    ],
  },
  {
    title: "Breaking It into Steps",
    body: (skill) =>
      `<p>Big skills feel overwhelming. A <strong>task analysis</strong> breaks <strong>${skill}</strong> into small, teachable steps so your child can succeed at one piece at a time.</p>` +
      `<p>Write the steps in order, from the very first tiny action to the finished skill. Teach one step until it's easy, then add the next. Small wins build momentum and confidence.</p>`,
    check: () => [
      {
        orderIndex: 0, type: "true_false",
        prompt: "Breaking a skill into small steps makes it easier to teach.",
        options: ["True", "False"], answerKey: [0], scored: true,
      },
    ],
  },
  {
    title: "Prompting and Reinforcement",
    body: (skill) =>
      `<p>A <strong>prompt</strong> is a little help — a gesture, a model, or hand-over-hand guidance — that helps your child do the next step of <strong>${skill}</strong>. A <strong>reinforcer</strong> is anything your child loves that you give right after they try.</p>` +
      `<p>Give the prompt, let your child do the step, then reinforce <em>immediately</em>. Over time, <strong>fade</strong> the prompt (less help) so your child does more on their own. Catch them being successful.</p>`,
    check: () => [
      {
        orderIndex: 0, type: "multiple_choice",
        prompt: "A reinforcer works best when it is given…",
        options: ["Right after your child tries", "The next day", "Only if it was perfect"],
        answerKey: [0], scored: true,
      },
      {
        orderIndex: 1, type: "ordering",
        prompt: "Put the teaching steps in order (first to last).",
        options: ["Break the skill into steps", "Prompt the next step", "Reinforce the try", "Fade the prompt"],
        answerKey: [0, 1, 2, 3], scored: true,
      },
    ],
  },
  {
    title: "Practicing in Daily Routines",
    body: (skill) =>
      `<p>Short, frequent practice beats long sessions. Fold <strong>${skill}</strong> into routines you already do every day so practice is natural and low-stress.</p>` +
      `<p>Pick two daily moments to practice this week. Keep each try brief and upbeat, end on a success, and follow your child's interests to keep motivation high.</p>`,
    check: () => [
      {
        orderIndex: 0, type: "true_false",
        prompt: "Short, frequent practice in daily routines usually works better than rare long sessions.",
        options: ["True", "False"], answerKey: [0], scored: true,
      },
    ],
  },
  {
    title: "Noticing and Tracking Progress",
    body: (skill) =>
      `<p>Data doesn't have to be fancy. Jot a quick note after practice: how much help did your child need with <strong>${skill}</strong>, and how did it go? A one-line note is plenty.</p>` +
      `<p>Tracking helps you see what's working and share real progress with your child's team. In the Hub you can log these notes — even add a photo or short video — right against the goal.</p>`,
    check: () => [
      {
        orderIndex: 0, type: "multiple_choice",
        prompt: "A simple way to track progress at home is to…",
        options: ["Jot a quick note on how much help was needed", "Only rely on the school's data", "Not track until the year ends"],
        answerKey: [0], scored: true,
      },
    ],
  },
  {
    title: "Keeping It Going",
    body: (skill) =>
      `<p>Once your child can do <strong>${skill}</strong> with you, help it <strong>generalize</strong>: practice with different people, places, and materials so the skill works everywhere, not just one spot.</p>` +
      `<p>Keep reinforcing occasionally so the skill sticks, and celebrate independence. You've got this — small, steady practice adds up.</p>`,
    check: () => [
      {
        orderIndex: 0, type: "true_false",
        prompt: "Practicing with different people and places helps a skill 'generalize'.",
        options: ["True", "False"], answerKey: [0], scored: true,
      },
    ],
  },
];

function blueprintQuestions(kind: "pretest" | "posttest", skill: string): Omit<Question, "id" | "assessmentId">[] {
  // Pre and post share a blueprint (same constructs) so the delta is meaningful.
  const confidencePrompt =
    kind === "pretest"
      ? `Before this course: how confident are you supporting "${skill}" at home?`
      : `After this course: how confident are you supporting "${skill}" at home?`;
  return [
    {
      orderIndex: 0, type: "likert", prompt: confidencePrompt,
      options: ["Not yet", "Somewhat", "Confident"], answerKey: null, scored: false,
    },
    {
      orderIndex: 1, type: "true_false",
      prompt: "Breaking a skill into small steps makes it easier to teach.",
      options: ["True", "False"], answerKey: [0], scored: true,
    },
    {
      orderIndex: 2, type: "multiple_choice",
      prompt: "A reinforcer is most effective when given…",
      options: ["Immediately after the attempt", "A day later", "Only for perfect tries"],
      answerKey: [0], scored: true,
    },
  ];
}

export function generateCourse(input: CourseBuilderInput, ownerStaffId: string): GeneratedCourse {
  const courseId = id("course");
  const lessonCount = Math.max(1, Math.min(6, input.lessonCount || 4));
  const skill = (input.title || "this skill").replace(/\s*course\s*$/i, "").trim() || "this skill";
  const audience = input.audience || "parents";

  const course: Course = {
    id: courseId,
    ownerStaffId,
    title: input.title || "Untitled Course",
    description:
      input.description ||
      `An ABA-informed parent class on ${skill.toLowerCase()}, with concrete steps to practice at home.`,
    outcomes:
      input.outcomes ||
      `By the end, ${audience} can break ${skill.toLowerCase()} into small steps, prompt and reinforce it at home, and notice progress.`,
    teacherInstructions:
      "AI-generated draft — review and tailor the examples to each family. Keep it concrete and home-based; reassure parents that short, consistent practice works best.",
    isTemplate: false,
    category: "Generated",
    status: "draft",
    estimatedDuration: `~${lessonCount * 12} min`,
    tags: ["aba", "reinforcement"],
  };

  const lessons: Lesson[] = [];
  const contentBlocks: ContentBlock[] = [];
  const assessments: Assessment[] = [];
  const questions: Question[] = [];

  // Pre-test
  const preId = id("asmt");
  assessments.push({ id: preId, courseId, kind: "pretest", lessonId: null, title: "Pre-test" });
  blueprintQuestions("pretest", skill).forEach((q) => questions.push({ ...q, id: id("q"), assessmentId: preId }));

  for (let i = 0; i < lessonCount; i++) {
    const tpl = LESSON_LIBRARY[i] ?? LESSON_LIBRARY[LESSON_LIBRARY.length - 1];
    const lessonId = id("lesson");
    lessons.push({
      id: lessonId, courseId, orderIndex: i,
      title: `Lesson ${i + 1}: ${tpl.title}`,
      teacherInstructions: "Tailor the examples to the family's routines and your child's interests.",
    });
    contentBlocks.push({
      id: id("cb"), lessonId, orderIndex: 0, type: "rich_text",
      payload: { html: tpl.body(skill, audience) },
    });
    const lcId = id("asmt");
    assessments.push({ id: lcId, courseId, kind: "lesson_check", lessonId, title: `Lesson ${i + 1} Check` });
    tpl.check(skill).forEach((q) => questions.push({ ...q, id: id("q"), assessmentId: lcId }));
  }

  // Post-test (shares blueprint with pre-test)
  const postId = id("asmt");
  assessments.push({ id: postId, courseId, kind: "posttest", lessonId: null, title: "Post-test" });
  blueprintQuestions("posttest", skill).forEach((q) => questions.push({ ...q, id: id("q"), assessmentId: postId }));

  return { course, lessons, contentBlocks, assessments, questions };
}
