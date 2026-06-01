"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { BRIEF_FIELD_HINTS } from "@/lib/brief-fields";
import {
  activateCourse,
  enrollStudents,
  getCourse,
  listSchoolStudents,
  listCourseEnrollments,
  unenrollStudent,
  updateCourse,
} from "@/lib/api";
import type { Course, EnrollmentRow } from "@/lib/schemas";
import { SUBJECT_OPTIONS } from "@/lib/subjects";

type Tab = "brief" | "roster";

export default function TeacherCourseDetailPage() {
  const params = useParams();
  const courseId = String(params?.id ?? "");
  const [tab, setTab] = useState<Tab>("brief");
  const [course, setCourse] = useState<Course | null>(null);
  const [roster, setRoster] = useState<EnrollmentRow[]>([]);
  const [students, setStudents] = useState<{ id: string; name: string }[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [ackWarning, setAckWarning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [c, r] = await Promise.all([
      getCourse(courseId),
      listCourseEnrollments(courseId),
    ]);
    setCourse(c);
    setRoster(r.results);
  }, [courseId]);

  useEffect(() => {
    load().catch(() => setMessage("Could not load course"));
    listSchoolStudents()
      .then((data) =>
        setStudents(data.results.map((u) => ({ id: u.id, name: u.name }))),
      )
      .catch(() => setStudents([]));
  }, [load]);

  if (!course) {
    return (
      <main className="px-8 py-10">
        <p className="font-mono text-sm text-ink/60">Loading course…</p>
      </main>
    );
  }

  const enrolledIds = new Set(roster.map((r) => r.student.id));
  const available = students.filter((s) => !enrolledIds.has(s.id));

  async function saveBrief(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (course?.has_active_sessions && !ackWarning) {
      setMessage("Acknowledge the active-sessions warning before saving.");
      return;
    }
    const fd = new FormData(e.currentTarget);
    try {
      const updated = await updateCourse(courseId, {
        title: String(fd.get("title")),
        subject: String(fd.get("subject")),
        target_level: String(fd.get("target_level")),
        learning_outcomes: String(fd.get("learning_outcomes")),
        topic_sequence: String(fd.get("topic_sequence")),
        exam_context: String(fd.get("exam_context")),
        special_instructions: String(fd.get("special_instructions")),
        approximate_lessons: Number(fd.get("approximate_lessons")),
      });
      setCourse(updated);
      setMessage("Brief saved.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Save failed");
    }
  }

  async function onActivate() {
    try {
      const updated = await activateCourse(courseId);
      setCourse(updated);
      setMessage("Course is now active.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Activation failed");
    }
  }

  async function onEnroll() {
    if (selected.length === 0) return;
    try {
      await enrollStudents(courseId, selected);
      setSelected([]);
      await load();
      setMessage("Students enrolled.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Enrollment failed");
    }
  }

  return (
    <main className="max-w-4xl px-8 py-10">
      <p className="font-mono text-xs uppercase tracking-widest text-ochre">{course.status}</p>
      <h1 className="font-display text-3xl font-semibold text-ink">{course.title}</h1>
      <div className="mt-6 flex gap-2 border-b border-ink/10">
        {(["brief", "roster"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-t-btn px-4 py-2 text-sm capitalize ${
              tab === t ? "bg-ink/10 font-medium" : "text-ink/60"
            }`}
          >
            {t === "brief" ? "Course brief" : "Roster"}
          </button>
        ))}
      </div>
      {message && <p className="mt-4 text-sm text-ink/80">{message}</p>}

      {tab === "brief" && (
        <div className="mt-6">
          {course.status === "draft" && (
            <button
              type="button"
              onClick={onActivate}
              className="mb-6 rounded-btn bg-ochre px-4 py-2 text-sm font-medium text-canvas"
            >
              Activate course
            </button>
          )}
          {course.has_active_sessions && (
            <div className="mb-6 rounded-card border border-ochre/40 bg-ochre/10 p-4 text-sm text-ink">
              Editing this brief will change how future lessons are generated. Lessons
              already delivered are not affected.
              <label className="mt-3 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={ackWarning}
                  onChange={(e) => setAckWarning(e.target.checked)}
                />
                I understand
              </label>
            </div>
          )}
          <form onSubmit={saveBrief} className="space-y-4">
            <input
              name="title"
              defaultValue={course.title}
              className="w-full rounded-btn border border-ink/20 bg-white/60 px-3 py-2 font-display text-lg"
            />
            <select
              name="subject"
              defaultValue={course.subject}
              className="w-full rounded-btn border border-ink/20 bg-white/60 px-3 py-2"
            >
              {SUBJECT_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <textarea
              name="target_level"
              defaultValue={course.target_level}
              rows={2}
              className="w-full rounded-btn border border-ink/20 bg-white/60 px-3 py-2 font-display"
            />
            <textarea
              name="learning_outcomes"
              defaultValue={course.learning_outcomes}
              rows={4}
              className="w-full rounded-btn border border-ink/20 bg-white/60 px-3 py-2 font-display"
            />
            <p className="font-mono text-[10px] text-ink/50">
              {course.learning_outcomes.length} / {BRIEF_FIELD_HINTS.learning_outcomes.min} min
            </p>
            <textarea
              name="topic_sequence"
              defaultValue={course.topic_sequence}
              rows={4}
              className="w-full rounded-btn border border-ink/20 bg-white/60 px-3 py-2 font-display"
            />
            <textarea
              name="exam_context"
              defaultValue={course.exam_context}
              rows={2}
              className="w-full rounded-btn border border-ink/20 px-3 py-2"
            />
            <textarea
              name="special_instructions"
              defaultValue={course.special_instructions}
              rows={2}
              className="w-full rounded-btn border border-ink/20 px-3 py-2"
            />
            <input
              name="approximate_lessons"
              type="number"
              min={10}
              max={120}
              defaultValue={course.approximate_lessons}
              className="w-32 rounded-btn border border-ink/20 px-3 py-2"
            />
            <button
              type="submit"
              className="rounded-btn bg-ink px-4 py-2 text-sm text-canvas"
            >
              Save brief
            </button>
          </form>
        </div>
      )}

      {tab === "roster" && (
        <div className="mt-6">
          {course.status !== "active" ? (
            <p className="text-ink/70">Activate the course before enrolling students.</p>
          ) : (
            <>
              <div className="rounded-card border border-ink/10 p-4">
                <p className="text-sm font-medium text-ink">Enroll students</p>
                <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto">
                  {available.map((s) => (
                    <li key={s.id}>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={selected.includes(s.id)}
                          onChange={(e) =>
                            setSelected((prev) =>
                              e.target.checked
                                ? [...prev, s.id]
                                : prev.filter((id) => id !== s.id),
                            )
                          }
                        />
                        {s.name}
                      </label>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={onEnroll}
                  className="mt-3 rounded-btn bg-ink px-3 py-1.5 text-sm text-canvas"
                >
                  Enroll selected
                </button>
              </div>
              <ul className="mt-6 divide-y divide-ink/10">
                {roster.map((row) => (
                  <li
                    key={row.id}
                    className="flex items-center justify-between py-3 text-sm"
                  >
                    <span>{row.student.name}</span>
                    <button
                      type="button"
                      className="text-ink/60 underline"
                      onClick={async () => {
                        if (!confirm(`Unenroll ${row.student.name}?`)) return;
                        await unenrollStudent(row.id);
                        await load();
                      }}
                    >
                      Unenroll
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </main>
  );
}
