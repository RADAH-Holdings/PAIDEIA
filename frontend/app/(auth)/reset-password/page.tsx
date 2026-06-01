"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

import { ApiError } from "@/lib/api";
import { API_BASE } from "@/lib/api-base";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const uid = searchParams?.get("uid") ?? "";
  const token = searchParams?.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!uid || !token) {
      setError("Invalid reset link.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/password-reset/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, token, new_password: password }),
      });
      const body = await res.json();
      if (!res.ok) {
        throw new ApiError(
          body?.error?.message ?? "Reset failed",
          res.status,
          body?.error?.code,
        );
      }
      router.replace("/sign-in");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not reset password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-md rounded-card border border-ink/10 bg-white/50 p-8 shadow-sm">
        <h1 className="font-display text-3xl font-semibold text-ink">Reset password</h1>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="new-password" className="mb-1 block font-mono text-xs text-ink/70">
              New password
            </label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-btn border border-ink/15 bg-canvas px-3 py-2 outline-none ring-ochre/40 focus:ring-2"
            />
            <p className="mt-1 text-xs text-ink/60">At least 8 characters.</p>
          </div>
          {error ? <p className="text-sm text-red-800">{error}</p> : null}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-btn bg-ink py-2.5 text-sm text-canvas disabled:opacity-60"
          >
            {submitting ? "Saving…" : "Set password"}
          </button>
        </form>
        <Link href="/sign-in" className="mt-4 inline-block font-mono text-xs text-ink/50">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<p className="p-8 text-center text-ink/60">Loading…</p>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
