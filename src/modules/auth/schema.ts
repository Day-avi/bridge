import { z } from "zod";

export const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address.")),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(72, "Password must be at most 72 characters.")
    .regex(/[a-zA-Z]/, "Password must include a letter.")
    .regex(/[0-9]/, "Password must include a number."),
});

export type FormState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "check-email"; email: string };

export const idleState: FormState = { status: "idle" };
