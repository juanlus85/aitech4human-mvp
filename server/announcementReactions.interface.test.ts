import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("announcement reactions interface", () => {
  it("offers visible heart and thumbs-up reactions with participant hover details on announcements and replies", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/pages/dashboard/Announcements.tsx"), "utf8");
    expect(source).toContain('emoji: "❤️"');
    expect(source).toContain('emoji: "👍"');
    expect(source).toContain("participantNames.join");
    expect(source).toContain("title={tooltip}");
    expect(source).toContain("<ReactionBar announcementId={ann.id}");
    expect(source).toContain("replyId={reply.id}");
  });
});
