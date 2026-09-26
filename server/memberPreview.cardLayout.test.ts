import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("home member preview cards", () => {
  it("keeps long research-area labels within the researcher card", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");
    expect(source).toContain("overflow-hidden rounded-xl");
    expect(source).toContain("max-w-full min-w-0");
    expect(source).toContain("<span className=\"truncate\">{m.researchArea}</span>");
  });
});
