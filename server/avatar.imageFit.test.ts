import { describe, expect, it } from "vitest";
import { avatarImageClassName } from "../client/src/components/ui/avatar";

describe("member avatars", () => {
  it("crops uploaded photos inside the square avatar without distortion", () => {
    expect(avatarImageClassName).toContain("aspect-square");
    expect(avatarImageClassName).toContain("object-cover");
    expect(avatarImageClassName).toContain("object-center");
  });
});
