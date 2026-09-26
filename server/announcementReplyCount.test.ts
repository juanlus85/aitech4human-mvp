import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("announcement reply count", () => {
  it("returns and displays a singular or plural reply count in the announcement list", () => {
    const dbSource = readFileSync(resolve(process.cwd(), "server/db.ts"), "utf8");
    const uiSource = readFileSync(resolve(process.cwd(), "client/src/pages/dashboard/Announcements.tsx"), "utf8");

    expect(dbSource).toContain("replyCount: sql<number>");
    expect(dbSource).toContain("SELECT COUNT(*) FROM ${announcementReplies}");
    expect(uiSource).toContain("Reply (${replyCount}");
    expect(uiSource).toContain('replyCount === 1 ? "reply" : "replies"');
    expect(uiSource).toContain("utils.announcements.list.invalidate()");
  });
});
