import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({
  getMessageById: vi.fn(),
  getMessageRecipients: vi.fn(),
  deleteMessageForUser: vi.fn(),
}));

vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    getMessageById: mocks.getMessageById,
    getMessageRecipients: mocks.getMessageRecipients,
    deleteMessageForUser: mocks.deleteMessageForUser,
  };
});

import { appRouter } from "./routers";
import { getNotificationNavigationTarget } from "../client/src/lib/notificationNavigation";

function createContext(userId: number): TrpcContext {
  return {
    user: {
      id: userId,
      email: `member${userId}@example.org`,
      passwordHash: "hashed",
      name: "Member User",
      role: "member",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {}, cookies: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("message maintenance", () => {
  beforeEach(() => {
    mocks.getMessageById.mockReset().mockResolvedValue({ id: 42, senderId: 1, recipientId: 8, subject: "Project update" });
    mocks.getMessageRecipients.mockReset().mockResolvedValue([{ userId: 8, name: "Recipient" }]);
    mocks.deleteMessageForUser.mockReset().mockResolvedValue(undefined);
  });

  it("removes a message only from the current recipient mailbox", async () => {
    const caller = appRouter.createCaller(createContext(8));
    await expect(caller.messages.remove({ id: 42 })).resolves.toEqual({ success: true });
    expect(mocks.deleteMessageForUser).toHaveBeenCalledWith(42, 8);
  });

  it("does not allow an unrelated user to remove a message", async () => {
    const caller = appRouter.createCaller(createContext(9));
    await expect(caller.messages.remove({ id: 42 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(mocks.deleteMessageForUser).not.toHaveBeenCalled();
  });

  it("maps a message notification to the exact message route and ignores unrelated notifications", () => {
    expect(getNotificationNavigationTarget({ type: "message", relatedModule: "messages", relatedId: 42 }))
      .toBe("/dashboard/messages?message=42");
    expect(getNotificationNavigationTarget({ type: "meeting", relatedModule: "meetings", relatedId: 7 })).toBeNull();
  });
});
