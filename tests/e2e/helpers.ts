import { randomUUID } from "node:crypto";

import { expect, type Page } from "@playwright/test";

// Mailpit catches every email the local Supabase sends.
const MAILPIT_URL = process.env.MAILPIT_URL ?? "http://127.0.0.1:54324";

export function uniqueEmail(label: string): string {
  return `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

// Generated per run so no fixed password sits in the repo (and the secret scan stays quiet).
export const PASSWORD = `test-${randomUUID()}-1`;

async function confirmationLink(email: string): Promise<string> {
  for (let attempt = 0; attempt < 30; attempt++) {
    const search = await fetch(
      `${MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(`to:"${email}"`)}`,
    );
    const { messages } = (await search.json()) as { messages: { ID: string }[] };
    if (messages.length > 0) {
      const message = await fetch(`${MAILPIT_URL}/api/v1/message/${messages[0].ID}`);
      const { HTML } = (await message.json()) as { HTML: string };
      const href = HTML.match(/href="([^"]*\/auth\/confirm[^"]*)"/)?.[1];
      if (!href) throw new Error("Confirmation email had no /auth/confirm link");
      return href.replaceAll("&amp;", "&");
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`No confirmation email arrived for ${email}`);
}

/** Signs up through the UI, opens the emailed link, and lands on /workspaces. */
export async function signUpAndConfirm(page: Page, email: string): Promise<void> {
  await page.goto("/signup");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("status")).toContainText("Check your email");

  await page.goto(await confirmationLink(email));
  await expect(page).toHaveURL(/\/workspaces$/);
}

export async function createWorkspace(page: Page, name: string): Promise<string> {
  await page.getByLabel("Business name").fill(name);
  await page.getByRole("button", { name: "Create workspace" }).click();
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
  return page.url();
}
