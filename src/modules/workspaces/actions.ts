"use server";

import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { workspaceNameSchema, type CreateWorkspaceState } from "./schema";

export async function createWorkspace(
  _prev: CreateWorkspaceState,
  formData: FormData,
): Promise<CreateWorkspaceState> {
  await requireUser();

  const parsed = workspaceNameSchema.safeParse(formData.get("name"));
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Check the name." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_workspace", { workspace_name: parsed.data });
  if (error || !data) {
    console.error("create_workspace failed", { code: error?.code, message: error?.message });
    return { status: "error", message: "Could not create the workspace. Please try again." };
  }

  redirect(`/w/${data.slug}`);
}
