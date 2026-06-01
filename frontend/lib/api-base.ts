/** No trailing slash — paths like `/auth/login` must not produce `//api/...`. */
export const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"
).replace(/\/+$/, "");
