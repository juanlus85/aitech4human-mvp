/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";

const mocks = vi.hoisted(() => {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal("ResizeObserver", ResizeObserverMock);
  return {
    mutate: vi.fn(),
    invalidate: vi.fn(),
  };
});

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: 1, name: "Member", email: "member@example.org" } }),
}));

vi.mock("@/components/DashboardLayout", () => ({
  default: ({ children }: { children: unknown }) => children,
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ messages: { inbox: { invalidate: mocks.invalidate }, sent: { invalidate: mocks.invalidate }, getById: { invalidate: mocks.invalidate } } }),
    messages: {
      inbox: { useQuery: () => ({ data: [{ id: 12, senderId: 2, senderName: "Sender", recipientId: 1, subject: "Long message", createdAt: new Date(), isReadByRecipient: true }] }) },
      sent: { useQuery: () => ({ data: [] }) },
      recipients: { useQuery: () => ({ data: [{ id: 1, name: "Member", email: "member@example.org" }] }) },
      getById: { useQuery: () => ({ data: { id: 12, senderId: 2, senderName: "Sender", subject: "Long message", body: "Original message", createdAt: new Date(), recipients: [{ userId: 1, name: "Member" }], attachments: [] } }) },
      send: { useMutation: () => ({ mutate: mocks.mutate, isPending: false }) },
      remove: { useMutation: () => ({ mutate: mocks.mutate, isPending: false }) },
    },
  },
}));

import Messages from "../client/src/pages/dashboard/Messages";

describe("message composer layout", () => {
  beforeEach(() => {
    cleanup();
    mocks.mutate.mockReset();
    mocks.invalidate.mockReset();
  });

  it("opens a wide, near-full-height composer with a fixed-size scrollable writing area", () => {
    render(createElement(Messages));
    fireEvent.click(screen.getByRole("button", { name: /compose/i }));

    const editor = document.querySelector("textarea");
    const dialog = editor?.closest("[role='dialog']");
    expect(editor).not.toBeNull();
    expect(editor?.className).toContain("flex-1");
    expect(editor?.className).toContain("min-h-[16rem]");
    expect(editor?.className).toContain("field-sizing-fixed");
    expect(editor?.className).toContain("overflow-y-auto");
    expect(dialog?.className).toContain("h-[92dvh]");
    expect(dialog?.className).toContain("max-w-5xl");
  });

  it("opens a wide, scrollable reply editor for long responses", () => {
    render(createElement(Messages));
    fireEvent.click(screen.getByText("Long message"));
    fireEvent.click(screen.getByRole("button", { name: "Reply" }));

    const replyEditor = screen.getByPlaceholderText("Write your reply...");
    const replyDialog = replyEditor.closest("[role='dialog']");
    expect(replyEditor.className).toContain("field-sizing-fixed");
    expect(replyEditor.className).toContain("overflow-y-auto");
    expect(replyDialog?.className).toContain("max-w-5xl");
  });
});
