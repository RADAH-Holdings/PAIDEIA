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

export const changePasswordResponseSchema = z.object({
  force_password_change: z.boolean(),
});

export const resendWelcomeResponseSchema = z.object({
  message: z.string(),
});

export type Me = z.infer<typeof meSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;
export type AdminUser = z.infer<typeof adminUserSchema>;
