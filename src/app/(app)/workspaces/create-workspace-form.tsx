"use client";

import { useActionState } from "react";

import { Field, FormError, SubmitButton } from "@/components/field";
import { createWorkspace } from "@/modules/workspaces/actions";
import type { CreateWorkspaceState } from "@/modules/workspaces/schema";

const initial: CreateWorkspaceState = { status: "idle" };

export function CreateWorkspaceForm() {
  const [state, action, pending] = useActionState(createWorkspace, initial);

  return (
    <form action={action} className="space-y-4">
      <Field
        label="Business name"
        name="name"
        placeholder="e.g. Asha Handlooms"
        maxLength={80}
        required
      />
      {state.status === "error" && <FormError message={state.message} />}
      <SubmitButton pending={pending}>Create workspace</SubmitButton>
    </form>
  );
}
