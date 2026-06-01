/** Mirrors backend/courses/validation.py — shown in brief editor (BRIEF-04). */
export const BRIEF_FIELD_HINTS = {
  title: { min: 3, example: "Biology — Year 10, Term 2" },
  subject: { min: 2, example: "Biology" },
  target_level: { min: 5, example: "Year 10 / Age 14–15" },
  learning_outcomes: {
    min: 100,
    example:
      "Students will explain cell structure, describe osmosis, and compare mitosis and meiosis.",
  },
  topic_sequence: {
    min: 80,
    example:
      "1. Cell biology  2. Transport across membranes  3. Genetics  4. Evolution (teacher-led)",
  },
  approximate_lessons: { min: 10, max: 120 },
} as const;
