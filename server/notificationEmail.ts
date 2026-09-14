import type { InsertNotification } from "../drizzle/schema";
import { createNotification, getUserById } from "./db";
import { sendMessageEmail, sendNotificationEmail } from "./email";

type NotificationEmailDetails =
  | {
      kind: "message";
      senderName: string;
      subject: string;
      messageBody: string;
      messageId: number;
      attachments?: Array<{ fileName: string; fileUrl: string }>;
    }
  | {
      kind: "notification";
      link?: string;
    };

/**
 * Persists an in-platform notification and, where the recipient has an active
 * account, sends a matching email without allowing SMTP failures to interrupt
 * the underlying business action.
 */
export async function createAndEmailNotification(
  notification: InsertNotification,
  email: NotificationEmailDetails,
): Promise<void> {
  await createNotification(notification);

  const recipient = await getUserById(notification.userId);
  if (!recipient?.isActive) return;

  try {
    if (email.kind === "message") {
      await sendMessageEmail({
        to: recipient.email,
        senderName: email.senderName,
        subject: email.subject,
        body: email.messageBody,
        messageId: email.messageId,
        attachments: email.attachments,
      });
      return;
    }

    await sendNotificationEmail({
      to: recipient.email,
      title: notification.title,
      body: notification.body ?? "",
      link: email.link,
    });
  } catch (err) {
    console.error(`[Email] Failed to send notification email to user ${notification.userId}:`, err);
  }
}
