import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("announcement attachment interface", () => {
  it("offers multi-file selection, download links, and removal controls", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/pages/dashboard/Announcements.tsx"), "utf8");
    expect(source).toContain("Attach files");
    expect(source).toContain('type="file" multiple');
    expect(source).toContain("Download ${attachment.fileName}");
    expect(source).toContain("Delete ${attachment.fileName}");
    expect(source).toContain("Up to 10 files, 20 MB each.");
  });
});
