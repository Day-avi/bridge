"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";

import { Field, FormError, SubmitButton } from "@/components/field";
import { signIn } from "@/modules/auth/actions";
import { idleState } from "@/modules/auth/schema";

export function LoginForm() {
  const searchParams = useSearchParams();
  const [state, action, pending] = useActionState(signIn, idleState);
  const confirmFailed = searchParams.get("error") === "confirm";

  return (
    <form action={action} className="space-y-4">
      {confirmFailed && (
        <FormError message="That confirmation link is invalid or has expired. Log in, or sign up again to get a new link." />
      )}
      <input type="hidden" name="next" value={searchParams.get("next") ?? ""} />
      <Field label="Email" name="email" type="email" autoComplete="email" required />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
      />
      {state.status === "error" && <FormError message={state.message} />}
      <SubmitButton pending={pending}>Log in</SubmitButton>
      <p className="text-sm text-muted">
        New to Bridge?{" "}
        <Link href="/signup" className="text-accent underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
