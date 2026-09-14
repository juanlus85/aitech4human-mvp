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
      inbox: { useQuery: () => ({ data: [] }) },
      sent: { useQuery: () => ({ data: [] }) },
      recipients: { useQuery: () => ({ data: [{ id: 1, name: "Member", email: "member@example.org" }] }) },
      getById: { useQuery: () => ({ data: undefined }) },
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

  it("opens a near-full-height composer with a flexible dominant writing area", () => {
    render(createElement(Messages));
    fireEvent.click(screen.getByRole("button", { name: /compose/i }));

    const editor = document.querySelector("textarea");
    const dialog = editor?.closest("[role='dialog']");
    expect(editor).not.toBeNull();
    expect(editor?.className).toContain("flex-1");
    expect(editor?.className).toContain("min-h-[16rem]");
    expect(dialog?.className).toContain("h-[92dvh]");
  });
});
