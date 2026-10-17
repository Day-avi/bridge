import type { Metadata } from "next";

import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Create an account" };

export default function SignupPage() {
  return (
    <section className="mx-auto max-w-sm space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Create your Bridge account</h1>
      <SignupForm />
    </section>
  );
}
