import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const logoPath = "/uploads/aitech4human-logo.png";

describe("central platform logo", () => {
  it("ships the supplied logo asset and uses it across public and private entry points", () => {
    expect(existsSync(resolve(process.cwd(), "uploads/aitech4human-logo.png"))).toBe(true);
    for (const sourcePath of [
      "client/src/components/PublicHeader.tsx",
      "client/src/pages/Login.tsx",
      "client/src/components/DashboardLayout.tsx",
    ]) {
      expect(readFileSync(resolve(process.cwd(), sourcePath), "utf8")).toContain(logoPath);
    }
  });
});
