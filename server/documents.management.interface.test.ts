/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";

const mocks = vi.hoisted(() => ({
  mutate: vi.fn(),
  invalidate: vi.fn(),
}));

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: 1, role: "member", name: "Ada Lovelace" } }),
}));

vi.mock("@/components/DashboardLayout", () => ({
  default: ({ children }: { children: unknown }) => children,
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ documents: { list: { invalidate: mocks.invalidate }, folders: { invalidate: mocks.invalidate } } }),
    documents: {
      list: { useQuery: () => ({ data: [{ id: 7, uploaderId: 1, fileName: "notes.pdf", fileUrl: "/uploads/notes.pdf", fileSize: 1200, mimeType: "application/pdf", accessLevel: "all", folderId: 3, createdAt: new Date() }], isLoading: false }) },
      folders: { useQuery: () => ({ data: [{ id: 3, creatorId: 1, name: "Meeting Notes" }] }) },
      upload: { useMutation: () => ({ mutate: mocks.mutate, isPending: false }) },
      delete: { useMutation: () => ({ mutate: mocks.mutate, isPending: false }) },
      update: { useMutation: () => ({ mutate: mocks.mutate, isPending: false }) },
      createFolder: { useMutation: () => ({ mutate: mocks.mutate, isPending: false }) },
      updateFolder: { useMutation: () => ({ mutate: mocks.mutate, isPending: false }) },
      deleteFolder: { useMutation: () => ({ mutate: mocks.mutate, isPending: false }) },
    },
  },
}));

import Documents from "../client/src/pages/dashboard/Documents";

describe("document management interface", () => {
  beforeEach(() => {
    cleanup();
    mocks.mutate.mockReset();
    mocks.invalidate.mockReset();
  });

  it("opens management dialogs to rename folders and move documents", () => {
    render(createElement(Documents));
    fireEvent.click(screen.getByRole("button", { name: "Manage folder Meeting Notes" }));
    expect(screen.getByText("Manage folder")).toBeTruthy();
    expect(screen.getByText("Delete folder")).toBeTruthy();

    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.click(screen.getByRole("button", { name: "Rename or move notes.pdf" }));
    expect(screen.getByText("Organize document")).toBeTruthy();
    expect(screen.getByLabelText("File name *")).toBeTruthy();
    expect(screen.getByText("Move to folder")).toBeTruthy();
  });
});
