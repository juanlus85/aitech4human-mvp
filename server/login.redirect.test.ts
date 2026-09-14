/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { createElement } from "react";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  invalidate: vi.fn(),
  mutate: vi.fn(),
  options: null as any,
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ auth: { me: { invalidate: mocks.invalidate } } }),
    auth: {
      login: {
        useMutation: (options: any) => {
          mocks.options = options;
          return { mutate: mocks.mutate, isPending: false };
        },
      },
    },
  },
}));

vi.mock("wouter", () => ({
  useLocation: () => ["/login", mocks.navigate],
  Link: ({ children }: { children: unknown }) => children,
}));

import Login from "../client/src/pages/Login";

describe("Login redirect from a message email", () => {
  beforeEach(() => {
    cleanup();
    mocks.navigate.mockReset();
    mocks.invalidate.mockReset().mockResolvedValue(undefined);
    mocks.mutate.mockReset();
    mocks.options = null;
    window.history.replaceState({}, "", "/login?next=%2Fdashboard%2Fmessages%3Fmessage%3D42");
  });

  it("returns the member to the exact linked message after successful login", async () => {
    render(createElement(Login));

    fireEvent.change(screen.getByLabelText("Email Address"), { target: { value: "member@example.org" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "test-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));

    expect(mocks.mutate).toHaveBeenCalledWith({ email: "member@example.org", password: "test-password" });
    await mocks.options.onSuccess();

    expect(mocks.invalidate).toHaveBeenCalledOnce();
    expect(mocks.navigate).toHaveBeenCalledWith("/dashboard/messages?message=42");
  });
});
