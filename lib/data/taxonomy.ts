// Curated, friendly options for the guided child + parent profile builders.
// Tags are canonical (lowercase, underscores) and match partner/course tags so the
// deterministic recommendation engine keeps working.

export interface TagOption {
  tag: string;
  label: string;
}
export interface TagGroup {
  label: string;
  emoji: string;
  options: TagOption[];
}

// "What does your child love?" — grouped so it feels like a warm, surface-level picker.
export const INTEREST_GROUPS: TagGroup[] = [
  {
    label: "Play",
    emoji: "🧸",
    options: [
      { tag: "blocks", label: "Building & blocks" },
      { tag: "puzzles", label: "Puzzles" },
      { tag: "games", label: "Games" },
      { tag: "pretend", label: "Pretend play" },
      { tag: "cars", label: "Cars & trains" },
      { tag: "dolls", label: "Dolls & figures" },
    ],
  },
  {
    label: "Animals & nature",
    emoji: "🐴",
    options: [
      { tag: "animals", label: "Animals" },
      { tag: "horses", label: "Horses" },
      { tag: "dogs", label: "Dogs" },
      { tag: "outdoors", label: "Being outdoors" },
      { tag: "water", label: "Water play" },
      { tag: "plants", label: "Plants & gardens" },
    ],
  },
  {
    label: "Move & explore",
    emoji: "🤸",
    options: [
      { tag: "movement", label: "Running & jumping" },
      { tag: "swings", label: "Swings & slides" },
      { tag: "sports", label: "Sports & ball play" },
      { tag: "dance", label: "Dancing" },
      { tag: "sensory", label: "Sensory play" },
      { tag: "outdoor_time", label: "Outdoor adventures" },
    ],
  },
  {
    label: "Create",
    emoji: "🎨",
    options: [
      { tag: "art", label: "Drawing & art" },
      { tag: "music", label: "Music" },
      { tag: "singing", label: "Singing" },
      { tag: "building", label: "Making & crafting" },
      { tag: "stories", label: "Stories & books" },
    ],
  },
  {
    label: "Learn & discover",
    emoji: "🔎",
    options: [
      { tag: "numbers", label: "Numbers & counting" },
      { tag: "letters", label: "Letters & words" },
      { tag: "science", label: "How things work" },
      { tag: "space", label: "Space" },
      { tag: "screens", label: "Tablets & videos" },
    ],
  },
  {
    label: "Food & comfort",
    emoji: "🍎",
    options: [
      { tag: "cooking", label: "Cooking & baking" },
      { tag: "snacks", label: "Favorite snacks" },
      { tag: "routines", label: "Predictable routines" },
      { tag: "cozy", label: "Cozy quiet time" },
    ],
  },
];

// "What helps your child?" — supports that map to partner/course need tags.
export const SUPPORT_OPTIONS: TagOption[] = [
  { tag: "communication", label: "Building communication" },
  { tag: "social", label: "Making friends / social skills" },
  { tag: "group_work", label: "Doing well in groups" },
  { tag: "self_regulation", label: "Calming & self-regulation" },
  { tag: "sensory", label: "Sensory-friendly settings" },
  { tag: "routines", label: "Predictable routines" },
  { tag: "transitions", label: "Smooth transitions" },
  { tag: "motor", label: "Movement & motor skills" },
  { tag: "self_help", label: "Daily-living independence" },
  { tag: "outdoor_time", label: "Outdoor / active time" },
  { tag: "visual_supports", label: "Visual supports" },
  { tag: "small_groups", label: "Small, quiet groups" },
];

// Communication style — sensitive, surface-level, single choice.
export interface ChoiceOption {
  value: string;
  label: string;
}
export const COMMUNICATION_OPTIONS: ChoiceOption[] = [
  { value: "verbal", label: "Speaks in sentences" },
  { value: "emerging", label: "Some words, emerging" },
  { value: "few_words", label: "A few words / sounds" },
  { value: "nonverbal", label: "Non-speaking" },
  { value: "aac", label: "Uses AAC / device" },
  { value: "mixed", label: "A mix / not sure" },
];

// What the family hopes to achieve (parent-level focus → folds into recommendations).
export const PARENT_FOCUS_OPTIONS: TagOption[] = [
  { tag: "communication", label: "Communication" },
  { tag: "social", label: "Friendships & social skills" },
  { tag: "self_regulation", label: "Emotional regulation" },
  { tag: "self_help", label: "Independence & daily living" },
  { tag: "behavior", label: "Positive behavior" },
  { tag: "school_readiness", label: "School readiness" },
  { tag: "outdoor_time", label: "More active / outdoor time" },
  { tag: "routines", label: "Calmer routines at home" },
];

// Canonical insurance list — matches partner.insuranceAccepted so we can flag matches.
export const INSURANCE_OPTIONS: string[] = [
  "Medi-Cal",
  "Regional Center",
  "Aetna",
  "Kaiser",
  "Blue Shield",
  "Cigna",
  "Anthem",
  "Private pay",
];

// Communication style implies a communication support need.
export function communicationNeedTags(style?: string): string[] {
  if (!style) return [];
  return ["emerging", "few_words", "nonverbal", "aac"].includes(style) ? ["communication"] : [];
}

export function ageFromDob(dob?: string): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  const age = Math.floor(diff / (365.25 * 24 * 3600 * 1000));
  return age >= 0 && age < 30 ? age : null;
}
