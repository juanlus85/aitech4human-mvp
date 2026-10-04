import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("reply attachment interface", () => {
  it("exposes file selection and downloads for announcement and message replies", () => {
    const announcements = readFileSync(resolve(process.cwd(), "client/src/pages/dashboard/Announcements.tsx"), "utf8");
    const messages = readFileSync(resolve(process.cwd(), "client/src/pages/dashboard/Messages.tsx"), "utf8");

    expect(announcements).toContain("replyAttachments");
    expect(announcements).toContain("announcement-reply-${announcementId}-attachments");
    expect(announcements).toContain("reply.attachments");
    expect(messages).toContain("replyPendingAttachments");
    expect(messages).toContain("Attach files");
    expect(messages).toContain("attachments: replyPendingAttachments.map");
  });
});
