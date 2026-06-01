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

export type Me = z.infer<typeof meSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;
