import { z } from "zod";

export const schoolSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});

export const meSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(["admin", "teacher", "student"]),
  school: schoolSchema,
  is_active: z.boolean(),
});

export const loginResponseSchema = z.object({
  access: z.string(),
  refresh: z.string(),
  force_password_change: z.boolean(),
});

export const refreshResponseSchema = z.object({
  access: z.string(),
});

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    detail: z.unknown().nullable().optional(),
  }),
});

export const adminUserSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(["admin", "teacher", "student"]),
  is_active: z.boolean(),
});

export const paginatedAdminUsersSchema = z.object({
  count: z.number(),
  next: z.string().nullable(),
  previous: z.string().nullable(),
  results: z.array(adminUserSchema),
});

export const createUserResponseSchema = adminUserSchema;

export const deactivateUserResponseSchema = z.object({
  id: z.string().uuid(),
  is_active: z.boolean(),
  affected_courses: z.array(
    z.object({
      id: z.string().uuid(),
      title: z.string(),
      enrolled_count: z.number(),
    }),
  ),
});

export const resendWelcomeResponseSchema = z.object({
  message: z.string(),
});

export const changePasswordResponseSchema = z.object({
  force_password_change: z.boolean(),
});

export const userSummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});

export const courseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  subject: z.string(),
  target_level: z.string(),
  learning_outcomes: z.string(),
  topic_sequence: z.string(),
  exam_context: z.string(),
  special_instructions: z.string(),
  approximate_lessons: z.number(),
  status: z.enum(["draft", "active", "archived"]),
  teacher: userSummarySchema.nullable(),
  has_active_sessions: z.boolean(),
  enrolled_count: z.number().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const courseListSchema = z.object({
  results: z.array(courseSchema),
});

export const enrollResultSchema = z.object({
  enrolled: z.number(),
  reactivated: z.number(),
  already_enrolled: z.number(),
});

export const enrollmentRosterSchema = z.object({
  results: z.array(
    z.object({
      id: z.string().uuid(),
      student: userSummarySchema,
      status: z.enum(["active", "unenrolled"]),
      sessions_completed: z.number(),
      enrolled_at: z.string(),
      last_session_at: z.string().nullable(),
    }),
  ),
});

export const studentCourseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  subject: z.string(),
  sessions_completed: z.number(),
  last_session_at: z.string().nullable(),
});

export const schoolStudentListSchema = z.object({
  results: z.array(userSummarySchema),
});

export const studentCourseListSchema = z.object({
  results: z.array(studentCourseSchema),
});

export type Me = z.infer<typeof meSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;
export type AdminUser = z.infer<typeof adminUserSchema>;
export type Course = z.infer<typeof courseSchema>;
export type EnrollmentRow = z.infer<
  typeof enrollmentRosterSchema
>["results"][number];
