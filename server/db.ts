import { aliasedTable, and, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2";
import {
  users, profiles, news, messages, messageAttachments,
  meetings, meetingAttendance, meetingDateOptions, meetingDateVotes,
  congresses, commProposals, commProposalInterests,
  papers, paperContributors,
  events, eventInterests,
  documents, documentFolders,
  tasks, notifications,
} from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

/**
 * Convert all undefined values to null so mysql2 doesn't produce
 * a param-count mismatch when optional fields are not provided.
 */
function sanitize<T extends Record<string, unknown>>(data: T): T {
  return Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, v === undefined ? null : v])
  ) as T;
}
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      // Use explicit pool with timezone:'+00:00' so MySQL timestamps round-trip
      // correctly and dates are never serialized with milliseconds.
      const pool = mysql.createPool({
        uri: process.env.DATABASE_URL,
        timezone: "+00:00",
        dateStrings: false,
      });
      _db = drizzle(pool) as any;
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const r = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return r[0] ?? null;
}

export async function updateUser(id: number, data: Partial<{ name: string; email: string; role: "admin" | "member"; isActive: boolean }>) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set(data).where(eq(users.id, id));
}

export async function deleteUser(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(users).where(eq(users.id, id));
}

// ─── Profiles ─────────────────────────────────────────────────────────────────

export async function getProfileByUserId(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const r = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  return r[0] ?? null;
}

export async function upsertProfile(userId: number, data: Partial<typeof profiles.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.userId, userId)).limit(1);
  if (existing.length > 0) {
    await db.update(profiles).set(data).where(eq(profiles.userId, userId));
  } else {
    await db.insert(profiles).values(sanitize({ userId, ...data }));
  }
}

export async function getAllPublicProfiles() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      userId: users.id,
      name: users.name,
      email: users.email,
      photoUrl: profiles.photoUrl,
      bio: profiles.bio,
      university: profiles.university,
      department: profiles.department,
      researchArea: profiles.researchArea,
      orcid: profiles.orcid,
      googleScholar: profiles.googleScholar,
      researchGate: profiles.researchGate,
      linkedin: profiles.linkedin,
      keywords: profiles.keywords,
      cvPdfUrl: profiles.cvPdfUrl,
      availableToCollaborate: profiles.availableToCollaborate,
    })
    .from(users)
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(eq(users.isActive, true));
}

// ─── News ─────────────────────────────────────────────────────────────────────

export async function getPublishedNews(limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(news).where(eq(news.isPublished, true)).orderBy(desc(news.publishedAt)).limit(limit);
}

export async function getAllNews() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(news).orderBy(desc(news.createdAt));
}

export async function getNewsBySlug(slug: string) {
  const db = await getDb();
  if (!db) return null;
  const r = await db.select().from(news).where(eq(news.slug, slug)).limit(1);
  return r[0] ?? null;
}

export async function getNewsById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const r = await db.select().from(news).where(eq(news.id, id)).limit(1);
  return r[0] ?? null;
}

export async function createNews(data: typeof news.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(news).values(sanitize(data));
  const r = await db.select().from(news).where(eq(news.slug, data.slug)).limit(1);
  return r[0] ?? null;
}

export async function updateNews(id: number, data: Partial<typeof news.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(news).set(data).where(eq(news.id, id));
}

export async function deleteNews(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(news).where(eq(news.id, id));
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export async function getMessagesForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(messages)
    .where(sql`${messages.recipientId} = ${userId} OR ${messages.senderId} = ${userId}`)
    .orderBy(desc(messages.createdAt));
}

const senderAlias = aliasedTable(users, "sender");
const recipientAlias = aliasedTable(users, "recipient");

