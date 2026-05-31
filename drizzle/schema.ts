import {
  boolean,
  int,
  tinyint,
  mysqlEnum,
  mysqlTable,
  text,
  datetime,
  timestamp,
  varchar,
  bigint,
} from "drizzle-orm/mysql-core";

// ─── Users & Auth ────────────────────────────────────────────────────────────

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  role: mysqlEnum("role", ["admin", "member"]).default("member").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Member Profiles ──────────────────────────────────────────────────────────

export const profiles = mysqlTable("profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  photoUrl: text("photoUrl"),
  photoKey: text("photoKey"),
  bio: text("bio"),
  interests: text("interests"),
  university: varchar("university", { length: 255 }),
  department: varchar("department", { length: 255 }),
  researchArea: varchar("researchArea", { length: 255 }),
  orcid: varchar("orcid", { length: 64 }),
  googleScholar: varchar("googleScholar", { length: 512 }),
  researchGate: varchar("researchGate", { length: 512 }),
  scopus: varchar("scopus", { length: 512 }),
  webOfScience: varchar("webOfScience", { length: 512 }),
  linkedin: varchar("linkedin", { length: 512 }),
  personalWeb: varchar("personalWeb", { length: 512 }),
  cvPdfUrl: text("cvPdfUrl"),
  cvPdfKey: text("cvPdfKey"),
  keywords: text("keywords"),
  languages: text("languages"),
  availableToCollaborate: boolean("availableToCollaborate").default(true),
  showEmail: boolean("showEmail").default(false).notNull(),
  isPublic: boolean("isPublic").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = typeof profiles.$inferInsert;

// ─── News ─────────────────────────────────────────────────────────────────────

export const news = mysqlTable("news", {
  id: int("id").autoincrement().primaryKey(),
  authorId: int("authorId").notNull().references(() => users.id),
  title: varchar("title", { length: 512 }).notNull(),
  slug: varchar("slug", { length: 512 }).notNull().unique(),
  summary: text("summary"),
  content: text("content").notNull(),
  coverImageUrl: text("coverImageUrl"),
  coverImageKey: text("coverImageKey"),
  isPublished: boolean("isPublished").default(false).notNull(),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type News = typeof news.$inferSelect;
export type InsertNews = typeof news.$inferInsert;

// ─── Messages ─────────────────────────────────────────────────────────────────

export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  senderId: int("senderId").notNull().references(() => users.id),
  recipientId: int("recipientId").notNull().references(() => users.id),
  parentId: int("parentId"),
  subject: varchar("subject", { length: 512 }).notNull(),
  body: text("body").notNull(),
  isReadByRecipient: boolean("isReadByRecipient").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

export const messageAttachments = mysqlTable("messageAttachments", {
  id: int("id").autoincrement().primaryKey(),
  messageId: int("messageId").notNull().references(() => messages.id, { onDelete: "cascade" }),
  fileName: varchar("fileName", { length: 512 }).notNull(),
  fileKey: text("fileKey").notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileSize: bigint("fileSize", { mode: "number" }),
  mimeType: varchar("mimeType", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MessageAttachment = typeof messageAttachments.$inferSelect;

// ─── Meetings ─────────────────────────────────────────────────────────────────

export const meetings = mysqlTable("meetings", {
  id: int("id").autoincrement().primaryKey(),
  organizerId: int("organizerId").notNull().references(() => users.id),
  title: varchar("title", { length: 512 }).notNull(),
  description: text("description"),
  modality: mysqlEnum("modality", ["online", "in-person", "hybrid"]).notNull(),
  location: text("location"),
  meetingLink: text("meetingLink"),
  agenda: text("agenda"),
  type: mysqlEnum("type", ["fixed", "poll"]).default("fixed").notNull(),
  fixedDate: datetime("fixedDate"),
  pollDeadline: datetime("pollDeadline"),
  finalDate: datetime("finalDate"),
  status: mysqlEnum("status", ["scheduled", "cancelled", "completed"]).default("scheduled").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Meeting = typeof meetings.$inferSelect;
export type InsertMeeting = typeof meetings.$inferInsert;

export const meetingAttendance = mysqlTable("meetingAttendance", {
  id: int("id").autoincrement().primaryKey(),
  meetingId: int("meetingId").notNull().references(() => meetings.id, { onDelete: "cascade" }),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  response: mysqlEnum("response", ["attending", "maybe", "not_attending"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MeetingAttendance = typeof meetingAttendance.$inferSelect;

export const meetingDateOptions = mysqlTable("meetingDateOptions", {
  id: int("id").autoincrement().primaryKey(),
  meetingId: int("meetingId").notNull().references(() => meetings.id, { onDelete: "cascade" }),
  proposedDate: datetime("proposedDate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MeetingDateOption = typeof meetingDateOptions.$inferSelect;

export const meetingDateVotes = mysqlTable("meetingDateVotes", {
  id: int("id").autoincrement().primaryKey(),
  dateOptionId: int("dateOptionId").notNull().references(() => meetingDateOptions.id, { onDelete: "cascade" }),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MeetingDateVote = typeof meetingDateVotes.$inferSelect;

// ─── Congresses ───────────────────────────────────────────────────────────────

export const congresses = mysqlTable("congresses", {
  id: int("id").autoincrement().primaryKey(),
  creatorId: int("creatorId").notNull().references(() => users.id),
  name: varchar("name", { length: 512 }).notNull(),
  acronym: varchar("acronym", { length: 64 }),
  description: text("description"),
  location: varchar("location", { length: 512 }),
  country: varchar("country", { length: 128 }),
  modality: mysqlEnum("modality", ["in-person", "online", "hybrid"]),
  startDate: datetime("startDate"),
  endDate: datetime("endDate"),
  abstractDeadline: datetime("abstractDeadline"),
  paperDeadline: datetime("paperDeadline"),
  registrationDeadline: datetime("registrationDeadline"),
  registrationFee: varchar("registrationFee", { length: 128 }),
  websiteUrl: text("websiteUrl"),
  cfpUrl: text("cfpUrl"),
  cfpPdfKey: text("cfpPdfKey"),
  topic: text("topic"),
  additionalInfo: text("additionalInfo"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Congress = typeof congresses.$inferSelect;
export type InsertCongress = typeof congresses.$inferInsert;

export const commProposals = mysqlTable("commProposals", {
  id: int("id").autoincrement().primaryKey(),
  congressId: int("congressId").notNull().references(() => congresses.id, { onDelete: "cascade" }),
  proposerId: int("proposerId").notNull().references(() => users.id),
  title: varchar("title", { length: 512 }).notNull(),
  topic: text("topic"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CommProposal = typeof commProposals.$inferSelect;

export const commProposalInterests = mysqlTable("commProposalInterests", {
  id: int("id").autoincrement().primaryKey(),
  communicationId: int("communicationId").notNull().references(() => commProposals.id, { onDelete: "cascade" }),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Announcements ───────────────────────────────────────────────────────────

export const announcements = mysqlTable("announcements", {
  id: int("id").autoincrement().primaryKey(),
  authorId: int("authorId").notNull(),
  subject: varchar("subject", { length: 512 }).notNull(),
  body: text("body").notNull(),
  isPinned: tinyint("isPinned").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = typeof announcements.$inferInsert;

export const announcementReplies = mysqlTable("announcementReplies", {
  id: int("id").autoincrement().primaryKey(),
  announcementId: int("announcementId").notNull(),
  authorId: int("authorId").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AnnouncementReply = typeof announcementReplies.$inferSelect;

export const announcementAttachments = mysqlTable("announcementAttachments", {
  id: int("id").autoincrement().primaryKey(),
  announcementId: int("announcementId"),
  replyId: int("replyId"),
  fileName: varchar("fileName", { length: 512 }).notNull(),
  fileKey: text("fileKey").notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileSize: bigint("fileSize", { mode: "number" }),
  mimeType: varchar("mimeType", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AnnouncementAttachment = typeof announcementAttachments.$inferSelect;

// ─── Papers ───────────────────────────────────────────────────────────────────

export const papers = mysqlTable("papers", {
  id: int("id").autoincrement().primaryKey(),
  creatorId: int("creatorId").notNull().references(() => users.id),
  title: varchar("title", { length: 512 }).notNull(),
  abstract: text("abstract"),
  keywords: text("keywords"),
  targetJournal: varchar("targetJournal", { length: 512 }),
  methodology: text("methodology"),
  status: mysqlEnum("status", ["idea", "draft", "writing", "submitted", "under_review", "accepted", "published"]).default("idea").notNull(),
  deadline: datetime("deadline"),
  doiUrl: text("doiUrl"),
  additionalInfo: text("additionalInfo"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Paper = typeof papers.$inferSelect;
export type InsertPaper = typeof papers.$inferInsert;

export const paperContributors = mysqlTable("paperContributors", {
  id: int("id").autoincrement().primaryKey(),
  paperId: int("paperId").notNull().references(() => papers.id, { onDelete: "cascade" }),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PaperContributor = typeof paperContributors.$inferSelect;

// ─── Events ───────────────────────────────────────────────────────────────────

export const events = mysqlTable("events", {
  id: int("id").autoincrement().primaryKey(),
  creatorId: int("creatorId").notNull().references(() => users.id),
  title: varchar("title", { length: 512 }).notNull(),
  description: text("description"),
  eventDate: datetime("eventDate"),
  endDate: datetime("endDate"),
  location: varchar("location", { length: 512 }),
  modality: mysqlEnum("modality", ["in-person", "online", "hybrid"]),
  websiteUrl: text("websiteUrl"),
  topic: text("topic"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;

export const eventInterests = mysqlTable("eventInterests", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull().references(() => events.id, { onDelete: "cascade" }),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Documents ────────────────────────────────────────────────────────────────

export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  uploaderId: int("uploaderId").notNull().references(() => users.id),
  folderId: int("folderId"),
  fileName: varchar("fileName", { length: 512 }).notNull(),
  fileKey: text("fileKey").notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileSize: bigint("fileSize", { mode: "number" }),
  mimeType: varchar("mimeType", { length: 128 }),
  description: text("description"),
  accessLevel: mysqlEnum("accessLevel", ["all", "admin"]).default("all").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

export const documentFolders = mysqlTable("documentFolders", {
  id: int("id").autoincrement().primaryKey(),
  creatorId: int("creatorId").notNull().references(() => users.id),
  parentId: int("parentId"),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Tasks ────────────────────────────────────────────────────────────────────

export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  creatorId: int("creatorId").notNull().references(() => users.id),
  assigneeId: int("assigneeId").references(() => users.id),
  title: varchar("title", { length: 512 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["todo", "in_progress", "done"]).default("todo").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high"]).default("medium").notNull(),
  dueDate: datetime("dueDate"),
  relatedModule: varchar("relatedModule", { length: 64 }),
  relatedId: int("relatedId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

// ─── Notifications ────────────────────────────────────────────────────────────

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 64 }).notNull(),
  title: varchar("title", { length: 512 }).notNull(),
  body: text("body"),
  relatedModule: varchar("relatedModule", { length: 64 }),
  relatedId: int("relatedId"),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// ─── App Settings ─────────────────────────────────────────────────────────────

export const appSettings = mysqlTable("appSettings", {
  id: int("id").autoincrement().primaryKey(),
  settingKey: varchar("settingKey", { length: 128 }).notNull(),
  settingValue: text("settingValue"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type AppSetting = typeof appSettings.$inferSelect;

// ─── Links ────────────────────────────────────────────────────────────────────
export const links = mysqlTable("links", {
  id: int("id").autoincrement().primaryKey(),
  creatorId: int("creatorId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  url: varchar("url", { length: 1000 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Link = typeof links.$inferSelect;
export type InsertLink = typeof links.$inferInsert;

// ─── Comm Proposal Attendance ─────────────────────────────────────────────────
export const commProposalAttendance = mysqlTable("commProposalAttendance", {
  id: int("id").autoincrement().primaryKey(),
  communicationId: int("communicationId").notNull().references(() => commProposals.id, { onDelete: "cascade" }),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  response: mysqlEnum("response", ["attending", "maybe", "not_attending"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CommProposalAttendance = typeof commProposalAttendance.$inferSelect;

// ─── Project Proposals ────────────────────────────────────────────────────────
export const projectProposals = mysqlTable("projectProposals", {
  id: int("id").autoincrement().primaryKey(),
  creatorId: int("creatorId").notNull().references(() => users.id),
  title: varchar("title", { length: 512 }).notNull(),
  description: text("description"),
  objectives: text("objectives"),
  methodology: text("methodology"),
  expectedOutcomes: text("expectedOutcomes"),
  fundingSource: varchar("fundingSource", { length: 255 }),
  budget: varchar("budget", { length: 128 }),
  startDate: datetime("startDate"),
  endDate: datetime("endDate"),
  status: mysqlEnum("status", ["idea", "draft", "submitted", "approved", "rejected", "active", "completed"]).default("idea").notNull(),
  keywords: text("keywords"),
  additionalInfo: text("additionalInfo"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ProjectProposal = typeof projectProposals.$inferSelect;
export type InsertProjectProposal = typeof projectProposals.$inferInsert;

export const projectProposalInterests = mysqlTable("projectProposalInterests", {
  id: int("id").autoincrement().primaryKey(),
  proposalId: int("proposalId").notNull().references(() => projectProposals.id, { onDelete: "cascade" }),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ProjectProposalInterest = typeof projectProposalInterests.$inferSelect;

// ─── Congress Attendance ──────────────────────────────────────────────────────
export const congressAttendance = mysqlTable("congressAttendance", {
  id: int("id").autoincrement().primaryKey(),
  congressId: int("congressId").notNull().references(() => congresses.id, { onDelete: "cascade" }),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  response: mysqlEnum("response", ["attending", "maybe", "not_attending"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CongressAttendance = typeof congressAttendance.$inferSelect;

// ─── Research Lines ───────────────────────────────────────────────────────────
export const researchLines = mysqlTable("researchLines", {
  id: int("id").autoincrement().primaryKey(),
  creatorId: int("creatorId").notNull().references(() => users.id, { onDelete: "no action" }),
  title: varchar("title", { length: 512 }).notNull(),
  description: text("description"),
  objectives: text("objectives"),
  keywords: varchar("keywords", { length: 512 }),
  status: mysqlEnum("status", ["active", "inactive", "completed"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ResearchLine = typeof researchLines.$inferSelect;
export type InsertResearchLine = typeof researchLines.$inferInsert;

export const researchLineMembers = mysqlTable("researchLineMembers", {
  id: int("id").autoincrement().primaryKey(),
  lineId: int("lineId").notNull().references(() => researchLines.id, { onDelete: "cascade" }),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: mysqlEnum("role", ["lead", "member"]).default("member").notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});
export type ResearchLineMember = typeof researchLineMembers.$inferSelect;
