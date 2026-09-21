import { describe, expect, it } from "vitest";
import { getPreselectedMessageRecipientId } from "../client/src/lib/messageNavigation";

describe("message recipient deep link", () => {
  it("accepts only an active numeric recipient from the URL", () => {
    expect(getPreselectedMessageRecipientId("?recipient=7", [2, 7, 11])).toBe(7);
    expect(getPreselectedMessageRecipientId("?recipient=03", [3])).toBe(3);
  });

  it("rejects missing, malformed, and unavailable recipients", () => {
    expect(getPreselectedMessageRecipientId("", [7])).toBeNull();
    expect(getPreselectedMessageRecipientId("?recipient=not-a-number", [7])).toBeNull();
    expect(getPreselectedMessageRecipientId("?recipient=8", [7])).toBeNull();
    expect(getPreselectedMessageRecipientId("?recipient=7.5", [7])).toBeNull();
  });
});
