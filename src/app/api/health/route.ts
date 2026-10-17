import { connection } from "next/server";

export async function GET() {
  await connection();
  return Response.json({
    status: "ok",
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local",
  });
}
