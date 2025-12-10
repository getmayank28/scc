"use client";

import ChangePasswordComp from "@/components/ChangePasswordComp/ChangePasswordComp";
import { Suspense } from "react";

export default function ChangePasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChangePasswordComp />
    </Suspense>
  );
}