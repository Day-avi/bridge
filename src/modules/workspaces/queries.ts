import "server-only";

import { createClient } from "@/lib/supabase/server";

// Every query here runs as the signed-in user, so row-level security decides
// what comes back. Never swap in the secret key to "make a query work".

export async function listMyWorkspaces() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workspaces")
    .select("id, name, slug, created_at")
    .order("created_at", { ascending: true })
    .limit(100);
  if (error) throw new Error(`Could not load workspaces: ${error.message}`, { cause: error });
  return data;
}

export async function getWorkspaceBySlug(slug: string, userId: string) {
  const supabase = await createClient();
  const { data: workspace, error } = await supabase
    .from("workspaces")
    .select("id, name, slug, created_at")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`Could not load workspace: ${error.message}`, { cause: error });
  if (!workspace) return null;

  const [members, activity] = await Promise.all([
    supabase.from("members").select("user_id, role").eq("workspace_id", workspace.id),
    supabase
      .from("audit_log")
      .select("id, action, created_at")
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);
  if (members.error) throw new Error(`Could not load members: ${members.error.message}`);
  if (activity.error) throw new Error(`Could not load activity: ${activity.error.message}`);

  const myRole = members.data.find((m) => m.user_id === userId)?.role ?? null;
  return { workspace, memberCount: members.data.length, myRole, activity: activity.data };
}
