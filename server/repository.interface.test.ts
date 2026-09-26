/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";

const mocks = vi.hoisted(() => ({
  mutate: vi.fn(),
  invalidate: vi.fn(),
}));

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: 1, name: "Ada Lovelace", role: "member" } }),
}));

vi.mock("@/components/DashboardLayout", () => ({
  default: ({ children }: { children: unknown }) => children,
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ repository: { list: { invalidate: mocks.invalidate }, getById: { invalidate: mocks.invalidate } } }),
    repository: {
      list: { useQuery: () => ({ data: [], isLoading: false }) },
      getById: { useQuery: () => ({ data: undefined }) },
      create: { useMutation: () => ({ mutate: mocks.mutate, isPending: false }) },
      update: { useMutation: () => ({ mutate: mocks.mutate, isPending: false }) },
      delete: { useMutation: () => ({ mutate: mocks.mutate, isPending: false }) },
    },
    messages: { recipients: { useQuery: () => ({ data: [{ id: 1, name: "Ada Lovelace" }] }) } },
  },
}));

import ResearchRepository from "../client/src/pages/dashboard/ResearchRepository";

describe("academic repository interface", () => {
  beforeEach(() => {
    cleanup();
    mocks.mutate.mockReset();
    mocks.invalidate.mockReset();
  });

  it("opens a structured publication form with collaborator and PDF controls", () => {
    render(createElement(ResearchRepository));
    expect(screen.getByText("Academic Repository")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /add publication/i }));

    expect(screen.getByText("Participating members")).toBeTruthy();
    expect(screen.getByText("Publication PDF")).toBeTruthy();
    expect(screen.getByLabelText("Title *")).toBeTruthy();
    expect(screen.getByLabelText("DOI")).toBeTruthy();
  });
});
