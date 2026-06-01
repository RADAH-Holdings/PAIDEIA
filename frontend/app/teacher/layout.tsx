import type { ReactNode } from "react";

import { RoleShell } from "@/components/role-shell";

export default function TeacherLayout({ children }: { children: ReactNode }) {
  return (
    <RoleShell expectedRole="teacher" title="Teaching">
      {children}
    </RoleShell>
  );
}