export async function getInboxForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({
      id: messages.id,
      senderId: messages.senderId,
      recipientId: messages.recipientId,
      parentId: messages.parentId,
      subject: messages.subject,
      body: messages.body,
      isReadByRecipient: messages.isReadByRecipient,
      createdAt: messages.createdAt,
      senderName: senderAlias.name,
      recipientName: recipientAlias.name,
    })
    .from(messages)
    .leftJoin(senderAlias, eq(senderAlias.id, messages.senderId))
    .leftJoin(recipientAlias, eq(recipientAlias.id, messages.recipientId))
    .where(eq(messages.recipientId, userId))
    .orderBy(desc(messages.createdAt));
  return rows;
}

export async function getSentByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({
      id: messages.id,
      senderId: messages.senderId,
      recipientId: messages.recipientId,
      parentId: messages.parentId,
      subject: messages.subject,
      body: messages.body,
      isReadByRecipient: messages.isReadByRecipient,
      createdAt: messages.createdAt,
      senderName: senderAlias.name,
      recipientName: recipientAlias.name,
    })
    .from(messages)
    .leftJoin(senderAlias, eq(senderAlias.id, messages.senderId))
    .leftJoin(recipientAlias, eq(recipientAlias.id, messages.recipientId))
    .where(eq(messages.senderId, userId))
    .orderBy(desc(messages.createdAt));
  return rows;
}

export async function getMessageById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const r = await db.select().from(messages).where(eq(messages.id, id)).limit(1);
  return r[0] ?? null;
}

export async function createMessage(data: typeof messages.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(messages).values(sanitize(data));
  const r = await db.select().from(messages).orderBy(desc(messages.createdAt)).limit(1);
  return r[0] ?? null;
}

export async function markMessageRead(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(messages).set({ isReadByRecipient: true }).where(eq(messages.id, id));
}

export async function getAttachmentsForMessage(messageId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(messageAttachments).where(eq(messageAttachments.messageId, messageId));
}

export async function createMessageAttachment(data: typeof messageAttachments.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(messageAttachments).values(sanitize(data));
}

// ─── Meetings ─────────────────────────────────────────────────────────────────

export async function getAllMeetings() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(meetings).orderBy(desc(meetings.createdAt));
}

export async function getMeetingById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const r = await db.select().from(meetings).where(eq(meetings.id, id)).limit(1);
  return r[0] ?? null;
}

export async function createMeeting(data: typeof meetings.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(meetings).values(sanitize(data));
  const r = await db.select().from(meetings).orderBy(desc(meetings.createdAt)).limit(1);
  return r[0] ?? null;
}

export async function updateMeeting(id: number, data: Partial<typeof meetings.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(meetings).set(data).where(eq(meetings.id, id));
}

export async function deleteMeeting(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(meetings).where(eq(meetings.id, id));
}

export async function getMeetingAttendance(meetingId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(meetingAttendance).where(eq(meetingAttendance.meetingId, meetingId));
}

export async function upsertAttendance(meetingId: number, userId: number, response: "attending" | "maybe" | "not_attending") {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select({ id: meetingAttendance.id }).from(meetingAttendance)
    .where(and(eq(meetingAttendance.meetingId, meetingId), eq(meetingAttendance.userId, userId))).limit(1);
  if (existing.length > 0) {
    await db.update(meetingAttendance).set({ response }).where(and(eq(meetingAttendance.meetingId, meetingId), eq(meetingAttendance.userId, userId)));
  } else {
    await db.insert(meetingAttendance).values({ meetingId, userId, response });
  }
}

export async function getMeetingDateOptions(meetingId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(meetingDateOptions).where(eq(meetingDateOptions.meetingId, meetingId));
}

export async function createDateOption(meetingId: number, proposedDate: Date) {
  const db = await getDb();
  if (!db) return;
  await db.insert(meetingDateOptions).values({ meetingId, proposedDate });
}

export async function getVotesForOption(dateOptionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(meetingDateVotes).where(eq(meetingDateVotes.dateOptionId, dateOptionId));
}

