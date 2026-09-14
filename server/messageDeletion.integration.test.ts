import mysql from "mysql2/promise";
import { afterEach, describe, expect, it } from "vitest";
import { deleteMessageForUser, getInboxForUser, getSentByUser } from "./db";

describe("per-user message deletion integration", () => {
  const cleanup: Array<{ connection: mysql.Connection; messageId?: number; userIds: number[] }> = [];

  afterEach(async () => {
    await Promise.all(cleanup.splice(0).map(async ({ connection, messageId, userIds }) => {
      if (messageId) await connection.execute("DELETE FROM messages WHERE id = ?", [messageId]);
      if (userIds.length === 2) await connection.execute("DELETE FROM users WHERE id = ? OR id = ?", userIds);
      await connection.end();
    }));
  });

  it("hides a deleted message from one recipient while preserving the sender's Sent copy", async () => {
    if (!process.env.DATABASE_URL) return;
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const [senderResult] = await connection.execute<mysql.ResultSetHeader>(
      "INSERT INTO users (openId, email, passwordHash, name, role, isActive) VALUES (?, ?, ?, ?, 'member', true)",
      [`message-delete-sender-${suffix}`, `message-delete-sender-${suffix}@example.test`, "hash", "Deletion Sender"],
    );
    const [recipientResult] = await connection.execute<mysql.ResultSetHeader>(
      "INSERT INTO users (openId, email, passwordHash, name, role, isActive) VALUES (?, ?, ?, ?, 'member', true)",
      [`message-delete-recipient-${suffix}`, `message-delete-recipient-${suffix}@example.test`, "hash", "Deletion Recipient"],
    );
    const senderId = senderResult.insertId;
    const recipientId = recipientResult.insertId;
    const [messageResult] = await connection.execute<mysql.ResultSetHeader>(
      "INSERT INTO messages (senderId, recipientId, subject, body, isReadByRecipient) VALUES (?, ?, ?, ?, false)",
      [senderId, recipientId, "Deletion integration test", "Temporary message"],
    );
    const messageId = messageResult.insertId;
    cleanup.push({ connection, messageId, userIds: [senderId, recipientId] });
    await connection.execute("INSERT INTO messageRecipients (messageId, userId, isRead) VALUES (?, ?, false)", [messageId, recipientId]);

    expect((await getInboxForUser(recipientId)).some((message) => message.id === messageId)).toBe(true);
    expect((await getSentByUser(senderId)).some((message) => message.id === messageId)).toBe(true);

    await deleteMessageForUser(messageId, recipientId);

    expect((await getInboxForUser(recipientId)).some((message) => message.id === messageId)).toBe(false);
    expect((await getSentByUser(senderId)).some((message) => message.id === messageId)).toBe(true);
  });
});
