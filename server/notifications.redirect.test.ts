/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  markRead: vi.fn(),
  invalidate: vi.fn(),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ notifications: { list: { invalidate: mocks.invalidate } } }),
    notifications: {
      list: {
        useQuery: () => ({
          isLoading: false,
          data: [{
            id: 12,
            type: "message",
            title: "New message",
            body: 'You have a new message: "Project update"',
            relatedModule: "messages",
            relatedId: 42,
            isRead: false,
            createdAt: new Date("2026-09-14T08:00:00.000Z"),
          }],
        }),
      },
      markRead: { useMutation: () => ({ mutate: mocks.markRead }) },
      markAllRead: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
  },
}));

vi.mock("@/components/DashboardLayout", () => ({
  default: ({ children }: { children: unknown }) => children,
}));

vi.mock("wouter", () => ({
  useLocation: () => ["/dashboard/notifications", mocks.navigate],
}));

import Notifications from "../client/src/pages/dashboard/Notifications";

describe("message notification navigation", () => {
  beforeEach(() => {
    cleanup();
    mocks.navigate.mockReset();
    mocks.markRead.mockReset();
    mocks.invalidate.mockReset();
  });

  it("marks a message notification as read and opens the linked message", () => {
    render(createElement(Notifications));
    fireEvent.click(screen.getByRole("button", { name: /new message/i }));

    expect(mocks.markRead).toHaveBeenCalledWith({ id: 12 });
    expect(mocks.navigate).toHaveBeenCalledWith("/dashboard/messages?message=42");
  });
});
