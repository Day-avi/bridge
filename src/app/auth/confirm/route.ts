import type { EmailOtpType } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

const ALLOWED_TYPES: EmailOtpType[] = ["email", "signup"];

// A relative Location keeps the user on the host they clicked from. request.url
// can report an internal hostname, which would drop the fresh session cookie.
function redirectTo(path: string) {
  return new Response(null, { status: 303, headers: { Location: path } });
}

// Landing page for the link in the "Confirm your Bridge account" email.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (tokenHash && type && ALLOWED_TYPES.includes(type)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return redirectTo("/workspaces");
    console.error("Email confirmation failed", { code: error.code });
  }

  return redirectTo("/login?error=confirm");
}
