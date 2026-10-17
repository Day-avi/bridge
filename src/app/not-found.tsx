import Link from "next/link";

export default function NotFound() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="text-muted">
        This page doesn&apos;t exist, or you don&apos;t have access to it.
      </p>
      <Link href="/workspaces" className="text-accent underline">
        Go to your workspaces
      </Link>
    </section>
  );
}
