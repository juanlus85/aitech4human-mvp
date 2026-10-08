import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({
  getUserByEmail: vi.fn(),
  getUserById: vi.fn(),
  replacePasswordResetToken: vi.fn(),
  invalidatePasswordResetTokens: vi.fn(),
  getValidPasswordResetToken: vi.fn(),
  usePasswordResetToken: vi.fn(),
  updateUserPassword: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  createPasswordResetToken: vi.fn(),
  hashPasswordResetToken: vi.fn(),
  hashPassword: vi.fn(),
}));

vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    getUserByEmail: mocks.getUserByEmail,
    getUserById: mocks.getUserById,
    replacePasswordResetToken: mocks.replacePasswordResetToken,
    invalidatePasswordResetTokens: mocks.invalidatePasswordResetTokens,
    getValidPasswordResetToken: mocks.getValidPasswordResetToken,
    usePasswordResetToken: mocks.usePasswordResetToken,
    updateUserPassword: mocks.updateUserPassword,
  };
});

vi.mock("./auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./auth")>();
  return {
    ...actual,
    createPasswordResetToken: mocks.createPasswordResetToken,
    hashPasswordResetToken: mocks.hashPasswordResetToken,
    hashPassword: mocks.hashPassword,
  };
});

vi.mock("./email", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./email")>();
  return { ...actual, sendPasswordResetEmail: mocks.sendPasswordResetEmail };
});

import { appRouter } from "./routers";

const activeUser = {
  id: 12,
  name: "Recovery Member",
  email: "member@example.org",
  passwordHash: "hashed",
  role: "member" as const,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

function createContext(role: "member" | "admin" = "member"): TrpcContext {
  return {
    user: { ...activeUser, id: role === "admin" ? 1 : activeUser.id, role },
    req: { protocol: "https", headers: {}, cookies: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("secure password recovery", () => {
  beforeEach(() => {
    mocks.getUserByEmail.mockReset().mockResolvedValue(activeUser);
    mocks.getUserById.mockReset().mockResolvedValue(activeUser);
    mocks.replacePasswordResetToken.mockReset().mockResolvedValue(undefined);
    mocks.invalidatePasswordResetTokens.mockReset().mockResolvedValue(undefined);
    mocks.getValidPasswordResetToken.mockReset().mockResolvedValue({ id: 41, userId: activeUser.id });
    mocks.usePasswordResetToken.mockReset().mockResolvedValue(undefined);
    mocks.updateUserPassword.mockReset().mockResolvedValue(undefined);
    mocks.sendPasswordResetEmail.mockReset().mockResolvedValue(true);
    mocks.createPasswordResetToken.mockReset().mockReturnValue({ token: "secure-raw-token-with-sufficient-length-123", tokenHash: "stored-token-hash" });
    mocks.hashPasswordResetToken.mockReset().mockImplementation((token: string) => `hashed:${token}`);
    mocks.hashPassword.mockReset().mockResolvedValue("new-password-hash");
  });

  it("creates a one-time reset token and emails the raw link token, never a password", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.auth.requestPasswordReset({ email: " MEMBER@EXAMPLE.ORG " })).resolves.toEqual({ success: true });

    expect(mocks.getUserByEmail).toHaveBeenCalledWith("member@example.org");
    expect(mocks.replacePasswordResetToken).toHaveBeenCalledWith(activeUser.id, "stored-token-hash", expect.any(Date));
    expect(mocks.sendPasswordResetEmail).toHaveBeenCalledWith({ to: activeUser.email, name: activeUser.name, token: "secure-raw-token-with-sufficient-length-123" });
  });

  it("does not reveal whether a requested email has an account", async () => {
    mocks.getUserByEmail.mockResolvedValue(null);
    const caller = appRouter.createCaller(createContext());
    await expect(caller.auth.requestPasswordReset({ email: "unknown@example.org" })).resolves.toEqual({ success: true });
    expect(mocks.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("uses a valid link once to replace the password hash", async () => {
    const caller = appRouter.createCaller(createContext());
    await caller.auth.resetPassword({ token: "secure-raw-token-with-sufficient-length-123", newPassword: "a-new-password" });

    expect(mocks.hashPasswordResetToken).toHaveBeenCalledWith("secure-raw-token-with-sufficient-length-123");
    expect(mocks.updateUserPassword).toHaveBeenCalledWith(activeUser.id, "new-password-hash");
    expect(mocks.usePasswordResetToken).toHaveBeenCalledWith(41);
  });

  it("lets an administrator set a password without sending email", async () => {
    const caller = appRouter.createCaller(createContext("admin"));
    await caller.users.setPassword({ id: activeUser.id, newPassword: "admin-set-password" });

    expect(mocks.updateUserPassword).toHaveBeenCalledWith(activeUser.id, "new-password-hash");
    expect(mocks.invalidatePasswordResetTokens).toHaveBeenCalledWith(activeUser.id);
    expect(mocks.sendPasswordResetEmail).not.toHaveBeenCalled();
  });
});
