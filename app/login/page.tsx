"use client";

import { Suspense } from "react";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#071224]"><div className="text-white">Loading...</div></div>}>
      <LoginForm />
    </Suspense>
  );
}
