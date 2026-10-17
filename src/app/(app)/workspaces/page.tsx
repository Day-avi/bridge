import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { requireUser } from "@/lib/auth";
import { listMyWorkspaces } from "@/modules/workspaces/queries";
import { SignOutButton } from "../sign-out-button";
import { CreateWorkspaceForm } from "./create-workspace-form";

export const metadata: Metadata = { title: "Your workspaces" };

export default function WorkspacesPage() {
  return (
    <section className="space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight">Your workspaces</h1>
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        <WorkspaceList />
      </Suspense>
      <div className="max-w-sm space-y-3 rounded-lg border border-border bg-surface p-5">
        <h2 className="font-semibold">Add a business</h2>
        <p className="text-sm text-muted">
          A workspace holds one business and its Instagram account.
        </p>
        <CreateWorkspaceForm />
      </div>
    </section>
  );
}

async function WorkspaceList() {
  const user = await requireUser();
  const workspaces = await listMyWorkspaces();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-muted">
        <span>Signed in as {user.email}</span>
        <SignOutButton />
      </div>
      {workspaces.length === 0 ? (
        <p className="text-muted">You don&apos;t have a workspace yet. Create one below.</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
          {workspaces.map((ws) => (
            <li key={ws.id}>
              <Link
                href={`/w/${ws.slug}`}
                className="block px-4 py-3 font-medium hover:bg-background"
              >
                {ws.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