export async function toggleDateVote(dateOptionId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select({ id: meetingDateVotes.id }).from(meetingDateVotes)
    .where(and(eq(meetingDateVotes.dateOptionId, dateOptionId), eq(meetingDateVotes.userId, userId))).limit(1);
  if (existing.length > 0) {
    await db.delete(meetingDateVotes).where(and(eq(meetingDateVotes.dateOptionId, dateOptionId), eq(meetingDateVotes.userId, userId)));
  } else {
    await db.insert(meetingDateVotes).values({ dateOptionId, userId });
  }
}

// ─── Congresses ───────────────────────────────────────────────────────────────

export async function getAllCongresses() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(congresses).orderBy(desc(congresses.createdAt));
}

export async function getCongressById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const r = await db.select().from(congresses).where(eq(congresses.id, id)).limit(1);
  return r[0] ?? null;
}

export async function createCongress(data: typeof congresses.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(congresses).values(sanitize(data));
  const r = await db.select().from(congresses).orderBy(desc(congresses.createdAt)).limit(1);
  return r[0] ?? null;
}

export async function updateCongress(id: number, data: Partial<typeof congresses.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(congresses).set(data).where(eq(congresses.id, id));
}

export async function deleteCongress(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(congresses).where(eq(congresses.id, id));
}

export async function getCommProposalsForCongress(congressId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(commProposals).where(eq(commProposals.congressId, congressId));
}

export async function createCommProposal(data: typeof commProposals.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(commProposals).values(sanitize(data));
  const r = await db.select().from(commProposals).orderBy(desc(commProposals.createdAt)).limit(1);
  return r[0] ?? null;
}

export async function getCommProposalInterests(communicationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(commProposalInterests).where(eq(commProposalInterests.communicationId, communicationId));
}

export async function toggleCommProposalInterest(communicationId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select({ id: commProposalInterests.id }).from(commProposalInterests)
    .where(and(eq(commProposalInterests.communicationId, communicationId), eq(commProposalInterests.userId, userId))).limit(1);
  if (existing.length > 0) {
    await db.delete(commProposalInterests).where(and(eq(commProposalInterests.communicationId, communicationId), eq(commProposalInterests.userId, userId)));
  } else {
    await db.insert(commProposalInterests).values({ communicationId, userId });
  }
}

// ─── Papers ───────────────────────────────────────────────────────────────────

export async function getAllPapers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(papers).orderBy(desc(papers.createdAt));
}

export async function getPaperById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const r = await db.select().from(papers).where(eq(papers.id, id)).limit(1);
  return r[0] ?? null;
}

export async function createPaper(data: typeof papers.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(papers).values(sanitize(data));
  const r = await db.select().from(papers).orderBy(desc(papers.createdAt)).limit(1);
  return r[0] ?? null;
}

export async function updatePaper(id: number, data: Partial<typeof papers.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(papers).set(data).where(eq(papers.id, id));
}

export async function deletePaper(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(papers).where(eq(papers.id, id));
}

export async function getPaperContributors(paperId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(paperContributors).where(eq(paperContributors.paperId, paperId));
}

export async function togglePaperContributor(paperId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select({ id: paperContributors.id }).from(paperContributors)
    .where(and(eq(paperContributors.paperId, paperId), eq(paperContributors.userId, userId))).limit(1);
  if (existing.length > 0) {
    await db.delete(paperContributors).where(and(eq(paperContributors.paperId, paperId), eq(paperContributors.userId, userId)));
  } else {
    await db.insert(paperContributors).values({ paperId, userId });
  }
}

// ─── Events ───────────────────────────────────────────────────────────────────

export async function getAllEvents() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(events).orderBy(desc(events.createdAt));
}

export async function getEventById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const r = await db.select().from(events).where(eq(events.id, id)).limit(1);
  return r[0] ?? null;
}

export async function createEvent(data: typeof events.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(events).values(sanitize(data));
  const r = await db.select().from(events).orderBy(desc(events.createdAt)).limit(1);
  return r[0] ?? null;
}

