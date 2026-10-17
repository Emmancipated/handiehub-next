"use client";

import { Suspense } from "react";
import ShellLayout from "@/components/layout/ShellLayout";

export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <ShellLayout>{children}</ShellLayout>
    </Suspense>
  );
}
