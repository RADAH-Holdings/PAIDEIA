"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import {
  BriefFormField,
  BriefLessonsField,
  BriefSubjectField,
} from "@/components/brief-field";
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
              <label htmlFor="brief-ack-sessions" className="mt-3 flex items-center gap-2">
                <input
                  id="brief-ack-sessions"
                  type="checkbox"
                  checked={ackWarning}
                  onChange={(e) => setAckWarning(e.target.checked)}
                />
                I understand
              </label>
            </div>
          )}
          <form onSubmit={saveBrief} className="space-y-6">
            <BriefFormField field="title" defaultValue={course.title} />
            <BriefSubjectField defaultValue={course.subject} />
            <BriefFormField
              field="target_level"
              defaultValue={course.target_level}
              multiline
              rows={2}
            />
            <BriefFormField
              field="learning_outcomes"
              defaultValue={course.learning_outcomes}
              multiline
              valueLength={course.learning_outcomes.length}
            />
            <BriefFormField
              field="topic_sequence"
              defaultValue={course.topic_sequence}
              multiline
              valueLength={course.topic_sequence.length}
            />
            <BriefFormField
              field="exam_context"
              defaultValue={course.exam_context}
              multiline
              rows={2}
            />
            <BriefFormField
              field="special_instructions"
              defaultValue={course.special_instructions}
              multiline
              rows={2}
            />
            <BriefLessonsField defaultValue={course.approximate_lessons} />
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
                <h2 className="text-sm font-medium text-ink" id="enroll-students-heading">
                  Enroll students
                </h2>
                <p className="mt-1 text-xs text-ink/60">
                  Select students from your school who are not yet on this roster.
                </p>
                <ul
                  className="mt-2 max-h-40 space-y-1 overflow-y-auto"
                  aria-labelledby="enroll-students-heading"
                >
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
