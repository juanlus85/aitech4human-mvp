import { randomUUID } from "crypto";
import nodemailer from "nodemailer";
import { getAppSettings } from "./db";

const PLATFORM_URL = "https://research.blancoguzman.es";

export interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export function getPlatformUrl(path = "/dashboard"): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${PLATFORM_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function getPublicAssetUrl(urlOrPath: string): string {
  return getPlatformUrl(urlOrPath);
}

function extractMailboxAddress(value: string): string {
  const match = value.match(/<([^>]+)>/);
  return (match?.[1] ?? value).trim();
}

function formatFromAddress(value: string): string {
  return value.includes("<") ? value : `AI&Tech4Human Research & Innovation Group <${value}>`;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function textToHtml(value: string): string {
  return escapeHtml(value).replace(/\r?\n/g, "<br />");
}

function emailLayout(opts: {
  eyebrow: string;
  title: string;
  content: string;
  actionLabel: string;
  link: string;
}): string {
  return `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; color: #1f2937;">
      <div style="background: linear-gradient(135deg, #5b4aa1 0%, #7c5ac8 100%); padding: 28px; border-radius: 14px 14px 0 0;">
        <p style="margin: 0 0 6px; color: #e9e3ff; font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;">${escapeHtml(opts.eyebrow)}</p>
        <h1 style="margin: 0; color: #ffffff; font-size: 22px; line-height: 1.3;">AI&amp;Tech4Human Research &amp; Innovation Group</h1>
      </div>
      <div style="background: #fafafa; padding: 28px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 14px 14px;">
        <h2 style="color: #1f2937; margin: 0 0 18px; font-size: 20px; line-height: 1.35;">${escapeHtml(opts.title)}</h2>
        ${opts.content}
        <div style="margin-top: 26px;"><a href="${escapeHtml(opts.link)}" style="display: inline-block; background: #5b4aa1; color: #ffffff; padding: 12px 18px; border-radius: 7px; text-decoration: none; font-size: 14px; font-weight: 700;">${escapeHtml(opts.actionLabel)}</a></div>
        <p style="margin: 22px 0 0; color: #6b7280; font-size: 13px; line-height: 1.5;">If you are not signed in, please log in to the platform first. You can then view the item and take any available action.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0 14px;" />
        <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; margin: 0;">This email was sent because you have an active account in the AI&amp;Tech4Human Research &amp; Innovation Group platform.</p>
      </div>
    </div>
  `;
}

/** Sends an email through the SMTP configuration stored in appSettings. */
export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  try {
    const settings = await getAppSettings();
    const host = settings["smtp_host"];
    const port = parseInt(settings["smtp_port"] ?? "587", 10);
    const user = settings["smtp_user"];
    const password = settings["smtp_password"];
    const fromAddress = settings["smtp_from"] || user;
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
    const mailboxAddress = extractMailboxAddress(fromAddress);
    const fromDomain = mailboxAddress.split("@")[1] || "blancoguzman.es";
    await transporter.sendMail({
      from: formatFromAddress(fromAddress),
      replyTo: settings["smtp_reply_to"] || mailboxAddress,
      to: Array.isArray(payload.to) ? payload.to.join(", ") : payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      messageId: `<${randomUUID()}@${fromDomain}>`,
      headers: {
        "X-Auto-Response-Suppress": "All",
        "X-Entity-Ref-ID": randomUUID(),
      },
    });
    console.log(`[email] Sent "${payload.subject}" to ${Array.isArray(payload.to) ? payload.to.length : 1} recipient(s)`);
    return true;
  } catch (err) {
    console.error("[email] Failed to send email:", err);
    return false;
  }
}

export async function sendMessageEmail(opts: {
  to: string;
  senderName: string;
  subject: string;
  body: string;
  messageId: number;
  attachments?: Array<{ fileName: string; fileUrl: string }>;
}): Promise<boolean> {
  const link = getPlatformUrl(`/dashboard/messages?message=${opts.messageId}`);
  const attachmentsHtml = opts.attachments?.length
    ? `<div style="margin-top: 18px;"><p style="color: #4b5563; font-weight: 700; margin: 0 0 8px;">Attachments</p><ul style="margin: 0; padding-left: 20px; line-height: 1.7;">${opts.attachments.map((attachment) => `<li><a href="${escapeHtml(getPublicAssetUrl(attachment.fileUrl))}" style="color: #5b4aa1;">${escapeHtml(attachment.fileName)}</a></li>`).join("")}</ul></div>`
    : "";
  const attachmentsText = opts.attachments?.length
    ? `\n\nAttachments:\n${opts.attachments.map((attachment) => `- ${attachment.fileName}: ${getPublicAssetUrl(attachment.fileUrl)}`).join("\n")}`
    : "";
  const content = `
    <p style="color: #4b5563; line-height: 1.6; margin: 0 0 12px;"><strong>From:</strong> ${escapeHtml(opts.senderName)}</p>
    <p style="color: #4b5563; line-height: 1.6; margin: 0 0 18px;"><strong>Subject:</strong> ${escapeHtml(opts.subject)}</p>
    <div style="background: #ffffff; border: 1px solid #e5e7eb; border-left: 4px solid #7c5ac8; border-radius: 7px; padding: 18px; color: #374151; line-height: 1.65;">${textToHtml(opts.body)}</div>
    ${attachmentsHtml}
  `;
  return sendEmail({
    to: opts.to,
    subject: `New message from ${opts.senderName}: ${opts.subject}`,
    html: emailLayout({ eyebrow: "New private message", title: opts.subject, content, actionLabel: "View message and reply", link }),
    text: `New private message\n\nFrom: ${opts.senderName}\nSubject: ${opts.subject}\n\n${opts.body}${attachmentsText}\n\nView and reply: ${link}`,
  });
}

export async function sendNotificationEmail(opts: {
  to: string;
  title: string;
  body: string;
  link?: string;
  subject?: string;
}): Promise<boolean> {
  const link = opts.link || getPlatformUrl();
  const content = `<div style="background: #ffffff; border: 1px solid #e5e7eb; border-left: 4px solid #7c5ac8; border-radius: 7px; padding: 18px; color: #374151; line-height: 1.65;">${textToHtml(opts.body)}</div>`;
  return sendEmail({
    to: opts.to,
    subject: opts.subject || `Notification: ${opts.title}`,
    html: emailLayout({ eyebrow: "Platform notification", title: opts.title, content, actionLabel: "View in the platform", link }),
    text: `${opts.title}\n\n${opts.body}\n\nView in the platform: ${link}`,
  });
}

/** Sends the same group notification individually, preserving recipient privacy. */
export async function notifyMembers(opts: {
  subject: string;
  title: string;
  body: string;
  link?: string;
  memberEmails: string[];
}): Promise<boolean> {
  const recipients = Array.from(new Set(opts.memberEmails.map((email) => email.trim()).filter(Boolean)));
  if (recipients.length === 0) return false;
  const results = await Promise.all(recipients.map((to) => sendNotificationEmail({
    to,
    title: opts.title,
    body: opts.body,
    link: opts.link,
    subject: opts.subject,
  })));
  return results.every(Boolean);
}
