import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("password recovery interface", () => {
  it("shows the persistent-session option, secure recovery entry point, and administrator password controls", () => {
    const login = readFileSync(resolve(process.cwd(), "client/src/pages/Login.tsx"), "utf8");
    const reset = readFileSync(resolve(process.cwd(), "client/src/pages/ResetPassword.tsx"), "utf8");
    const users = readFileSync(resolve(process.cwd(), "client/src/pages/dashboard/admin/AdminUsers.tsx"), "utf8");

    expect(login).toContain("Remember me for 30 days");
    expect(login).toContain("Forgot password?");
    expect(login).toContain("requestPasswordReset");
    expect(reset).toContain("resetPassword");
    expect(reset).toContain("Choose a new password");
    expect(users).toContain("Set password without sending email");
    expect(users).toContain("users.setPassword");
    expect(users).toContain("No password is sent or stored in plain text");
  });
});
