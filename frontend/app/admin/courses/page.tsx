"use client";

import { useEffect, useState } from "react";

import { CourseCard } from "@/components/course-card";
import { fieldSelectClass, FormField } from "@/components/form-field";
import {
  listAdminUsers,
  listCourses,
  reassignCourse,
} from "@/lib/api";
import type { AdminUser, Course } from "@/lib/schemas";

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<AdminUser[]>([]);
  const [reassigning, setReassigning] = useState<string | null>(null);
  const [targetTeacher, setTargetTeacher] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function refresh() {
    const [c, t] = await Promise.all([
      listCourses(),
      listAdminUsers({ role: "teacher", status: "active" }),
    ]);
    setCourses(c.results);
    setTeachers(t.results);
  }

  useEffect(() => {
    refresh().catch(() => setMessage("Could not load courses"));
  }, []);

  async function onReassign(courseId: string) {
    if (!targetTeacher) return;
    try {
      await reassignCourse(courseId, targetTeacher);
      setReassigning(null);
      setTargetTeacher("");
      await refresh();
      setMessage("Course reassigned.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Reassign failed");
    }
  }

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold text-ink">Courses</h2>
      <p className="mt-1 text-sm text-ink/70">
        All courses in your school, including unassigned courses after teacher deactivation.
      </p>
      {message && <p className="mt-4 text-sm text-ink/80">{message}</p>}
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {courses.map((course) => {
          const unassigned = !course.teacher;
          return (
            <div key={course.id} className="space-y-3">
              <CourseCard course={course} showTeacher unassigned={unassigned} />
              {unassigned && (
                <div className="rounded-card border border-ochre/30 bg-ochre/5 p-3">
                  <p className="font-mono text-xs text-ochre">Needs teacher</p>
                  {reassigning === course.id ? (
                    <div className="mt-2 flex flex-wrap items-end gap-2">
                      <FormField
                        label="Assign teacher"
                        id={`reassign-teacher-${course.id}`}
                        className="min-w-[12rem]"
                      >
                        <select
                          id={`reassign-teacher-${course.id}`}
                          className={`${fieldSelectClass} py-1 text-sm`}
                          value={targetTeacher}
                          onChange={(e) => setTargetTeacher(e.target.value)}
                        >
                          <option value="">Select teacher</option>
                          {teachers.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </FormField>
                      <button
                        type="button"
                        className="rounded-btn bg-ink px-3 py-1 text-xs text-canvas"
                        onClick={() => onReassign(course.id)}
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        className="text-xs text-ink/60"
                        onClick={() => setReassigning(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="mt-2 text-sm text-ink underline"
                      onClick={() => setReassigning(course.id)}
                    >
                      Reassign
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
