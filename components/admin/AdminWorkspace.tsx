"use client";

import { type ReactNode } from "react";
import AdminGate from "./AdminGate";
import AdminShell from "./AdminShell";

type AdminWorkspaceProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export default function AdminWorkspace({
  eyebrow,
  title,
  description,
  children,
}: AdminWorkspaceProps) {
  return (
    <AdminGate>
      <AdminShell eyebrow={eyebrow} title={title} description={description}>
        {children}
      </AdminShell>
    </AdminGate>
  );
}
