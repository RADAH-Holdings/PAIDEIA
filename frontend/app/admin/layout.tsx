import type { ReactNode } from "react";

import { RoleShell } from "@/components/role-shell";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <RoleShell expectedRole="admin" title="Administration">
      {children}
    </RoleShell>
  );
}
