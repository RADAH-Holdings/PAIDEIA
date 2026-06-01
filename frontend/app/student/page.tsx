"use client";

import { useEffect, useState } from "react";

import { CourseCard, type CourseCardCourse } from "@/components/course-card";
import { listStudentCourses } from "@/lib/api";

export default function StudentHomePage() {
  const [courses, setCourses] = useState<CourseCardCourse[]>([]);

  useEffect(() => {
    listStudentCourses()
      .then((data) =>
        setCourses(
          data.results.map((c) => ({
            id: c.id,
            title: c.title,
            subject: c.subject,
            status: "active" as const,
            sessions_completed: c.sessions_completed,
            last_session_at: c.last_session_at,
          })),
        ),
      )
      .catch(() => setCourses([]));
  }, []);

  if (courses.length === 0) {
    return (
      <p className="text-ink/70">
        You are not enrolled in any active courses yet. Your teacher will enroll you when a
        course is ready.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {courses.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
}
