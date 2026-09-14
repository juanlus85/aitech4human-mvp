import { beforeEach, describe, expect, it, vi } from "vitest";

const sendMail = vi.fn();

vi.mock("./db", () => ({
  getAppSettings: vi.fn(async () => ({
    smtp_host: "smtp.example.org",
    smtp_port: "587",
    smtp_user: "mailer@example.org",
    smtp_password: "test-password",
    smtp_from: "AI&Tech4Human <mailer@example.org>",
  })),
}));

vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(() => ({ sendMail })),
  },
}));

import { notifyMembers, sendMessageEmail } from "./email";

describe("email notifications", () => {
  beforeEach(() => {
    sendMail.mockReset();
    sendMail.mockResolvedValue({ messageId: "test-message" });
  });

  it("sends the complete private message only to its recipient with a direct reply link", async () => {
    const sent = await sendMessageEmail({
      to: "recipient@example.org",
      senderName: "Ada & <Bob>",
      subject: "Project <update>",
      body: "First line\nSecond line <script>",
      messageId: 42,
    });

    expect(sent).toBe(true);
    expect(sendMail).toHaveBeenCalledTimes(1);
    const payload = sendMail.mock.calls[0]?.[0];
    expect(payload.to).toBe("recipient@example.org");
    expect(payload.subject).toBe("New message from Ada & <Bob>: Project <update>");
    expect(payload.html).toContain("Ada &amp; &lt;Bob&gt;");
    expect(payload.html).toContain("First line<br />Second line &lt;script&gt;");
    expect(payload.html).toContain("https://research.blancoguzman.es/dashboard/messages?message=42");
    expect(payload.text).toContain("First line\nSecond line <script>");
  });

  it("sends group notifications individually and preserves the supplied subject and link", async () => {
    const sent = await notifyMembers({
      subject: "New Event: Research Workshop",
      title: "Research Workshop",
      body: "Registration is now open.",
      link: "https://research.blancoguzman.es/dashboard/events",
      memberEmails: ["member.one@example.org", "member.two@example.org", "member.one@example.org"],
    });

    expect(sent).toBe(true);
    expect(sendMail).toHaveBeenCalledTimes(2);
    const recipients = sendMail.mock.calls.map(([payload]) => payload.to).sort();
    expect(recipients).toEqual(["member.one@example.org", "member.two@example.org"]);
    for (const [payload] of sendMail.mock.calls) {
      expect(payload.subject).toBe("New Event: Research Workshop");
      expect(payload.html).toContain("Registration is now open.");
      expect(payload.html).toContain("https://research.blancoguzman.es/dashboard/events");
    }
  });
});
