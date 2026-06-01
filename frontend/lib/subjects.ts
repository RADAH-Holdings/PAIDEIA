/** DS §16 — warm earth subject taxonomy */
export const SUBJECT_OPTIONS = [
  "Mathematics",
  "Science",
  "English & Literature",
  "History",
  "Geography",
  "Languages",
  "Art & Music",
  "PE & Wellbeing",
] as const;

export type SubjectSlug =
  | "math"
  | "science"
  | "english"
  | "history"
  | "geography"
  | "languages"
  | "art"
  | "pe"
  | "neutral";

const SUBJECT_SLUG_MAP: Record<string, SubjectSlug> = {
  mathematics: "math",
  math: "math",
  science: "science",
  biology: "science",
  chemistry: "science",
  physics: "science",
  "english & literature": "english",
  english: "english",
  literature: "english",
  history: "history",
  geography: "geography",
  languages: "languages",
  "art & music": "art",
  art: "art",
  music: "art",
  "pe & wellbeing": "pe",
  pe: "pe",
};

export function subjectSlug(subject: string): SubjectSlug {
  const key = subject.trim().toLowerCase();
  return SUBJECT_SLUG_MAP[key] ?? "neutral";
}

export const SUBJECT_STYLES: Record<
  SubjectSlug,
  { pill: string; stripe: string; label: string }
> = {
  math: {
    pill: "bg-[#9A4A3E] text-canvas",
    stripe: "border-l-[#9A4A3E]",
    label: "Mathematics",
  },
  science: {
    pill: "bg-[#4A7359] text-canvas",
    stripe: "border-l-[#4A7359]",
    label: "Science",
  },
  english: {
    pill: "bg-[#6E3E6E] text-canvas",
    stripe: "border-l-[#6E3E6E]",
    label: "English",
  },
  history: {
    pill: "bg-[#A6611F] text-canvas",
    stripe: "border-l-[#A6611F]",
    label: "History",
  },
  geography: {
    pill: "bg-[#4A6379] text-canvas",
    stripe: "border-l-[#4A6379]",
    label: "Geography",
  },
  languages: {
    pill: "bg-[#94762A] text-canvas",
    stripe: "border-l-[#94762A]",
    label: "Languages",
  },
  art: {
    pill: "bg-[#97506B] text-canvas",
    stripe: "border-l-[#97506B]",
    label: "Art & Music",
  },
  pe: {
    pill: "bg-[#2F6C6C] text-canvas",
    stripe: "border-l-[#2F6C6C]",
    label: "PE",
  },
  neutral: {
    pill: "bg-[#6B7280] text-canvas",
    stripe: "border-l-[#6B7280]",
    label: "Subject",
  },
};
