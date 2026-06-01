import {
  apiErrorSchema,
  changePasswordResponseSchema,
  createUserResponseSchema,
  deactivateUserResponseSchema,
  loginResponseSchema,
  meSchema,
  paginatedAdminUsersSchema,
  refreshResponseSchema,
  resendWelcomeResponseSchema,
  courseListSchema,
  courseSchema,
  enrollResultSchema,
  enrollmentRosterSchema,
  schoolStudentListSchema,
  studentCourseListSchema,
  type AdminUser,
  type Course,
  type LoginResponse,
  type Me,
} from "@/lib/schemas";
import { getAccessToken, getRefreshToken, setAuthCookies } from "@/lib/cookies";

import { API_BASE } from "@/lib/api-base";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function parseJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function request<T>(
  path: string,
  init: RequestInit & { schema: { parse: (data: unknown) => T }; auth?: boolean },
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");

  if (init.auth !== false) {
    const token = getAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  let response = await fetch(`${API_BASE}${path}`, { ...init, headers });

  if (response.status === 401 && init.auth !== false && getRefreshToken()) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      headers.set("Authorization", `Bearer ${refreshed}`);
      response = await fetch(`${API_BASE}${path}`, { ...init, headers });
    }
  }

  const body = await parseJson(response);

  if (!response.ok) {
    const parsed = apiErrorSchema.safeParse(body);
    throw new ApiError(
      parsed.success ? parsed.data.error.message : "Request failed",
      response.status,
      parsed.success ? parsed.data.error.code : undefined,
    );
  }

  return init.schema.parse(body);
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const data = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
    auth: false,
    schema: loginResponseSchema,
  });
  setAuthCookies(data.access, data.refresh);
  return data;
}

export async function changePassword(newPassword: string) {
  return request("/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ new_password: newPassword }),
    schema: changePasswordResponseSchema,
  });
}

export type ListUsersParams = {
  role?: "admin" | "teacher" | "student";
  status?: "active" | "inactive";
  page?: number;
};

export async function listAdminUsers(params: ListUsersParams = {}) {
  const search = new URLSearchParams();
  if (params.role) search.set("role", params.role);
  if (params.status) search.set("status", params.status);
  if (params.page) search.set("page", String(params.page));
  const qs = search.toString();
  return request(`/admin/users${qs ? `?${qs}` : ""}`, {
    method: "GET",
    schema: paginatedAdminUsersSchema,
  });
}

export async function createAdminUser(body: {
  name: string;
  email: string;
  role: "teacher" | "student";
}): Promise<AdminUser> {
  return request("/admin/users", {
    method: "POST",
    body: JSON.stringify(body),
    schema: createUserResponseSchema,
  });
}

export async function resendWelcomeEmail(userId: string) {
  return request(`/admin/users/${userId}/resend-welcome`, {
    method: "POST",
    body: "{}",
    schema: resendWelcomeResponseSchema,
  });
}

export async function deactivateAdminUser(userId: string) {
  return request(`/admin/users/${userId}/deactivate`, {
    method: "PATCH",
    schema: deactivateUserResponseSchema,
  });
}

export async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  try {
    const data = await request("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh }),
      auth: false,
      schema: refreshResponseSchema,
    });
    setAuthCookies(data.access, refresh);
    return data.access;
  } catch {
    return null;
  }
}

export async function fetchMe(): Promise<Me> {
  return request("/me", { method: "GET", schema: meSchema });
}

export function roleHomePath(role: Me["role"]): string {
  if (role === "teacher") return "/teacher/courses";
  return `/${role}`;
}

export async function listCourses() {
  return request("/courses", { method: "GET", schema: courseListSchema });
}

export async function getCourse(courseId: string): Promise<Course> {
  return request(`/courses/${courseId}`, { method: "GET", schema: courseSchema });
}

export type CourseBriefInput = {
  title: string;
  subject: string;
  target_level: string;
  learning_outcomes: string;
  topic_sequence: string;
  exam_context: string;
  special_instructions: string;
  approximate_lessons: number;
};

export async function createCourse(body: CourseBriefInput) {
  return request("/courses", {
    method: "POST",
    body: JSON.stringify(body),
    schema: courseSchema,
  });
}

export async function updateCourse(courseId: string, body: Partial<CourseBriefInput>) {
  return request(`/courses/${courseId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
    schema: courseSchema,
  });
}

export async function activateCourse(courseId: string) {
  return request(`/courses/${courseId}/activate`, {
    method: "POST",
    body: "{}",
    schema: courseSchema,
  });
}

export async function archiveCourse(courseId: string) {
  return request(`/courses/${courseId}/archive`, {
    method: "POST",
    body: "{}",
    schema: courseSchema,
  });
}

export async function listCourseEnrollments(courseId: string) {
  return request(`/courses/${courseId}/enrollments`, {
    method: "GET",
    schema: enrollmentRosterSchema,
  });
}

export async function enrollStudents(courseId: string, studentIds: string[]) {
  return request(`/courses/${courseId}/enrollments`, {
    method: "POST",
    body: JSON.stringify({ student_ids: studentIds }),
    schema: enrollResultSchema,
  });
}

export async function unenrollStudent(enrollmentId: string) {
  const headers = new Headers({ "Content-Type": "application/json" });
  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`${API_BASE}/enrollments/${enrollmentId}`, {
    method: "DELETE",
    headers,
  });
  if (!response.ok) {
    const body = await parseJson(response);
    const parsed = apiErrorSchema.safeParse(body);
    throw new ApiError(
      parsed.success ? parsed.data.error.message : "Request failed",
      response.status,
    );
  }
}

export async function reassignCourse(courseId: string, newTeacherId: string) {
  return request(`/admin/courses/${courseId}/reassign`, {
    method: "POST",
    body: JSON.stringify({ new_teacher_id: newTeacherId }),
    schema: courseSchema,
  });
}

export async function listSchoolStudents() {
  return request("/students", {
    method: "GET",
    schema: schoolStudentListSchema,
  });
}

export async function listStudentCourses() {
  return request("/students/me/courses", {
    method: "GET",
    schema: studentCourseListSchema,
  });
}