export async function updateEvent(id: number, data: Partial<typeof events.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(events).set(data).where(eq(events.id, id));
}

export async function deleteEvent(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(events).where(eq(events.id, id));
}

export async function getEventInterests(eventId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: eventInterests.id,
      eventId: eventInterests.eventId,
      userId: eventInterests.userId,
      createdAt: eventInterests.createdAt,
      userName: users.name,
    })
    .from(eventInterests)
    .leftJoin(users, eq(users.id, eventInterests.userId))
    .where(eq(eventInterests.eventId, eventId));
}

export async function toggleEventInterest(eventId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select({ id: eventInterests.id }).from(eventInterests)
    .where(and(eq(eventInterests.eventId, eventId), eq(eventInterests.userId, userId))).limit(1);
  if (existing.length > 0) {
    await db.delete(eventInterests).where(and(eq(eventInterests.eventId, eventId), eq(eventInterests.userId, userId)));
  } else {
    await db.insert(eventInterests).values({ eventId, userId });
  }
}

// ─── Documents ────────────────────────────────────────────────────────────────

export async function getAllDocuments(userRole: "admin" | "member") {
  const db = await getDb();
  if (!db) return [];
  if (userRole === "admin") {
    return db.select().from(documents).orderBy(desc(documents.createdAt));
  }
  return db.select().from(documents).where(eq(documents.accessLevel, "all")).orderBy(desc(documents.createdAt));
}

export async function getDocumentById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const r = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
  return r[0] ?? null;
}

export async function createDocument(data: typeof documents.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(documents).values(sanitize(data));
  const r = await db.select().from(documents).orderBy(desc(documents.createdAt)).limit(1);
  return r[0] ?? null;
}

export async function deleteDocument(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(documents).where(eq(documents.id, id));
}

export async function getAllFolders() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(documentFolders).orderBy(documentFolders.name);
}

export async function createFolder(data: typeof documentFolders.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(documentFolders).values(sanitize(data));
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

const assigneeAlias = aliasedTable(users, "assignee");

export async function getAllTasks() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: tasks.id,
      creatorId: tasks.creatorId,
      assigneeId: tasks.assigneeId,
      title: tasks.title,
      description: tasks.description,
      status: tasks.status,
      priority: tasks.priority,
      dueDate: tasks.dueDate,
      relatedModule: tasks.relatedModule,
      relatedId: tasks.relatedId,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
      assigneeName: assigneeAlias.name,
    })
    .from(tasks)
    .leftJoin(assigneeAlias, eq(assigneeAlias.id, tasks.assigneeId))
    .orderBy(desc(tasks.createdAt));
}

export async function getTaskById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const r = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  return r[0] ?? null;
}

export async function createTask(data: typeof tasks.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(tasks).values(sanitize(data));
  const r = await db.select().from(tasks).orderBy(desc(tasks.createdAt)).limit(1);
  return r[0] ?? null;
}

export async function updateTask(id: number, data: Partial<typeof tasks.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(tasks).set(data).where(eq(tasks.id, id));
}

export async function deleteTask(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(tasks).where(eq(tasks.id, id));
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function getNotificationsForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(50);
}

export async function createNotification(data: typeof notifications.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(notifications).values(sanitize(data));
}

export async function markNotificationRead(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
}

export async function markAllNotificationsRead(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
}

export async function getUnreadNotificationCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const r = await db.select({ count: sql<number>`count(*)` }).from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  return r[0]?.count ?? 0;
}

// ─── Legacy OAuth stubs (required by template _core files, not used at runtime) ─

/** @deprecated Not used — custom JWT auth replaces Manus OAuth */
export async function getUserByOpenId(_openId: string) {
  return null;
}

/** @deprecated Not used — custom JWT auth replaces Manus OAuth */
export async function upsertUser(_data: Record<string, unknown>) {
  return;
}
