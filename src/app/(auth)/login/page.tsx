import type { Metadata } from "next";
import { Suspense } from "react";

import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <section className="mx-auto max-w-sm space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Log in to Bridge</h1>
      {/* The form reads ?next= and ?error= from the URL, which is only known per request. */}
      <Suspense>
        <LoginForm />
      </Suspense>
    </section>
  );
}
