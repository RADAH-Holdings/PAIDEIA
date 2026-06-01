"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  BriefField,
  BriefLessonsField,
  BriefSubjectField,
} from "@/components/brief-field";
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
          field="title"
          value={form.title}
          onChange={(v) => setForm((f) => ({ ...f, title: v }))}
        />
        <BriefSubjectField
          value={form.subject}
          onChange={(v) => setForm((f) => ({ ...f, subject: v }))}
        />
        <BriefField
          field="target_level"
          value={form.target_level}
          onChange={(v) => setForm((f) => ({ ...f, target_level: v }))}
          multiline
          rows={2}
        />
        <BriefField
          field="learning_outcomes"
          value={form.learning_outcomes}
          onChange={(v) => setForm((f) => ({ ...f, learning_outcomes: v }))}
          multiline
        />
        <BriefField
          field="topic_sequence"
          value={form.topic_sequence}
          onChange={(v) => setForm((f) => ({ ...f, topic_sequence: v }))}
          multiline
        />
        <BriefField
          field="exam_context"
          value={form.exam_context}
          onChange={(v) => setForm((f) => ({ ...f, exam_context: v }))}
          multiline
          rows={2}
        />
        <BriefField
          field="special_instructions"
          value={form.special_instructions}
          onChange={(v) => setForm((f) => ({ ...f, special_instructions: v }))}
          multiline
          rows={2}
        />
        <BriefLessonsField
          value={form.approximate_lessons}
          onChange={(v) => setForm((f) => ({ ...f, approximate_lessons: v }))}
        />
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
