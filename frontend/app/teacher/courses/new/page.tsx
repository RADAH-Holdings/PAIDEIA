"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { BRIEF_FIELD_HINTS } from "@/lib/brief-fields";
import { createCourse } from "@/lib/api";
import { SUBJECT_OPTIONS } from "@/lib/subjects";

export default function NewCoursePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    subject: SUBJECT_OPTIONS[1] as string,
    target_level: "",
    learning_outcomes: "",
    topic_sequence: "",
    exam_context: "",
    special_instructions: "",
    approximate_lessons: 40,
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const course = await createCourse(form);
      router.push(`/teacher/courses/${course.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create course");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="max-w-3xl px-8 py-10">
      <h1 className="font-display text-3xl font-semibold text-ink">New course brief</h1>
      <p className="mt-2 text-ink/70">Saved as a draft — activate when required fields are complete.</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-6">
        <BriefField
          label="Course title"
          name="title"
          value={form.title}
          onChange={(v) => setForm((f) => ({ ...f, title: v }))}
          hint={BRIEF_FIELD_HINTS.title}
        />
        <label className="block">
          <span className="text-sm font-medium text-ink">Subject</span>
          <select
            className="mt-1 w-full rounded-btn border border-ink/20 bg-white/60 px-3 py-2 font-display"
            value={form.subject}
            onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
          >
            {SUBJECT_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <BriefField
          label="Target level"
          name="target_level"
          value={form.target_level}
          onChange={(v) => setForm((f) => ({ ...f, target_level: v }))}
          hint={BRIEF_FIELD_HINTS.target_level}
        />
        <BriefField
          label="Learning outcomes"
          name="learning_outcomes"
          value={form.learning_outcomes}
          onChange={(v) => setForm((f) => ({ ...f, learning_outcomes: v }))}
          hint={BRIEF_FIELD_HINTS.learning_outcomes}
          multiline
        />
        <BriefField
          label="Topic sequence"
          name="topic_sequence"
          value={form.topic_sequence}
          onChange={(v) => setForm((f) => ({ ...f, topic_sequence: v }))}
          hint={BRIEF_FIELD_HINTS.topic_sequence}
          multiline
        />
        <label className="block">
          <span className="text-sm font-medium text-ink">Approximate lessons</span>
          <input
            type="number"
            min={10}
            max={120}
            className="mt-1 w-32 rounded-btn border border-ink/20 bg-white/60 px-3 py-2"
            value={form.approximate_lessons}
            onChange={(e) =>
              setForm((f) => ({ ...f, approximate_lessons: Number(e.target.value) }))
            }
          />
        </label>
        {error && <p className="text-sm text-red-800">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="rounded-btn bg-ink px-4 py-2 text-sm font-medium text-canvas disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save draft"}
        </button>
      </form>
    </main>
  );
}

function BriefField({
  label,
  name,
  value,
  onChange,
  hint,
  multiline,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  hint: { min: number; example: string };
  multiline?: boolean;
}) {
  const Input = multiline ? "textarea" : "input";
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink">{label}</span>
      <Input
        name={name}
        rows={multiline ? 4 : undefined}
        className="mt-1 w-full rounded-btn border border-ink/20 bg-white/60 px-3 py-2 font-display text-ink"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <p className="mt-1 font-mono text-[10px] text-ink/50">
        {value.length} / {hint.min} min · e.g. {hint.example}
      </p>
    </label>
  );
}
