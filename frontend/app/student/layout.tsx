import type { ReactNode } from "react";

import { RoleShell } from "@/components/role-shell";

export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <RoleShell expectedRole="student" title="Learning">
      {children}
    </RoleShell>
  );
}
