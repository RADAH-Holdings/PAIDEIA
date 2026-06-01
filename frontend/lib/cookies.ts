export const ACCESS_COOKIE = "paideia_access";
export const REFRESH_COOKIE = "paideia_refresh";

export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function setAuthCookies(access: string, refresh: string, maxAgeSeconds = 60 * 60 * 24 * 7) {
  const secure = typeof window !== "undefined" && window.location.protocol === "https:";
  const base = `path=/; SameSite=Lax; max-age=${maxAgeSeconds}${secure ? "; Secure" : ""}`;
  document.cookie = `${ACCESS_COOKIE}=${encodeURIComponent(access)}; ${base}`;
  document.cookie = `${REFRESH_COOKIE}=${encodeURIComponent(refresh)}; ${base}`;
}

export function clearAuthCookies() {
  document.cookie = `${ACCESS_COOKIE}=; path=/; max-age=0`;
  document.cookie = `${REFRESH_COOKIE}=; path=/; max-age=0`;
}

export function getAccessToken(): string | null {
  return getCookie(ACCESS_COOKIE);
}

export function getRefreshToken(): string | null {
  return getCookie(REFRESH_COOKIE);
}
