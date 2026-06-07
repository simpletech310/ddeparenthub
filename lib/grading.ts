import type { Question } from "@/lib/types";

// Auto-grading for tests and lesson checks.
// Returns the earned score over the maximum scored points.

export interface SubmittedAnswer {
  questionId: string;
  // choice/true_false/multi_select/image_choice: number[]
  // ordering: number[] (the items' original indices in the order the user placed them)
  // matching: number[] (answer[i] = index into rightOptions chosen for options[i])
  // short_text: string; likert: number[]
  value: number[] | string;
}

export function gradeAssessment(
  questions: Question[],
  answers: SubmittedAnswer[]
): { score: number; maxScore: number } {
  const byId = new Map(answers.map((a) => [a.questionId, a.value]));
  let score = 0;
  let maxScore = 0;

  for (const q of questions) {
    if (!q.scored) continue;
    maxScore += 1;
    const value = byId.get(q.id);
    if (value === undefined) continue;

    switch (q.type) {
      case "short_text": {
        const text = String(value).trim().toLowerCase();
        const keywords = (q.answerKey as string[] | null) ?? [];
        if (keywords.some((k) => text.includes(String(k).toLowerCase()))) score += 1;
        break;
      }
      case "multi_select": {
        const picked = [...((value as number[]) ?? [])].sort();
        const key = [...((q.answerKey as number[]) ?? [])].sort();
        if (picked.length === key.length && picked.every((v, i) => v === key[i])) score += 1;
        break;
      }
      case "ordering": {
        // Correct iff the submitted order exactly equals the answer-key order.
        const picked = (value as number[]) ?? [];
        const key = (q.answerKey as number[]) ?? [];
        if (picked.length === key.length && picked.every((v, i) => v === key[i])) score += 1;
        break;
      }
      case "matching": {
        // Correct iff every left term is paired with the right index in the key.
        const picked = (value as number[]) ?? [];
        const key = (q.answerKey as number[]) ?? [];
        if (picked.length === key.length && picked.every((v, i) => v === key[i])) score += 1;
        break;
      }
      default: {
        // multiple_choice / true_false / image_choice: single correct index
        const picked = Array.isArray(value) ? value[0] : Number(value);
        const key = (q.answerKey as number[] | null) ?? [];
        if (key.includes(picked)) score += 1;
      }
    }
  }
  return { score, maxScore };
}
