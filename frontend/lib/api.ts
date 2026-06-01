import {
  apiErrorSchema,
  changePasswordResponseSchema,
  createUserResponseSchema,
  deactivateUserResponseSchema,
  loginResponseSchema,
  meSchema,
  paginatedAdminUsersSchema,
  refreshResponseSchema,
  type AdminUser,
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
  return `/${role}`;
}
