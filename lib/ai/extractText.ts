import crypto from "crypto";
import type { DocType } from "@/lib/types";

// Text-extraction interface (PRD §5.2 / §11). Real build: extract embedded PDF text and
// fall back to OCR for scanned/image documents. The MVP returns a deterministic
// representative text per document type so the downstream pipeline is fully repeatable
// offline. The shape is identical to the real implementation, so swapping it is a drop-in.

export interface ExtractedText {
  text: string;
  sourceKind: "pdf-text" | "ocr" | "sample";
}

export function extractText(input: { fileName: string; docType: DocType }): ExtractedText {
  // Deterministic sample corpus keyed by docType. Replace with pdf-parse + OCR fallback.
  const text = input.docType === "triennial" ? TRIENNIAL_SAMPLE : IEP_SAMPLE;
  return { text, sourceKind: "sample" };
}

// Stable content hash used by the process-once cache (consistency contract).
export function hashText(text: string): string {
  return crypto.createHash("sha256").update(text).digest("hex").slice(0, 32);
}

const IEP_SAMPLE = `INDIVIDUALIZED EDUCATION PROGRAM
Plan start date: 03/01/2026. Annual review: 03/01/2027. Next eligibility (triennial): 03/01/2029.
GOAL (Communication): By the annual review, the student will request preferred items/activities using a
2-3 word phrase in 4 out of 5 opportunities across 3 consecutive sessions with minimal adult prompting.
Baseline: requests using single sounds with full prompting. Measured by staff data across sessions.
GOAL (Social): The student will take turns during a structured peer activity for 3 exchanges in 3 of 4
opportunities as measured by staff data. Baseline: takes 1 turn with adult support.
SERVICE: Speech-Language Therapy, 2 sessions x 30 minutes per week, individual, resource room.
ACCOMMODATION: Provide visual supports and extra wait time for responses.
PLACEMENT: General education with pull-out services (LRE).`;

const TRIENNIAL_SAMPLE = `TRIENNIAL PSYCHOEDUCATIONAL EVALUATION REPORT
Evaluation date: 02/15/2026. Eligibility meeting: 03/01/2026.
ASSESSMENT (WISC-V): Visual Spatial Index = 105 (63rd percentile); Verbal Comprehension Index = 82
(12th percentile).
ELIGIBILITY: The team determined the student continues to meet eligibility criteria for special
education under the category of Autism.
RECOMMENDATIONS: continue speech-language services; incorporate visual supports; consider social
skills group.`;
