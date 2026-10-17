import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { requireUser } from "@/lib/auth";
import { getWorkspaceBySlug } from "@/modules/workspaces/queries";

const ACTION_LABELS: Record<string, string> = {
  "workspace.created": "Workspace created",
};

export default function WorkspacePage({ params }: PageProps<"/w/[slug]">) {
  return (
    <Suspense fallback={<p className="text-muted">Loading…</p>}>
      <Workspace params={params} />
    </Suspense>
  );
}

async function Workspace({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireUser();
  // Row-level security returns nothing for workspaces you are not a member of,
  // so another business's URL looks exactly like one that doesn't exist.
  const result = await getWorkspaceBySlug(slug, user.id);
  if (!result) notFound();

  const { workspace, memberCount, myRole, activity } = result;

  return (
    <section className="space-y-8">
      <div className="space-y-1">
        <Link href="/workspaces" className="text-sm text-muted underline">
          All workspaces
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">{workspace.name}</h1>
        <p className="text-sm text-muted">
          You are {myRole === "owner" ? "the owner" : "a member"} · {memberCount}{" "}
          {memberCount === 1 ? "person" : "people"}
        </p>
      </div>

      <div className="rounded-lg border border-dashed border-border p-5 text-muted">
        Connecting Instagram arrives in Phase 1.
      </div>

      <div className="space-y-2">
        <h2 className="font-semibold">Activity</h2>
        <ul className="space-y-1 text-sm">
          {activity.map((entry) => (
            <li key={entry.id} className="flex justify-between gap-4">
              <span>{ACTION_LABELS[entry.action] ?? entry.action}</span>
              <time className="text-muted" dateTime={entry.created_at}>
                {new Date(entry.created_at).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                  timeZone: "Asia/Kolkata",
                })}
              </time>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
