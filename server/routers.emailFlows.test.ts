import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({
  createMessage: vi.fn(),
  createMessageAttachment: vi.fn(),
  createMeeting: vi.fn(),
  createDateOption: vi.fn(),
  getAllUsers: vi.fn(),
  storagePut: vi.fn(),
  createAndEmailNotification: vi.fn(),
}));

vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    createMessage: mocks.createMessage,
    createMessageAttachment: mocks.createMessageAttachment,
    createMeeting: mocks.createMeeting,
    createDateOption: mocks.createDateOption,
    getAllUsers: mocks.getAllUsers,
  };
});

vi.mock("./storage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./storage")>();
  return { ...actual, storagePut: mocks.storagePut };
});

vi.mock("./notificationEmail", () => ({
  createAndEmailNotification: mocks.createAndEmailNotification,
}));

import { appRouter } from "./routers";

function createContext(userId = 1): TrpcContext {
  return {
    user: {
      id: userId,
      email: "sender@example.org",
      passwordHash: "hashed",
      name: "Sender User",
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

describe("email-triggering router flows", () => {
  beforeEach(() => {
    mocks.createMessage.mockReset().mockResolvedValue({ id: 42 });
    mocks.createMessageAttachment.mockReset().mockResolvedValue(undefined);
    mocks.createMeeting.mockReset().mockResolvedValue({ id: 16 });
    mocks.createDateOption.mockReset().mockResolvedValue(undefined);
    mocks.getAllUsers.mockReset().mockResolvedValue([
      { id: 1, email: "sender@example.org", isActive: true },
      { id: 8, email: "member@example.org", isActive: true },
    ]);
    mocks.storagePut.mockReset().mockResolvedValue({ url: "/uploads/messages/proposal.pdf" });
    mocks.createAndEmailNotification.mockReset().mockResolvedValue(undefined);
  });

  it("uploads message attachments before triggering its internal and email notification", async () => {
    const caller = appRouter.createCaller(createContext());

    await caller.messages.send({
      recipientId: 8,
      subject: "Research proposal",
      body: "Please review the attached proposal.",
      attachments: [{
        base64: Buffer.from("test-pdf").toString("base64"),
        fileName: "proposal.pdf",
        mimeType: "application/pdf",
        fileSize: 8,
      }],
    });

    expect(mocks.createMessage).toHaveBeenCalledWith({
      recipientId: 8,
      subject: "Research proposal",
      body: "Please review the attached proposal.",
      senderId: 1,
    });
    expect(mocks.storagePut).toHaveBeenCalledOnce();
    expect(mocks.createMessageAttachment).toHaveBeenCalledWith(expect.objectContaining({
      messageId: 42,
      fileName: "proposal.pdf",
      fileUrl: "/uploads/messages/proposal.pdf",
    }));
    expect(mocks.createAndEmailNotification).toHaveBeenCalledWith(expect.objectContaining({
      userId: 8,
      type: "message",
      relatedModule: "messages",
      relatedId: 42,
    }), expect.objectContaining({
      kind: "message",
      messageId: 42,
      attachments: [{ fileName: "proposal.pdf", fileUrl: "/uploads/messages/proposal.pdf" }],
    }));
  });

  it("creates a complete meeting notification and email for every other member", async () => {
    const caller = appRouter.createCaller(createContext());

    await caller.meetings.create({
      title: "Research coordination",
      type: "fixed",
      modality: "hybrid",
      fixedDate: new Date("2026-10-01T09:00:00.000Z"),
      location: "Research room",
      meetingLink: "https://meet.example.org/coordination",
      agenda: "Review work packages",
      description: "Quarterly coordination session",
    });

    expect(mocks.createAndEmailNotification).toHaveBeenCalledTimes(1);
    const [notification, email] = mocks.createAndEmailNotification.mock.calls[0];
    expect(notification).toMatchObject({
      userId: 8,
      type: "meeting",
      title: "New meeting created",
      relatedModule: "meetings",
      relatedId: 16,
    });
    expect(notification.body).toContain("Location: Research room");
    expect(notification.body).toContain("Agenda: Review work packages");
    expect(notification.body).toContain("Description: Quarterly coordination session");
    expect(email).toEqual({
      kind: "notification",
      link: "https://research.blancoguzman.es/dashboard/meetings",
    });
  });
});
