"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { CourseCard } from "@/components/course-card";
import { useAuth } from "@/lib/auth";
import { listCourses } from "@/lib/api";
import type { Course } from "@/lib/schemas";

export function TeacherShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    if (loading || !user || user.role !== "teacher") return;
    listCourses()
      .then((data) => setCourses(data.results))
      .catch(() => setCourses([]));
  }, [user, loading, pathname]);

  useEffect(() => {
    if (loading || !user) return;
    if (user.role !== "teacher") router.replace(`/${user.role}`);
  }, [user, loading, router]);

  if (loading || !user || user.role !== "teacher") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <p className="font-mono text-sm text-ink/60">Loading…</p>
      </div>
    );
  }

  const groups: { label: string; status: Course["status"] }[] = [
    { label: "Active", status: "active" },
    { label: "Drafts", status: "draft" },
    { label: "Archived", status: "archived" },
  ];

  return (
    <div className="flex min-h-screen bg-canvas">
      <aside className="flex w-[280px] shrink-0 flex-col border-r border-ink/10 bg-parchment-deep/50">
        <div className="border-b border-ink/10 px-5 py-5">
          <p className="font-mono text-xs uppercase tracking-widest text-ochre">Teaching</p>
          <p className="mt-1 font-display text-lg font-semibold text-ink">{user.school.name}</p>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <Link
            href="/teacher/courses/new"
            className="mb-4 block rounded-btn bg-ink px-3 py-2 text-center text-sm font-medium text-canvas"
          >
            New course
          </Link>
          {groups.map((group) => {
            const items = courses.filter((c) => c.status === group.status);
            if (items.length === 0) return null;
            return (
              <div key={group.status} className="mb-5">
                <p className="px-2 font-mono text-[10px] uppercase tracking-widest text-ink/50">
                  {group.label}
                </p>
                <ul className="mt-2 space-y-1">
                  {items.map((course) => {
                    const active = pathname?.startsWith(`/teacher/courses/${course.id}`);
                    return (
                      <li key={course.id}>
                        <Link
                          href={`/teacher/courses/${course.id}`}
                          className={`block rounded-btn px-3 py-2 text-sm ${
                            active
                              ? "bg-ink/10 font-medium text-ink"
                              : "text-ink/80 hover:bg-ink/5"
                          }`}
                        >
                          <span className="line-clamp-1">{course.title}</span>
                          <span className="font-mono text-[10px] text-ink/50">
                            {course.enrolled_count ?? 0} students
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
        <div className="border-t border-ink/10 px-5 py-4">
          <p className="truncate font-mono text-xs text-ink/60">{user.email}</p>
          <button
            type="button"
            onClick={() => {
              logout();
              router.push("/sign-in");
            }}
            className="mt-2 rounded-btn border border-ink/20 px-3 py-1.5 text-xs text-ink"
          >
            Sign out
          </button>
        </div>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
