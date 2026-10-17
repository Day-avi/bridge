"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { safeNextPath } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import { credentialsSchema, type FormState } from "./schema";

async function requestOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  // Supabase only honours this if it is on the project's redirect allow-list.
  return `${proto}://${host}`;
}

export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Check your details." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { emailRedirectTo: await requestOrigin() },
  });
  if (error) {
    return { status: "error", message: error.message };
  }
  // Supabase answers the same way for new and existing emails, so this never
  // reveals whether someone already has an account.
  return { status: "check-email", email: parsed.data.email };
}

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = credentialsSchema
    .pick({ email: true })
    .safeParse({ email: formData.get("email") });
  const password = formData.get("password");
  if (!parsed.success || typeof password !== "string" || password.length === 0) {
    return { status: "error", message: "Enter your email and password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password });
  if (error) {
    const message =
      error.code === "email_not_confirmed"
        ? "Please confirm your email first. Check your inbox for the link."
        : "Email or password is incorrect.";
    return { status: "error", message };
  }
  redirect(safeNextPath(formData.get("next")));
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
