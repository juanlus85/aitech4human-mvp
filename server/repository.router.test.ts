import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({
  getRepositoryItems: vi.fn(),
  getRepositoryItemDetail: vi.fn(),
  getRepositoryItemById: vi.fn(),
  getRepositoryParticipants: vi.fn(),
  createRepositoryItem: vi.fn(),
  updateRepositoryItem: vi.fn(),
  deleteRepositoryItem: vi.fn(),
  setRepositoryParticipants: vi.fn(),
  getUserById: vi.fn(),
  storageDelete: vi.fn(),
}));

vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    getRepositoryItems: mocks.getRepositoryItems,
    getRepositoryItemDetail: mocks.getRepositoryItemDetail,
    getRepositoryItemById: mocks.getRepositoryItemById,
    getRepositoryParticipants: mocks.getRepositoryParticipants,
    createRepositoryItem: mocks.createRepositoryItem,
    updateRepositoryItem: mocks.updateRepositoryItem,
    deleteRepositoryItem: mocks.deleteRepositoryItem,
    setRepositoryParticipants: mocks.setRepositoryParticipants,
    getUserById: mocks.getUserById,
  };
});

vi.mock("./storage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./storage")>();
  return { ...actual, storageDelete: mocks.storageDelete };
});

import { appRouter } from "./routers";

function createContext(userId = 1): TrpcContext {
  return {
    user: {
      id: userId,
      name: "Repository Member",
      email: "member@example.org",
      passwordHash: "hashed",
      role: "member",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { headers: {}, cookies: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("academic repository router", () => {
  beforeEach(() => {
    mocks.getRepositoryItems.mockReset().mockResolvedValue([]);
    mocks.getRepositoryItemDetail.mockReset().mockResolvedValue({ id: 81, title: "Collaborative Paper" });
    mocks.getRepositoryItemById.mockReset().mockResolvedValue({ id: 81, creatorId: 1, pdfFileKey: "repository/1/old.pdf" });
    mocks.getRepositoryParticipants.mockReset().mockResolvedValue([]);
    mocks.createRepositoryItem.mockReset().mockResolvedValue({ id: 81 });
    mocks.updateRepositoryItem.mockReset().mockResolvedValue(undefined);
    mocks.deleteRepositoryItem.mockReset().mockResolvedValue(undefined);
    mocks.setRepositoryParticipants.mockReset().mockResolvedValue(undefined);
    mocks.getUserById.mockReset().mockImplementation(async (id: number) => ({ id, isActive: true, name: `Member ${id}` }));
    mocks.storageDelete.mockReset().mockResolvedValue(undefined);
  });

  it("creates a structured entry and makes the creator and selected members participants", async () => {
    const caller = appRouter.createCaller(createContext());
    await caller.repository.create({
      type: "book_chapter",
      title: "Human-centred digital innovation",
      authors: "A. Author; B. Author",
      citation: "Author, A. (2026). Human-centred digital innovation.",
      publicationDate: new Date("2026-09-01T12:00:00.000Z"),
      doi: "10.1000/example",
      participantIds: [8, 9],
      pdfFileName: "chapter.pdf",
      pdfFileKey: "repository/1/chapter.pdf",
      pdfFileUrl: "/uploads/repository_chapter.pdf",
      pdfFileSize: 1200,
    });

    expect(mocks.createRepositoryItem).toHaveBeenCalledWith(expect.objectContaining({
      creatorId: 1,
      type: "book_chapter",
      title: "Human-centred digital innovation",
      doi: "10.1000/example",
      pdfFileKey: "repository/1/chapter.pdf",
    }));
    expect(mocks.setRepositoryParticipants).toHaveBeenCalledWith(81, [1, 8, 9]);
  });

  it("allows collaborators to replace the PDF and removes the superseded physical file", async () => {
    mocks.getRepositoryItemById.mockResolvedValueOnce({ id: 81, creatorId: 4, pdfFileKey: "repository/4/old.pdf" });
    mocks.getRepositoryParticipants.mockResolvedValueOnce([{ userId: 1, name: "Repository Member" }]);
    const caller = appRouter.createCaller(createContext());

    await caller.repository.update({
      id: 81,
      title: "Updated output",
      pdfFileName: "new.pdf",
      pdfFileKey: "repository/1/new.pdf",
      pdfFileUrl: "/uploads/repository_new.pdf",
      pdfFileSize: 4200,
      participantIds: [1, 8],
    });

    expect(mocks.updateRepositoryItem).toHaveBeenCalledWith(81, expect.objectContaining({ title: "Updated output", pdfFileKey: "repository/1/new.pdf" }));
    expect(mocks.setRepositoryParticipants).toHaveBeenCalledWith(81, [4, 1, 8]);
    expect(mocks.storageDelete).toHaveBeenCalledWith("repository/4/old.pdf");
  });

  it("prevents non-participants from editing or deleting an entry", async () => {
    mocks.getRepositoryItemById.mockResolvedValue({ id: 81, creatorId: 4, pdfFileKey: null });
    mocks.getRepositoryParticipants.mockResolvedValue([]);
    const caller = appRouter.createCaller(createContext());

    await expect(caller.repository.update({ id: 81, title: "Not allowed" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.repository.delete({ id: 81 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
