import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({
  getAllInternalMemberProfiles: vi.fn(),
}));

vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    getAllInternalMemberProfiles: mocks.getAllInternalMemberProfiles,
  };
});

import { appRouter } from "./routers";

function createContext(user: TrpcContext["user"]): TrpcContext {
  return {
    user,
    req: { headers: {}, cookies: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("profiles.internalList", () => {
  it("returns the internal directory to authenticated members", async () => {
    const directory = [{ userId: 2, name: "Ada Lovelace", email: "ada@example.org" }];
    mocks.getAllInternalMemberProfiles.mockResolvedValueOnce(directory);

    const caller = appRouter.createCaller(createContext({
      id: 1,
      name: "Member",
      email: "member@example.org",
      role: "member",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      passwordHash: "not-exposed",
    }));

    await expect(caller.profiles.internalList()).resolves.toEqual(directory);
    expect(mocks.getAllInternalMemberProfiles).toHaveBeenCalledOnce();
  });

  it("does not expose the internal directory without authentication", async () => {
    const caller = appRouter.createCaller(createContext(null));
    await expect(caller.profiles.internalList()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
