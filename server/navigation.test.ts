import { describe, expect, it } from "vitest";
import { getLoginPathForCurrentLocation, getSafeDashboardReturnPath } from "../client/src/lib/navigation";

describe("getSafeDashboardReturnPath", () => {
  it("preserves an encoded dashboard message link after login", () => {
    const loginPath = getLoginPathForCurrentLocation({ pathname: "/dashboard/messages", search: "?message=42" });
    expect(loginPath).toBe("/login?next=%2Fdashboard%2Fmessages%3Fmessage%3D42");
    expect(getSafeDashboardReturnPath(loginPath.slice(loginPath.indexOf("?"))))
      .toBe("/dashboard/messages?message=42");
  });

  it("rejects external and non-dashboard redirect targets", () => {
    expect(getSafeDashboardReturnPath("?next=https%3A%2F%2Fevil.example"))
      .toBe("/dashboard");
    expect(getSafeDashboardReturnPath("?next=%2F%2Fevil.example"))
      .toBe("/dashboard");
    expect(getSafeDashboardReturnPath("?next=%2Fcontact"))
      .toBe("/dashboard");
  });
});
