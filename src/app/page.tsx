import Link from "next/link";

export default function Home() {
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">From Reel to delivered order.</h1>
      <p className="max-w-xl text-muted">
        Bridge helps Instagram sellers reach the right buyers and see which content turns into
        delivered revenue.
      </p>
      <div className="flex gap-3">
        <Link
          href="/signup"
          className="rounded-md bg-accent px-4 py-2 font-medium text-accent-foreground"
        >
          Create an account
        </Link>
        <Link href="/login" className="rounded-md border border-border px-4 py-2 font-medium">
          Log in
        </Link>
      </div>
    </section>
  );
}
