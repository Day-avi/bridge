import { expect, test } from "@playwright/test";

import { createWorkspace, PASSWORD, signUpAndConfirm, uniqueEmail } from "./helpers";

test("a new seller signs up, confirms their email and creates a workspace", async ({ page }) => {
  const email = uniqueEmail("asha");
  await signUpAndConfirm(page, email);
  await expect(page.getByText(`Signed in as ${email}`)).toBeVisible();

  await createWorkspace(page, "Asha Handlooms");
  await expect(page.getByText("You are the owner")).toBeVisible();
  await expect(page.getByText("Workspace created")).toBeVisible();

  await page.getByRole("link", { name: "All workspaces" }).click();
  await expect(page.getByRole("link", { name: "Asha Handlooms" })).toBeVisible();
});

test("one seller cannot open another seller's workspace", async ({ browser }) => {
  const asha = await browser.newPage();
  await signUpAndConfirm(asha, uniqueEmail("asha"));
  const ashaWorkspaceUrl = await createWorkspace(asha, "Asha Handlooms");

  const ben = await (await browser.newContext()).newPage();
  await signUpAndConfirm(ben, uniqueEmail("ben"));
  await expect(ben.getByRole("link", { name: "Asha Handlooms" })).toHaveCount(0);

  await ben.goto(ashaWorkspaceUrl);
  await expect(ben.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await expect(ben.getByText("Asha Handlooms")).toHaveCount(0);
});

test("signed-out visitors are sent to log in, then back where they were going", async ({
  page,
}) => {
  const email = uniqueEmail("chitra");
  await signUpAndConfirm(page, email);
  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/login$/);

  await page.goto("/workspaces");
  await expect(page).toHaveURL(/\/login\?next=%2Fworkspaces$/);

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/workspaces$/);
});

test("a wrong password is refused without saying whether the account exists", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(uniqueEmail("nobody"));
  await page.getByLabel("Password").fill("wrongpass1");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByText("Email or password is incorrect.")).toBeVisible();
});

test("health check responds", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.ok()).toBe(true);
  expect(await response.json()).toMatchObject({ status: "ok" });
});
