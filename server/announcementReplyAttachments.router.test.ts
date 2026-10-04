import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({
  createAnnouncementReply: vi.fn(),
  createAnnouncementAttachment: vi.fn(),
  deleteAnnouncementReply: vi.fn(),
  getAnnouncementReplyById: vi.fn(),
  getAnnouncementReplyAttachments: vi.fn(),
  storagePut: vi.fn(),
  storageDelete: vi.fn(),
}));

vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    createAnnouncementReply: mocks.createAnnouncementReply,
    createAnnouncementAttachment: mocks.createAnnouncementAttachment,
    deleteAnnouncementReply: mocks.deleteAnnouncementReply,
    getAnnouncementReplyById: mocks.getAnnouncementReplyById,
    getAnnouncementReplyAttachments: mocks.getAnnouncementReplyAttachments,
  };
});

vi.mock("./storage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./storage")>();
  return { ...actual, storagePut: mocks.storagePut, storageDelete: mocks.storageDelete };
});

import { appRouter } from "./routers";

function createContext(userId = 4, role: "member" | "admin" = "member"): TrpcContext {
  return {
    user: {
      id: userId,
      name: "Reply Author",
      email: "reply@example.org",
      passwordHash: "hashed",
      role,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { headers: {}, cookies: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

const attachment = {
  base64: Buffer.from("reply-file").toString("base64"),
  fileName: "comments.pdf",
  mimeType: "application/pdf",
  fileSize: 10,
};

describe("announcement reply attachments", () => {
  beforeEach(() => {
    mocks.createAnnouncementReply.mockReset().mockResolvedValue({ id: 81, announcementId: 15, authorId: 4, body: "Attached comments" });
    mocks.createAnnouncementAttachment.mockReset().mockResolvedValue({ id: 99 });
    mocks.deleteAnnouncementReply.mockReset().mockResolvedValue(undefined);
    mocks.getAnnouncementReplyById.mockReset().mockResolvedValue({ id: 81, announcementId: 15, authorId: 4 });
    mocks.getAnnouncementReplyAttachments.mockReset().mockResolvedValue([{ id: 99, replyId: 81, fileKey: "announcements/15/replies/81/comments.pdf" }]);
    mocks.storagePut.mockReset().mockResolvedValue({ key: "announcements/15/replies/81/100-comments.pdf", url: "/uploads/comments.pdf" });
    mocks.storageDelete.mockReset().mockResolvedValue(undefined);
  });

  it("stores attachments alongside a new announcement reply", async () => {
    const caller = appRouter.createCaller(createContext());
    await caller.announcements.reply({ announcementId: 15, body: "Attached comments", attachments: [attachment] });

    expect(mocks.createAnnouncementReply).toHaveBeenCalledWith({ announcementId: 15, authorId: 4, body: "Attached comments" });
    expect(mocks.storagePut).toHaveBeenCalledWith(expect.stringMatching(/^announcements\/15\/replies\/81\//), Buffer.from("reply-file"), "application/pdf");
    expect(mocks.createAnnouncementAttachment).toHaveBeenCalledWith(expect.objectContaining({
      announcementId: 15,
      replyId: 81,
      fileName: "comments.pdf",
      fileUrl: "/uploads/comments.pdf",
    }));
  });

  it("removes a reply attachment's physical file when the reply author deletes the reply", async () => {
    const caller = appRouter.createCaller(createContext());
    await caller.announcements.deleteReply({ id: 81 });

    expect(mocks.deleteAnnouncementReply).toHaveBeenCalledWith(81);
    expect(mocks.storageDelete).toHaveBeenCalledWith("announcements/15/replies/81/comments.pdf");
  });

  it("prevents another member from deleting a reply and its attachments", async () => {
    mocks.getAnnouncementReplyById.mockResolvedValue({ id: 81, announcementId: 15, authorId: 4 });
    const caller = appRouter.createCaller(createContext(7));
    await expect(caller.announcements.deleteReply({ id: 81 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(mocks.storageDelete).not.toHaveBeenCalled();
  });
});
