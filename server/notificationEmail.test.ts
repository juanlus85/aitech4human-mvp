import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createNotification: vi.fn(),
  getUserById: vi.fn(),
  sendMessageEmail: vi.fn(),
  sendNotificationEmail: vi.fn(),
}));

vi.mock("./db", () => ({
  createNotification: mocks.createNotification,
  getUserById: mocks.getUserById,
}));

vi.mock("./email", () => ({
  sendMessageEmail: mocks.sendMessageEmail,
  sendNotificationEmail: mocks.sendNotificationEmail,
}));

import { createAndEmailNotification } from "./notificationEmail";

describe("createAndEmailNotification", () => {
  beforeEach(() => {
    mocks.createNotification.mockReset().mockResolvedValue(undefined);
    mocks.getUserById.mockReset().mockResolvedValue({ id: 8, email: "member@example.org", isActive: true });
    mocks.sendMessageEmail.mockReset().mockResolvedValue(true);
    mocks.sendNotificationEmail.mockReset().mockResolvedValue(true);
  });

  it("creates the internal message notification and sends its body, attachments and direct link data", async () => {
    await createAndEmailNotification({
      userId: 8,
      type: "message",
      title: "New message",
      body: 'You have a new message: "Research plan"',
      relatedModule: "messages",
      relatedId: 42,
    }, {
      kind: "message",
      senderName: "Researcher One",
      subject: "Research plan",
      messageBody: "Please review the attached proposal.",
      messageId: 42,
      attachments: [{ fileName: "proposal.pdf", fileUrl: "/uploads/messages/proposal.pdf" }],
    });

    expect(mocks.createNotification).toHaveBeenCalledOnce();
    expect(mocks.sendMessageEmail).toHaveBeenCalledWith({
      to: "member@example.org",
      senderName: "Researcher One",
      subject: "Research plan",
      body: "Please review the attached proposal.",
      messageId: 42,
      attachments: [{ fileName: "proposal.pdf", fileUrl: "/uploads/messages/proposal.pdf" }],
    });
    expect(mocks.sendNotificationEmail).not.toHaveBeenCalled();
  });

  it("sends a matching email for a general internal notification only to its active recipient", async () => {
    await createAndEmailNotification({
      userId: 8,
      type: "meeting",
      title: "New meeting created",
      body: "Research coordination meeting",
      relatedModule: "meetings",
      relatedId: 16,
    }, { kind: "notification", link: "https://research.blancoguzman.es/dashboard/meetings" });

    expect(mocks.createNotification).toHaveBeenCalledOnce();
    expect(mocks.sendNotificationEmail).toHaveBeenCalledWith({
      to: "member@example.org",
      title: "New meeting created",
      body: "Research coordination meeting",
      link: "https://research.blancoguzman.es/dashboard/meetings",
    });
  });

  it("does not send an email to an inactive account while retaining the internal notification", async () => {
    mocks.getUserById.mockResolvedValueOnce({ id: 8, email: "inactive@example.org", isActive: false });

    await createAndEmailNotification({
      userId: 8,
      type: "meeting",
      title: "New meeting created",
      body: "Research coordination meeting",
    }, { kind: "notification" });

    expect(mocks.createNotification).toHaveBeenCalledOnce();
    expect(mocks.sendMessageEmail).not.toHaveBeenCalled();
    expect(mocks.sendNotificationEmail).not.toHaveBeenCalled();
  });
});
