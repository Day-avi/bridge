import { z } from "zod";

export const workspaceNameSchema = z
  .string()
  .trim()
  .min(1, "Give your workspace a name.")
  .max(80, "Keep the name under 80 characters.");

export type CreateWorkspaceState = { status: "idle" } | { status: "error"; message: string };
