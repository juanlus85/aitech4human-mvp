import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({
  createAnnouncement: vi.fn(),
  getAnnouncementById: vi.fn(),
  createAnnouncementAttachment: vi.fn(),
  getAnnouncementAttachments: vi.fn(),
  getAnnouncementAttachmentById: vi.fn(),
  deleteAnnouncementAttachment: vi.fn(),
  deleteAnnouncement: vi.fn(),
  storagePut: vi.fn(),
  storageDelete: vi.fn(),
}));

vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    createAnnouncement: mocks.createAnnouncement,
    getAnnouncementById: mocks.getAnnouncementById,
    createAnnouncementAttachment: mocks.createAnnouncementAttachment,
    getAnnouncementAttachments: mocks.getAnnouncementAttachments,
    getAnnouncementAttachmentById: mocks.getAnnouncementAttachmentById,
    deleteAnnouncementAttachment: mocks.deleteAnnouncementAttachment,
    deleteAnnouncement: mocks.deleteAnnouncement,
  };
});

vi.mock("./storage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./storage")>();
  return { ...actual, storagePut: mocks.storagePut, storageDelete: mocks.storageDelete };
});

import { appRouter } from "./routers";

function createContext(userId = 1, role: "member" | "admin" = "member"): TrpcContext {
  return {
    user: {
      id: userId,
      name: "Announcement Author",
      email: "author@example.org",
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

const attachmentInput = {
  base64: Buffer.from("test-file").toString("base64"),
  fileName: "work plan.pdf",
  mimeType: "application/pdf",
  fileSize: 9,
};

describe("announcement attachments", () => {
  beforeEach(() => {
    mocks.createAnnouncement.mockReset().mockResolvedValue({ id: 41, subject: "Work plan", body: "Please review." });
    mocks.getAnnouncementById.mockReset().mockResolvedValue({ id: 41, authorId: 1, subject: "Work plan" });
    mocks.createAnnouncementAttachment.mockReset().mockResolvedValue({ id: 83 });
    mocks.getAnnouncementAttachments.mockReset().mockResolvedValue([{ id: 83, announcementId: 41, fileKey: "announcements/41/work_plan.pdf" }]);
    mocks.getAnnouncementAttachmentById.mockReset().mockResolvedValue({ id: 83, announcementId: 41, fileKey: "announcements/41/work_plan.pdf" });
    mocks.deleteAnnouncementAttachment.mockReset().mockResolvedValue(undefined);
    mocks.deleteAnnouncement.mockReset().mockResolvedValue(undefined);
    mocks.storagePut.mockReset().mockResolvedValue({ key: "announcements/41/100-work_plan.pdf", url: "/uploads/announcement_work_plan.pdf" });
    mocks.storageDelete.mockReset().mockResolvedValue(undefined);
  });

  it("stores selected files with a new announcement", async () => {
    const caller = appRouter.createCaller(createContext());
    await caller.announcements.create({ subject: "Work plan", body: "Please review.", attachments: [attachmentInput] });

    expect(mocks.createAnnouncement).toHaveBeenCalledWith(expect.objectContaining({ authorId: 1, subject: "Work plan" }));
    expect(mocks.storagePut).toHaveBeenCalledWith(expect.stringMatching(/^announcements\/41\//), Buffer.from("test-file"), "application/pdf");
    expect(mocks.createAnnouncementAttachment).toHaveBeenCalledWith(expect.objectContaining({
      announcementId: 41,
      fileName: "work plan.pdf",
      fileKey: "announcements/41/100-work_plan.pdf",
      fileUrl: "/uploads/announcement_work_plan.pdf",
      fileSize: 9,
    }));
  });

  it("lets the announcement owner remove one attachment and its physical file", async () => {
    const caller = appRouter.createCaller(createContext());
    await caller.announcements.deleteAttachment({ id: 83 });

    expect(mocks.deleteAnnouncementAttachment).toHaveBeenCalledWith(83);
    expect(mocks.storageDelete).toHaveBeenCalledWith("announcements/41/work_plan.pdf");
  });

  it("removes all physical files when the announcement is deleted", async () => {
    const caller = appRouter.createCaller(createContext());
    await caller.announcements.delete({ id: 41 });

    expect(mocks.deleteAnnouncement).toHaveBeenCalledWith(41);
    expect(mocks.storageDelete).toHaveBeenCalledWith("announcements/41/work_plan.pdf");
  });

  it("prevents another member from deleting an attachment", async () => {
    const caller = appRouter.createCaller(createContext(2));
    await expect(caller.announcements.deleteAttachment({ id: 83 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(mocks.storageDelete).not.toHaveBeenCalled();
  });
});
