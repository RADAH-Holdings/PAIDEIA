"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { ApiError, changePassword, fetchMe, roleHomePath } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function ChangePasswordPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    setSubmitting(true);
    try {
      await changePassword(password);
      const me = await fetchMe();
      await refreshUser();
      router.replace(roleHomePath(me.role));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-md rounded-card border border-ink/10 bg-white/50 p-8 shadow-sm">
        <p className="font-mono text-xs uppercase tracking-widest text-ochre">Paideia</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Set a new password</h1>
        <p className="mt-2 text-sm text-ink/70">
          Your administrator issued a temporary password. Choose a new one to continue.
        </p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="password" className="mb-1 block font-mono text-xs text-ink/70">
              New password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-btn border border-ink/15 bg-canvas px-3 py-2 text-ink outline-none ring-ochre/40 focus:ring-2"
            />
          </div>
          <div>
            <label htmlFor="confirm" className="mb-1 block font-mono text-xs text-ink/70">
              Confirm password
            </label>
            <input
              id="confirm"
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-btn border border-ink/15 bg-canvas px-3 py-2 text-ink outline-none ring-ochre/40 focus:ring-2"
            />
          </div>
          {error ? (
            <p className="text-sm text-red-800" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-btn bg-ink px-4 py-2.5 text-sm font-medium text-canvas transition hover:bg-ink/90 disabled:opacity-60"
          >
            {submitting ? "Saving…" : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
