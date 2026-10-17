import { describe, expect, it } from "vitest";

import { credentialsSchema } from "@/modules/auth/schema";
import { workspaceNameSchema } from "@/modules/workspaces/schema";

describe("credentialsSchema", () => {
  it("normalises the email", () => {
    const parsed = credentialsSchema.parse({ email: "  Asha@Example.COM ", password: "silk2026" });
    expect(parsed.email).toBe("asha@example.com");
  });

  it.each([
    ["short1", "at least 8"],
    ["onlyletters", "number"],
    ["12345678", "letter"],
  ])("rejects weak password %s", (password, hint) => {
    const result = credentialsSchema.safeParse({ email: "a@b.co", password });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain(hint);
  });

  it("rejects a bad email", () => {
    expect(credentialsSchema.safeParse({ email: "nope", password: "silk2026" }).success).toBe(
      false,
    );
  });
});

describe("workspaceNameSchema", () => {
  it("trims the name", () => {
    expect(workspaceNameSchema.parse("  Asha Handlooms  ")).toBe("Asha Handlooms");
  });

  it.each(["", "   ", "x".repeat(81)])("rejects %j", (name) => {
    expect(workspaceNameSchema.safeParse(name).success).toBe(false);
  });
});
