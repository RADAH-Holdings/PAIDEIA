"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

import { getLoginErrorMessage, roleHomePath, useAuth } from "@/lib/auth";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await login(email.trim(), password);
      if (result.forcePasswordChange) {
        router.replace("/change-password");
        return;
      }
      const me = result.me;
      const next = searchParams?.get("next");
      const destination =
        next && next.startsWith(`/${me.role}`) ? next : roleHomePath(me.role);
      router.replace(destination);
    } catch (err) {
      setError(getLoginErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-md rounded-card border border-ink/10 bg-white/50 p-8 shadow-sm">
        <p className="font-mono text-xs uppercase tracking-widest text-ochre">Paideia</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Sign in</h1>
        <p className="mt-2 text-sm text-ink/70">
          Enter the credentials provided by your school administrator.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block font-mono text-xs text-ink/70">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-btn border border-ink/15 bg-canvas px-3 py-2 text-ink outline-none ring-ochre/40 focus:ring-2"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block font-mono text-xs text-ink/70">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-canvas">
          <p className="font-mono text-sm text-ink/60">Loading…</p>
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
