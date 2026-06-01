/** Mirrors backend/courses/validation.py — labels and hints for brief editor (BRIEF-04). */

export type BriefFieldKey =
  | "title"
  | "subject"
  | "target_level"
  | "learning_outcomes"
  | "topic_sequence"
  | "exam_context"
  | "special_instructions"
  | "approximate_lessons";

export type BriefFieldMeta = {
  label: string;
  help?: string;
  min?: number;
  max?: number;
  example?: string;
  optional?: boolean;
};

export const BRIEF_FIELDS: Record<BriefFieldKey, BriefFieldMeta> = {
  title: {
    label: "Course title",
    help: "Shown on dashboards and to students when the course is active.",
    min: 3,
    example: "Biology — Year 10, Term 2",
  },
  subject: {
    label: "Subject",
    help: "Subject area passed to the AI when generating lessons.",
    min: 2,
    example: "Biology",
  },
  target_level: {
    label: "Target level",
    help: "Year group, age range, or ability — calibrates vocabulary and depth.",
    min: 5,
    example: "Year 10 / Age 14–15",
  },
  learning_outcomes: {
    label: "Learning outcomes",
    help: "What students should know by the end of the course. Use bullet points.",
    min: 100,
    example:
      "Students will explain cell structure, describe osmosis, and compare mitosis and meiosis.",
  },
  topic_sequence: {
    label: "Topic sequence",
    help: "Rough order of topics. The AI fills gaps between items.",
    min: 80,
    example:
      "1. Cell biology  2. Transport across membranes  3. Genetics  4. Evolution (teacher-led)",
  },
  exam_context: {
    label: "Exam context",
    help: "Exam or qualification being prepared for, if any.",
    optional: true,
    example: "WAEC Biology — past topics include genetics and ecology.",
  },
  special_instructions: {
    label: "Special instructions",
    help: "Hard constraints for the AI (e.g. topics to skip or emphasize).",
    optional: true,
    example: "Do not cover evolution — teacher-led only.",
  },
  approximate_lessons: {
    label: "Approximate lessons",
    help: "Guides pacing for the AI (10–120). Not a hard cap on sessions.",
    min: 10,
    max: 120,
  },
};

/** @deprecated Use BRIEF_FIELDS — kept for imports that expect hint shape only */
export const BRIEF_FIELD_HINTS = BRIEF_FIELDS;
