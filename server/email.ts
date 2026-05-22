import nodemailer from "nodemailer";
import { getAppSettings } from "./db";

export interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

/**
 * Sends an email using the SMTP configuration stored in appSettings DB.
 * Returns true on success, false if SMTP is not configured or sending fails.
 */
export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  try {
    const settings = await getAppSettings();

    const host = settings["smtp_host"];
    const port = parseInt(settings["smtp_port"] ?? "587", 10);
    const user = settings["smtp_user"];
    const password = settings["smtp_password"];
    const from = settings["smtp_from"] || user;

    if (!host || !user || !password) {
      console.warn("[email] SMTP not configured — skipping email send.");
      return false;
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass: password },
      tls: { rejectUnauthorized: false },
    });

    await transporter.sendMail({
      from,
      to: Array.isArray(payload.to) ? payload.to.join(", ") : payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    });

    console.log(`[email] Sent "${payload.subject}" to ${Array.isArray(payload.to) ? payload.to.length : 1} recipient(s)`);
    return true;
  } catch (err) {
    console.error("[email] Failed to send email:", err);
    return false;
  }
}

/**
 * Sends a notification email to a list of member emails.
 * Used when "Notify members by email" is checked on creation forms.
 */
export async function notifyMembers(opts: {
  subject: string;
  title: string;
  body: string;
  link?: string;
  memberEmails: string[];
}): Promise<boolean> {
  if (opts.memberEmails.length === 0) return false;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 24px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 20px;">AI&amp;Tech4Human</h1>
      </div>
      <div style="background: #f9fafb; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
        <h2 style="color: #1f2937; margin-top: 0;">${opts.title}</h2>
        <div style="color: #4b5563; line-height: 1.6; white-space: pre-wrap;">${opts.body}</div>
        ${opts.link ? `<div style="margin-top: 20px;"><a href="${opts.link}" style="background: #6366f1; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold;">View details</a></div>` : ""}
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
          You are receiving this email because you are a member of AI&amp;Tech4Human research group.
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to: opts.memberEmails,
    subject: opts.subject,
    html,
    text: `${opts.title}\n\n${opts.body}${opts.link ? `\n\nView details: ${opts.link}` : ""}`,
  });
}
