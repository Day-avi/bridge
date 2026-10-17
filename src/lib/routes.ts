export function isProtectedPath(pathname: string): boolean {
  return (
    pathname === "/workspaces" || pathname.startsWith("/workspaces/") || pathname.startsWith("/w/")
  );
}

// Only same-site paths are allowed after login, so a crafted link like
// /login?next=https://evil.example cannot bounce users to another site.
export function safeNextPath(next: unknown, fallback = "/workspaces"): string {
  if (typeof next !== "string") return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
