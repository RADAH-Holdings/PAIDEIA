import Link from "next/link";

import { SUBJECT_STYLES, subjectSlug } from "@/lib/subjects";

export type CourseCardCourse = {
  id: string;
  title: string;
  subject: string;
  status: "draft" | "active" | "archived";
  enrolled_count?: number;
  sessions_completed?: number;
  last_session_at?: string | null;
  teacher?: { id: string; name: string } | null;
};

type CourseCardProps = {
  course: CourseCardCourse;
  href?: string;
  showTeacher?: boolean;
  unassigned?: boolean;
};

export function CourseCard({
  course,
  href,
  showTeacher = false,
  unassigned = false,
}: CourseCardProps) {
  const slug = subjectSlug(course.subject);
  const styles = SUBJECT_STYLES[slug];
  const count =
    course.sessions_completed ?? course.enrolled_count ?? 0;
  const countLabel =
    course.sessions_completed !== undefined
      ? `${count} session${count === 1 ? "" : "s"} completed`
      : `${count} student${count === 1 ? "" : "s"}`;

  const inner = (
    <article
      className={`rounded-card border border-ink/10 bg-white/50 p-5 shadow-sm border-l-4 ${styles.stripe}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-ochre">
            {course.status}
            {unassigned ? " · unassigned" : ""}
          </p>
          <h2 className="mt-1 font-display text-xl font-semibold text-ink">
            {course.title}
          </h2>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wide ${styles.pill}`}
        >
          {course.subject}
        </span>
      </div>
      <p className="mt-3 font-mono text-xs text-ink/60">{countLabel}</p>
      {showTeacher && (
        <p className="mt-2 text-sm text-ink/70">
          {course.teacher?.name ?? "No teacher assigned"}
        </p>
      )}
    </article>
  );

  if (href) {
    return (
      <Link href={href} className="block transition hover:opacity-90">
        {inner}
      </Link>
    );
  }
  return inner;
}
