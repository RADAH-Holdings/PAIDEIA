"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

import { fieldInputClass, fieldSelectClass, FormField } from "@/components/form-field";
import {
  ApiError,
  createAdminUser,
  deactivateAdminUser,
  listAdminUsers,
  type ListUsersParams,
} from "@/lib/api";
import type { AdminUser } from "@/lib/schemas";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<ListUsersParams["role"] | "">("");
  const [statusFilter, setStatusFilter] = useState<ListUsersParams["status"] | "">("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"teacher" | "student">("teacher");
  const [creating, setCreating] = useState(false);
  const [createMessage, setCreateMessage] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: ListUsersParams = {};
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;
      const data = await listAdminUsers(params);
      setUsers(data.results);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, [roleFilter, statusFilter]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setCreating(true);
    setCreateMessage(null);
    setError(null);
    try {
      await createAdminUser({ name: name.trim(), email: email.trim(), role });
      setName("");
      setEmail("");
      setCreateMessage("User created. A welcome email with a temporary password was sent.");
      await loadUsers();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create user.");
    } finally {
      setCreating(false);
    }
  }

  async function handleDeactivate(userId: string) {
    if (!confirm("Deactivate this user? They will not be able to sign in.")) return;
    try {
      await deactivateAdminUser(userId);
      await loadUsers();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not deactivate user.");
    }
  }

  return (
    <div className="space-y-10">
      <section className="rounded-card border border-ink/10 bg-white/50 p-6 shadow-sm">
        <h2 className="font-display text-xl font-semibold text-ink">Create user</h2>
        <p className="mt-1 text-sm text-ink/70">
          Teachers and students receive a temporary password by email and must set a new
          password on first sign-in.
        </p>
        <form onSubmit={handleCreate} className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block font-mono text-xs text-ink/70">Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-btn border border-ink/15 bg-canvas px-3 py-2 text-ink"
            />
          </div>
          <div>
            <label className="mb-1 block font-mono text-xs text-ink/70">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-btn border border-ink/15 bg-canvas px-3 py-2 text-ink"
            />
          </div>
          <div>
            <label className="mb-1 block font-mono text-xs text-ink/70">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "teacher" | "student")}
              className="w-full rounded-btn border border-ink/15 bg-canvas px-3 py-2 text-ink"
            >
              <option value="teacher">Teacher</option>
              <option value="student">Student</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={creating}
              className="rounded-btn bg-ink px-4 py-2 text-sm font-medium text-canvas hover:bg-ink/90 disabled:opacity-60"
            >
              {creating ? "Creating…" : "Create user"}
            </button>
          </div>
        </form>
        {createMessage ? <p className="mt-4 text-sm text-green-900">{createMessage}</p> : null}
      </section>

      <section className="rounded-card border border-ink/10 bg-white/50 p-6 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-display text-xl font-semibold text-ink">Users</h2>
          <div className="flex flex-wrap gap-3">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
              className="rounded-btn border border-ink/15 bg-canvas px-3 py-1.5 font-mono text-xs"
            >
              <option value="">All roles</option>
              <option value="admin">Admin</option>
              <option value="teacher">Teacher</option>
              <option value="student">Student</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="rounded-btn border border-ink/15 bg-canvas px-3 py-1.5 font-mono text-xs"
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {error ? (
          <p className="mt-4 text-sm text-red-800" role="alert">
            {error}
          </p>
        ) : null}

        {loading ? (
          <p className="mt-6 font-mono text-sm text-ink/60">Loading users…</p>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-ink/10 font-mono text-xs uppercase tracking-wide text-ink/60">
                  <th className="pb-3 pr-4">Name</th>
                  <th className="pb-3 pr-4">Email</th>
                  <th className="pb-3 pr-4">Role</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-ink/5">
                    <td className="py-3 pr-4 font-medium text-ink">{u.name}</td>
                    <td className="py-3 pr-4 text-ink/80">{u.email}</td>
                    <td className="py-3 pr-4 capitalize text-ink/80">{u.role}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={`font-mono text-xs ${
                          u.is_active ? "text-green-900" : "text-ink/50"
                        }`}
                      >
                        {u.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-3">
                      {u.is_active && u.role !== "admin" ? (
                        <button
                          type="button"
                          onClick={() => void handleDeactivate(u.id)}
                          className="rounded-btn border border-ink/20 px-2 py-1 text-xs text-ink hover:bg-ink/5"
                        >
                          Deactivate
                        </button>
                      ) : (
                        <span className="text-ink/30">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
