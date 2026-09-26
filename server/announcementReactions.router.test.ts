import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({
  getAnnouncementById: vi.fn(),
  getAnnouncementReplies: vi.fn(),
  getAnnouncementReaction: vi.fn(),
  createAnnouncementReaction: vi.fn(),
  deleteAnnouncementReaction: vi.fn(),
}));

vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    getAnnouncementById: mocks.getAnnouncementById,
    getAnnouncementReplies: mocks.getAnnouncementReplies,
    getAnnouncementReaction: mocks.getAnnouncementReaction,
    createAnnouncementReaction: mocks.createAnnouncementReaction,
    deleteAnnouncementReaction: mocks.deleteAnnouncementReaction,
  };
});

import { appRouter } from "./routers";

function createContext(userId = 7): TrpcContext {
  return {
    user: {
      id: userId,
      name: "Reaction Member",
      email: "member@example.org",
      passwordHash: "hashed",
      role: "member",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { headers: {}, cookies: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("announcement reactions", () => {
  beforeEach(() => {
    mocks.getAnnouncementById.mockReset().mockResolvedValue({ id: 15, authorId: 1, subject: "Workshop" });
    mocks.getAnnouncementReplies.mockReset().mockResolvedValue([{ id: 28, announcementId: 15 }]);
    mocks.getAnnouncementReaction.mockReset().mockResolvedValue(null);
    mocks.createAnnouncementReaction.mockReset().mockResolvedValue(undefined);
    mocks.deleteAnnouncementReaction.mockReset().mockResolvedValue(undefined);
  });

  it("adds a heart to an announcement for the current member", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.announcements.toggleReaction({ announcementId: 15, reactionType: "heart" })).resolves.toEqual({ active: true });
    expect(mocks.createAnnouncementReaction).toHaveBeenCalledWith({
      targetType: "announcement",
      targetId: 15,
      userId: 7,
      reactionType: "heart",
    });
  });

  it("removes the same reaction when the member presses it again", async () => {
    mocks.getAnnouncementReaction.mockResolvedValue({ id: 91 });
    const caller = appRouter.createCaller(createContext());
    await expect(caller.announcements.toggleReaction({ announcementId: 15, reactionType: "thumbs_up" })).resolves.toEqual({ active: false });
    expect(mocks.deleteAnnouncementReaction).toHaveBeenCalledWith(91);
    expect(mocks.createAnnouncementReaction).not.toHaveBeenCalled();
  });

  it("records a reaction on a reply only when it belongs to the announcement", async () => {
    const caller = appRouter.createCaller(createContext());
    await caller.announcements.toggleReaction({ announcementId: 15, replyId: 28, reactionType: "thumbs_up" });
    expect(mocks.createAnnouncementReaction).toHaveBeenCalledWith(expect.objectContaining({ targetType: "reply", targetId: 28 }));
  });

  it("rejects a reply from another announcement", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.announcements.toggleReaction({ announcementId: 15, replyId: 99, reactionType: "heart" })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
