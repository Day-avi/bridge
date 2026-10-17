import "server-only";

import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

export type CurrentUser = { id: string; email: string | null };

// The data access layer for "who is signed in". getClaims verifies the JWT
// signature; never trust getSession() for this on the server.
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  // Token checks read the clock, so this must run per request, never in a
  // prerender or prefetch.
  await connection();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;
  const email = typeof data.claims.email === "string" ? data.claims.email : null;
  return { id: data.claims.sub, email };
});

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
