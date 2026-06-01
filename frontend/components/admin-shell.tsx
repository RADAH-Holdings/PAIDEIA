"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useAuth } from "@/lib/auth";

const NAV = [{ href: "/admin/users", label: "Users" }];

export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    if (loading || !user) return;
    if (user.role !== "admin") {
      router.replace(`/${user.role}`);
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <p className="font-mono text-sm text-ink/60">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-canvas">
      <aside className="flex w-[260px] shrink-0 flex-col bg-ink text-canvas">
        <div className="border-b border-canvas/10 px-6 py-6">
          <p className="font-mono text-xs uppercase tracking-widest text-ochre">Paideia</p>
          <p className="mt-1 font-display text-lg font-semibold">{user.school.name}</p>
        </div>
        <nav className="flex-1 px-3 py-4">
          <p className="px-3 font-mono text-[10px] uppercase tracking-widest text-canvas/50">
            Administration
          </p>
          <ul className="mt-2 space-y-1">
            {NAV.map((item) => {
              const active =
                pathname === item.href ||
                (pathname?.startsWith(`${item.href}/`) ?? false);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`block rounded-btn px-3 py-2 text-sm transition ${
                      active
                        ? "border-l-2 border-ochre bg-canvas/10 pl-[10px] font-medium"
                        : "text-canvas/80 hover:bg-canvas/5 hover:text-canvas"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="border-t border-canvas/10 px-6 py-4">
          <p className="truncate font-mono text-xs text-canvas/70">{user.email}</p>
          <button
            type="button"
            onClick={() => {
              logout();
              router.push("/sign-in");
            }}
            className="mt-3 rounded-btn border border-canvas/25 px-3 py-1.5 text-xs text-canvas/90 hover:bg-canvas/10"
          >
            Sign out
          </button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-ink/10 bg-parchment-deep/30 px-8 py-5">
          <h1 className="font-display text-2xl font-semibold text-ink">Administration</h1>
        </header>
        <main className="flex-1 px-8 py-8">{children}</main>
      </div>
    </div>
  );
}
