"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Field, FormError, SubmitButton } from "@/components/field";
import { signUp } from "@/modules/auth/actions";
import { idleState } from "@/modules/auth/schema";

export function SignupForm() {
  const [state, action, pending] = useActionState(signUp, idleState);

  if (state.status === "check-email") {
    return (
      <div role="status" className="space-y-2">
        <h2 className="text-lg font-semibold">Check your email</h2>
        <p className="text-muted">
          We sent a confirmation link to <strong>{state.email}</strong>. Open it to finish signing
          up.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <Field label="Email" name="email" type="email" autoComplete="email" required />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
      />
      <p className="text-xs text-muted">At least 8 characters, with a letter and a number.</p>
      {state.status === "error" && <FormError message={state.message} />}
      <SubmitButton pending={pending}>Create account</SubmitButton>
      <p className="text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-accent underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
