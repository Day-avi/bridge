import { describe, expect, it } from "vitest";

import { isProtectedPath, safeNextPath } from "@/lib/routes";

describe("safeNextPath", () => {
  it("keeps same-site paths", () => {
    expect(safeNextPath("/w/asha-handlooms-1a2b3c")).toBe("/w/asha-handlooms-1a2b3c");
  });

  it.each(["https://evil.example", "//evil.example", "/\\evil.example", "workspaces", "", null])(
    "rejects %s",
    (value) => {
      expect(safeNextPath(value)).toBe("/workspaces");
    },
  );
});

describe("isProtectedPath", () => {
  it.each(["/workspaces", "/workspaces/new", "/w/abc"])("protects %s", (path) => {
    expect(isProtectedPath(path)).toBe(true);
  });

  it.each(["/", "/login", "/signup", "/auth/confirm", "/workspacesX", "/w"])(
    "leaves %s public",
    (path) => {
      expect(isProtectedPath(path)).toBe(false);
    },
  );
});
