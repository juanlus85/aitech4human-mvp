import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({
  getDocumentById: vi.fn(),
  updateDocument: vi.fn(),
  deleteDocument: vi.fn(),
  getFolderById: vi.fn(),
  updateFolder: vi.fn(),
  deleteFolder: vi.fn(),
  storageDelete: vi.fn(),
}));

vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    getDocumentById: mocks.getDocumentById,
    updateDocument: mocks.updateDocument,
    deleteDocument: mocks.deleteDocument,
    getFolderById: mocks.getFolderById,
    updateFolder: mocks.updateFolder,
    deleteFolder: mocks.deleteFolder,
  };
});

vi.mock("./storage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./storage")>();
  return { ...actual, storageDelete: mocks.storageDelete };
});

import { appRouter } from "./routers";

function createContext(userId = 1, role: "member" | "admin" = "member"): TrpcContext {
  return {
    user: {
      id: userId,
      name: "Document Member",
      email: "member@example.org",
      passwordHash: "hashed",
      role,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { headers: {}, cookies: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("document management router", () => {
  beforeEach(() => {
    mocks.getDocumentById.mockReset().mockResolvedValue({ id: 7, uploaderId: 1, fileKey: "documents/1/report.pdf" });
    mocks.updateDocument.mockReset().mockResolvedValue(undefined);
    mocks.deleteDocument.mockReset().mockResolvedValue(undefined);
    mocks.getFolderById.mockReset().mockResolvedValue({ id: 4, creatorId: 1, name: "Reports" });
    mocks.updateFolder.mockReset().mockResolvedValue(undefined);
    mocks.deleteFolder.mockReset().mockResolvedValue(undefined);
    mocks.storageDelete.mockReset().mockResolvedValue(undefined);
  });

  it("renames a document and moves it into an existing folder", async () => {
    const caller = appRouter.createCaller(createContext());
    await caller.documents.update({ id: 7, fileName: "final-report.pdf", folderId: 4 });

    expect(mocks.getFolderById).toHaveBeenCalledWith(4);
    expect(mocks.updateDocument).toHaveBeenCalledWith(7, { fileName: "final-report.pdf", folderId: 4 });
  });

  it("removes the physical document file when its record is deleted", async () => {
    const caller = appRouter.createCaller(createContext());
    await caller.documents.delete({ id: 7 });

    expect(mocks.deleteDocument).toHaveBeenCalledWith(7);
    expect(mocks.storageDelete).toHaveBeenCalledWith("documents/1/report.pdf");
  });

  it("allows a folder owner to rename or delete their folder", async () => {
    const caller = appRouter.createCaller(createContext());
    await caller.documents.updateFolder({ id: 4, name: "Final reports" });
    await caller.documents.deleteFolder({ id: 4 });

    expect(mocks.updateFolder).toHaveBeenCalledWith(4, { name: "Final reports" });
    expect(mocks.deleteFolder).toHaveBeenCalledWith(4);
  });

  it("prevents a non-owner from changing a document or folder", async () => {
    mocks.getDocumentById.mockResolvedValue({ id: 7, uploaderId: 8, fileKey: "documents/8/private.pdf" });
    mocks.getFolderById.mockResolvedValue({ id: 4, creatorId: 8, name: "Private" });
    const caller = appRouter.createCaller(createContext());

    await expect(caller.documents.update({ id: 7, fileName: "not-allowed.pdf" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.documents.deleteFolder({ id: 4 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
