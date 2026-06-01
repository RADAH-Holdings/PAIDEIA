"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useAuth } from "@/lib/auth";
import type { Me } from "@/lib/schemas";

type RoleShellProps = {
  expectedRole: Me["role"];
  title: string;
  children?: ReactNode;
};

export function RoleShell({ expectedRole, title, children }: RoleShellProps) {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    if (loading || !user) return;
    if (user.role !== expectedRole) {
      router.replace(`/${user.role}`);
    }
  }, [user, loading, expectedRole, router]);

  if (loading || !user || user.role !== expectedRole) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <p className="font-mono text-sm text-ink/60">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-ink/10 bg-parchment-deep/40">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-ochre">Paideia</p>
            <h1 className="font-display text-2xl font-semibold text-ink">{title}</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono text-xs text-ink/70">{user.email}</span>
            <button
              type="button"
              onClick={() => {
                logout();
                router.push("/sign-in");
              }}
              className="rounded-btn border border-ink/20 px-3 py-1.5 text-sm text-ink hover:bg-ink/5"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">
        {children ?? (
          <div className="rounded-card border border-ink/10 bg-white/40 p-8 shadow-sm">
            <p className="text-ink/80">
              Wave 1 shell — {expectedRole} workspace. Course and session features arrive in later
              waves.
            </p>
            <p className="mt-4 font-mono text-xs text-ink/50">
              School: {user.school.name}
            </p>
          </div>
        )}
      </main>
      <footer className="mx-auto max-w-5xl px-6 pb-8">
        <Link href="/sign-in" className="font-mono text-xs text-ink/40 hover:text-ink">
          Switch account
        </Link>
      </footer>
    </div>
  );
}
