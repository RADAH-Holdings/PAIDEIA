"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { CourseCard } from "@/components/course-card";
import { listCourses } from "@/lib/api";
import type { Course } from "@/lib/schemas";

export default function TeacherCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    listCourses()
      .then((data) => setCourses(data.results))
      .catch(() => setCourses([]));
  }, []);

  return (
    <main className="px-8 py-10">
      <h1 className="font-display text-3xl font-semibold text-ink">Your courses</h1>
      <p className="mt-2 max-w-xl text-ink/70">
        Create a course brief, activate it when ready, then enroll students from the roster tab.
      </p>
      {courses.length === 0 ? (
        <div className="mt-10 rounded-card border border-dashed border-ink/20 p-10 text-center">
          <p className="text-ink/70">No courses yet.</p>
          <Link
            href="/teacher/courses/new"
            className="mt-4 inline-block rounded-btn bg-ink px-4 py-2 text-sm text-canvas"
          >
            Create your first course
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              href={`/teacher/courses/${course.id}`}
            />
          ))}
        </div>
      )}
    </main>
  );
}
