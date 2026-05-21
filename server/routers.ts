import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { systemRouter } from "./_core/systemRouter";
import { loginUser, registerUser, getUserFromToken } from "./auth";
import {
  getAllUsers, getUserById, updateUser, deleteUser,
  getProfileByUserId, upsertProfile, getAllPublicProfiles,
  getPublishedNews, getAllNews, getNewsBySlug, getNewsById, createNews, updateNews, deleteNews,
  getInboxForUser, getSentByUser, getMessageById, createMessage, markMessageRead,
  getAttachmentsForMessage, createMessageAttachment,
  getAllMeetings, getMeetingById, createMeeting, updateMeeting, deleteMeeting,
  getMeetingAttendance, upsertAttendance, getMeetingDateOptions, createDateOption,
  getVotesForOption, toggleDateVote,
  getAllCongresses, getCongressById, createCongress, updateCongress, deleteCongress,
  getCommProposalsForCongress, createCommProposal, getCommProposalInterests, toggleCommProposalInterest,
  getAllPapers, getPaperById, createPaper, updatePaper, deletePaper,
  getPaperContributors, togglePaperContributor,
  getAllEvents, getEventById, createEvent, updateEvent, deleteEvent,
  getEventInterests, toggleEventInterest,
  getAllDocuments, getDocumentById, createDocument, deleteDocument,
  getAllFolders, createFolder,
  getAllTasks, createTask, updateTask, deleteTask,
  getNotificationsForUser, createNotification, markNotificationRead,
  markAllNotificationsRead, getUnreadNotificationCount,
} from "./db";
import { storagePut } from "./storage";
import { invokeLLM } from "./_core/llm";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now();
}

// ─── Auth Router ──────────────────────────────────────────────────────────────

const authRouter = router({
  me: publicProcedure.query(async ({ ctx }) => {
    const token = ctx.req.cookies?.["auth_token"];
    if (!token) return null;
    return getUserFromToken(token);
  }),

  login: publicProcedure
    .input(z.object({ email: z.string().email(), password: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      try {
        const { user, token } = await loginUser(input);
        const isHttps = ctx.req.headers["x-forwarded-proto"] === "https" || ctx.req.protocol === "https";
        ctx.res.cookie("auth_token", token, {
          httpOnly: true,
          secure: isHttps,
          sameSite: "lax",
          maxAge: 7 * 24 * 60 * 60 * 1000,
          path: "/",
        });
        return { success: true, user };
      } catch (e: any) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: e.message });
      }
    }),

  logout: publicProcedure.mutation(({ ctx }) => {
    ctx.res.clearCookie("auth_token", { path: "/" });
    return { success: true };
  }),

  register: adminProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(8),
      name: z.string().min(1),
      role: z.enum(["admin", "member"]).default("member"),
    }))
    .mutation(async ({ input }) => {
      try {
        const { user } = await registerUser(input);
        return { success: true, user };
      } catch (e: any) {
        throw new TRPCError({ code: "CONFLICT", message: e.message });
      }
    }),
});

// ─── Users Router ─────────────────────────────────────────────────────────────

const usersRouter = router({
  list: adminProcedure.query(() => getAllUsers()),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getUserById(input.id)),

  update: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      email: z.string().email().optional(),
      role: z.enum(["admin", "member"]).optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(({ input }) => {
      const { id, ...data } = input;
      return updateUser(id, data);
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteUser(input.id)),
});

// ─── Profiles Router ──────────────────────────────────────────────────────────

const profilesRouter = router({
  publicList: publicProcedure.query(() => getAllPublicProfiles()),

  publicGetByUserId: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getProfileByUserId(input.userId)),

  getMyProfile: protectedProcedure.query(({ ctx }) => getProfileByUserId(ctx.user.id)),

  getByUserId: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getProfileByUserId(input.userId)),

  update: protectedProcedure
    .input(z.object({
      bio: z.string().optional(),
      interests: z.string().optional(),
      university: z.string().optional(),
      department: z.string().optional(),
      researchArea: z.string().optional(),
      orcid: z.string().optional(),
      googleScholar: z.string().optional(),
      researchGate: z.string().optional(),
      scopus: z.string().optional(),
      webOfScience: z.string().optional(),
      linkedin: z.string().optional(),
      personalWeb: z.string().optional(),
      keywords: z.string().optional(),
      languages: z.string().optional(),
      availableToCollaborate: z.boolean().optional(),
      isPublic: z.boolean().optional(),
    }))
    .mutation(({ input, ctx }) => upsertProfile(ctx.user.id, input)),

  uploadPhoto: protectedProcedure
    .input(z.object({ base64: z.string(), mimeType: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const buffer = Buffer.from(input.base64, "base64");
      const key = `profiles/${ctx.user.id}/photo-${Date.now()}.jpg`;
      const { url } = await storagePut(key, buffer, input.mimeType);
      await upsertProfile(ctx.user.id, { photoUrl: url, photoKey: key });
      return { url };
    }),

  uploadCv: protectedProcedure
    .input(z.object({ base64: z.string(), fileName: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const buffer = Buffer.from(input.base64, "base64");
      const key = `profiles/${ctx.user.id}/cv-${Date.now()}.pdf`;
      const { url } = await storagePut(key, buffer, "application/pdf");
      await upsertProfile(ctx.user.id, { cvPdfUrl: url, cvPdfKey: key });
      return { url };
    }),
});

// ─── News Router ──────────────────────────────────────────────────────────────

const newsRouter = router({
  publicList: publicProcedure.query(() => getPublishedNews()),

  publicBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(({ input }) => getNewsBySlug(input.slug)),

  adminList: adminProcedure.query(() => getAllNews()),

  create: adminProcedure
    .input(z.object({
      title: z.string().min(1),
      summary: z.string().optional(),
      content: z.string().min(1),
      isPublished: z.boolean().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      const slug = slugify(input.title);
      return createNews({
        ...input,
        slug,
        authorId: ctx.user.id,
        publishedAt: input.isPublished ? new Date() : undefined,
      });
    }),

  update: adminProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      summary: z.string().optional(),
      content: z.string().optional(),
      isPublished: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const update: any = { ...data };
      if (data.isPublished) {
        const existing = await getNewsById(id);
        if (!existing?.publishedAt) update.publishedAt = new Date();
      }
      return updateNews(id, update);
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteNews(input.id)),
});

// ─── Messages Router ──────────────────────────────────────────────────────────

const messagesRouter = router({
  inbox: protectedProcedure.query(({ ctx }) => getInboxForUser(ctx.user.id)),
  sent: protectedProcedure.query(({ ctx }) => getSentByUser(ctx.user.id)),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const msg = await getMessageById(input.id);
      if (!msg) throw new TRPCError({ code: "NOT_FOUND" });
      if (msg.senderId !== ctx.user.id && msg.recipientId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      if (msg.recipientId === ctx.user.id && !msg.isReadByRecipient) {
        await markMessageRead(input.id);
      }
      const attachments = await getAttachmentsForMessage(input.id);
      const [sender, recipient] = await Promise.all([
        getUserById(msg.senderId),
        getUserById(msg.recipientId),
      ]);
      return { ...msg, attachments, senderName: sender?.name ?? null, recipientName: recipient?.name ?? null };
    }),

  send: protectedProcedure
    .input(z.object({
      recipientId: z.number(),
      subject: z.string().min(1),
      body: z.string().min(1),
      parentId: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const msg = await createMessage({ ...input, senderId: ctx.user.id });
      if (msg) {
        await createNotification({
          userId: input.recipientId,
          type: "message",
          title: "New message",
          body: `You have a new message: "${input.subject}"`,
          relatedModule: "messages",
          relatedId: msg.id,
        });
      }
      return msg;
    }),

  uploadAttachment: protectedProcedure
    .input(z.object({
      messageId: z.number(),
      base64: z.string(),
      fileName: z.string(),
      mimeType: z.string(),
      fileSize: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const msg = await getMessageById(input.messageId);
      if (!msg || msg.senderId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      const buffer = Buffer.from(input.base64, "base64");
      const key = `messages/${input.messageId}/${Date.now()}-${input.fileName}`;
      const { url } = await storagePut(key, buffer, input.mimeType);
      await createMessageAttachment({
        messageId: input.messageId,
        fileName: input.fileName,
        fileKey: key,
        fileUrl: url,
        fileSize: input.fileSize,
        mimeType: input.mimeType,
      });
      return { url };
    }),
});

// ─── Meetings Router ──────────────────────────────────────────────────────────

const meetingsRouter = router({
  list: protectedProcedure.query(() => getAllMeetings()),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const meeting = await getMeetingById(input.id);
      if (!meeting) throw new TRPCError({ code: "NOT_FOUND" });
      const attendance = await getMeetingAttendance(input.id);
      const dateOptions = await getMeetingDateOptions(input.id);
      const optionsWithVotes = await Promise.all(
        dateOptions.map(async (opt) => ({
          ...opt,
          votes: await getVotesForOption(opt.id),
        }))
      );
      return { ...meeting, attendance, dateOptions: optionsWithVotes };
    }),

  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      modality: z.enum(["online", "in-person", "hybrid"]),
      location: z.string().optional(),
      meetingLink: z.string().optional(),
      agenda: z.string().optional(),
      type: z.enum(["fixed", "poll"]),
      fixedDate: z.coerce.date().optional(),
      pollDeadline: z.coerce.date().optional(),
      dateOptions: z.array(z.coerce.date()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { dateOptions, ...meetingData } = input;
      const meeting = await createMeeting({ ...meetingData, organizerId: ctx.user.id });
      if (meeting && input.type === "poll" && dateOptions) {
        for (const d of dateOptions) {
          await createDateOption(meeting.id, d);
        }
      }
      const allUsers = await getAllUsers();
      for (const u of allUsers) {
        if (u.id !== ctx.user.id) {
          await createNotification({
            userId: u.id,
            type: "meeting",
            title: "New meeting created",
            body: `"${input.title}" has been scheduled`,
            relatedModule: "meetings",
            relatedId: meeting?.id,
          });
        }
      }
      return meeting;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      modality: z.enum(["online", "in-person", "hybrid"]).optional(),
      location: z.string().optional(),
      meetingLink: z.string().optional(),
      agenda: z.string().optional(),
      status: z.enum(["scheduled", "cancelled", "completed"]).optional(),
      finalDate: z.coerce.date().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const meeting = await getMeetingById(input.id);
      if (!meeting) throw new TRPCError({ code: "NOT_FOUND" });
      if (meeting.organizerId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const { id, ...data } = input;
      return updateMeeting(id, data);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const meeting = await getMeetingById(input.id);
      if (!meeting) throw new TRPCError({ code: "NOT_FOUND" });
      if (meeting.organizerId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return deleteMeeting(input.id);
    }),

  respond: protectedProcedure
    .input(z.object({
      meetingId: z.number(),
      response: z.enum(["attending", "maybe", "not_attending"]),
    }))
    .mutation(({ input, ctx }) => upsertAttendance(input.meetingId, ctx.user.id, input.response)),

  voteDate: protectedProcedure
    .input(z.object({ dateOptionId: z.number() }))
    .mutation(({ input, ctx }) => toggleDateVote(input.dateOptionId, ctx.user.id)),

  finalizePollDate: protectedProcedure
    .input(z.object({ meetingId: z.number(), dateOptionId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const meeting = await getMeetingById(input.meetingId);
      if (!meeting) throw new TRPCError({ code: "NOT_FOUND" });
      if (meeting.organizerId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const options = await getMeetingDateOptions(input.meetingId);
      const chosen = options.find((o) => o.id === input.dateOptionId);
      if (!chosen) throw new TRPCError({ code: "NOT_FOUND" });
      return updateMeeting(input.meetingId, { finalDate: chosen.proposedDate, type: "fixed" });
    }),
});

// ─── Congresses Router ────────────────────────────────────────────────────────

const congressesRouter = router({
  list: protectedProcedure.query(() => getAllCongresses()),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const congress = await getCongressById(input.id);
      if (!congress) throw new TRPCError({ code: "NOT_FOUND" });
      const proposals = await getCommProposalsForCongress(input.id);
      const proposalsWithInterests = await Promise.all(
        proposals.map(async (p) => ({
          ...p,
          interests: await getCommProposalInterests(p.id),
        }))
      );
      return { ...congress, proposals: proposalsWithInterests };
    }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      topic: z.string().optional(),
      startDate: z.coerce.date().optional(),
      endDate: z.coerce.date().optional(),
      location: z.string().optional(),
      modality: z.enum(["in-person", "online", "hybrid"]),
      registrationFee: z.string().optional(),
      websiteUrl: z.string().optional(),
      cfpUrl: z.string().optional(),
      abstractDeadline: z.coerce.date().optional(),
      additionalInfo: z.string().optional(),
    }))
    .mutation(({ input, ctx }) => createCongress({ ...input, creatorId: ctx.user.id })),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      topic: z.string().optional(),
      startDate: z.coerce.date().optional(),
      endDate: z.coerce.date().optional(),
      location: z.string().optional(),
      modality: z.enum(["in-person", "online", "hybrid"]).optional(),
      registrationFee: z.string().optional(),
      websiteUrl: z.string().optional(),
      cfpUrl: z.string().optional(),
      abstractDeadline: z.coerce.date().optional(),
      additionalInfo: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const congress = await getCongressById(input.id);
      if (!congress) throw new TRPCError({ code: "NOT_FOUND" });
      if (congress.creatorId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const { id, ...data } = input;
      return updateCongress(id, data);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const congress = await getCongressById(input.id);
      if (!congress) throw new TRPCError({ code: "NOT_FOUND" });
      if (congress.creatorId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return deleteCongress(input.id);
    }),

  createProposal: protectedProcedure
    .input(z.object({
      congressId: z.number(),
      title: z.string().min(1),
      topic: z.string().optional(),
    }))
    .mutation(({ input, ctx }) => createCommProposal({ ...input, proposerId: ctx.user.id })),

  toggleProposalInterest: protectedProcedure
    .input(z.object({ communicationId: z.number() }))
    .mutation(({ input, ctx }) => toggleCommProposalInterest(input.communicationId, ctx.user.id)),
});

// ─── Papers Router ────────────────────────────────────────────────────────────

const papersRouter = router({
  list: protectedProcedure.query(() => getAllPapers()),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const paper = await getPaperById(input.id);
      if (!paper) throw new TRPCError({ code: "NOT_FOUND" });
      const contributors = await getPaperContributors(input.id);
      return { ...paper, contributors };
    }),

  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      abstract: z.string().optional(),
      keywords: z.string().optional(),
      targetJournal: z.string().optional(),
      methodology: z.string().optional(),
      status: z.enum(["idea", "draft", "writing", "submitted", "under_review", "accepted", "published"]).default("idea"),
      deadline: z.coerce.date().optional(),
      additionalInfo: z.string().optional(),
    }))
    .mutation(({ input, ctx }) => createPaper({ ...input, creatorId: ctx.user.id })),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      abstract: z.string().optional(),
      keywords: z.string().optional(),
      targetJournal: z.string().optional(),
      methodology: z.string().optional(),
      status: z.enum(["idea", "draft", "writing", "submitted", "under_review", "accepted", "published"]).optional(),
      deadline: z.coerce.date().optional(),
      doiUrl: z.string().optional(),
      additionalInfo: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const paper = await getPaperById(input.id);
      if (!paper) throw new TRPCError({ code: "NOT_FOUND" });
      if (paper.creatorId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const { id, ...data } = input;
      return updatePaper(id, data);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const paper = await getPaperById(input.id);
      if (!paper) throw new TRPCError({ code: "NOT_FOUND" });
      if (paper.creatorId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return deletePaper(input.id);
    }),

  toggleContributor: protectedProcedure
    .input(z.object({ paperId: z.number() }))
    .mutation(({ input, ctx }) => togglePaperContributor(input.paperId, ctx.user.id)),
});

// ─── Events Router ────────────────────────────────────────────────────────────

const eventsRouter = router({
  list: protectedProcedure.query(() => getAllEvents()),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const event = await getEventById(input.id);
      if (!event) throw new TRPCError({ code: "NOT_FOUND" });
      const interests = await getEventInterests(input.id);
      return { ...event, interests };
    }),

  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      eventDate: z.coerce.date().optional(),
      endDate: z.coerce.date().optional(),
      location: z.string().optional(),
      modality: z.enum(["in-person", "online", "hybrid"]).optional(),
      websiteUrl: z.string().optional(),
      topic: z.string().optional(),
    }))
    .mutation(({ input, ctx }) => createEvent({ ...input, creatorId: ctx.user.id })),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      eventDate: z.coerce.date().optional(),
      endDate: z.coerce.date().optional(),
      location: z.string().optional(),
      modality: z.enum(["in-person", "online", "hybrid"]).optional(),
      websiteUrl: z.string().optional(),
      topic: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const event = await getEventById(input.id);
      if (!event) throw new TRPCError({ code: "NOT_FOUND" });
      if (event.creatorId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const { id, ...data } = input;
      return updateEvent(id, data);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const event = await getEventById(input.id);
      if (!event) throw new TRPCError({ code: "NOT_FOUND" });
      if (event.creatorId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return deleteEvent(input.id);
    }),

  toggleInterest: protectedProcedure
    .input(z.object({ eventId: z.number() }))
    .mutation(({ input, ctx }) => toggleEventInterest(input.eventId, ctx.user.id)),
});

// ─── Documents Router ─────────────────────────────────────────────────────────

const documentsRouter = router({
  list: protectedProcedure.query(({ ctx }) => getAllDocuments(ctx.user.role as "admin" | "member")),
  folders: protectedProcedure.query(() => getAllFolders()),

  upload: protectedProcedure
    .input(z.object({
      base64: z.string(),
      fileName: z.string(),
      mimeType: z.string(),
      fileSize: z.number().optional(),
      description: z.string().optional(),
      folderId: z.number().optional(),
      accessLevel: z.enum(["all", "admin"]).default("all"),
    }))
    .mutation(async ({ input, ctx }) => {
      if (input.accessLevel === "admin" && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const buffer = Buffer.from(input.base64, "base64");
      const key = `documents/${ctx.user.id}/${Date.now()}-${input.fileName}`;
      const { url } = await storagePut(key, buffer, input.mimeType);
      return createDocument({
        uploaderId: ctx.user.id,
        fileName: input.fileName,
        fileKey: key,
        fileUrl: url,
        fileSize: input.fileSize,
        mimeType: input.mimeType,
        description: input.description,
        folderId: input.folderId,
        accessLevel: input.accessLevel,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const doc = await getDocumentById(input.id);
      if (!doc) throw new TRPCError({ code: "NOT_FOUND" });
      if (doc.uploaderId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return deleteDocument(input.id);
    }),

  createFolder: protectedProcedure
    .input(z.object({ name: z.string().min(1), parentId: z.number().optional() }))
    .mutation(({ input, ctx }) => createFolder({ ...input, creatorId: ctx.user.id })),
});

// ─── Tasks Router ─────────────────────────────────────────────────────────────

const tasksRouter = router({
  list: protectedProcedure.query(() => getAllTasks()),

  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      assigneeId: z.number().optional(),
      status: z.enum(["todo", "in_progress", "done"]).default("todo"),
      priority: z.enum(["low", "medium", "high"]).default("medium"),
      dueDate: z.coerce.date().optional(),
      relatedModule: z.string().optional(),
      relatedId: z.number().optional(),
    }))
    .mutation(({ input, ctx }) => createTask({ ...input, creatorId: ctx.user.id })),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      assigneeId: z.number().optional(),
      status: z.enum(["todo", "in_progress", "done"]).optional(),
      priority: z.enum(["low", "medium", "high"]).optional(),
      dueDate: z.coerce.date().optional(),
    }))
    .mutation(({ input }) => {
      const { id, ...data } = input;
      return updateTask(id, data);
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteTask(input.id)),
});

// ─── Notifications Router ─────────────────────────────────────────────────────

const notificationsRouter = router({
  list: protectedProcedure.query(({ ctx }) => getNotificationsForUser(ctx.user.id)),
  unreadCount: protectedProcedure.query(({ ctx }) => getUnreadNotificationCount(ctx.user.id)),

  markRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => markNotificationRead(input.id)),

  markAllRead: protectedProcedure.mutation(({ ctx }) => markAllNotificationsRead(ctx.user.id)),
});

// ─── AI Assistant Router ──────────────────────────────────────────────────────

const aiRouter = router({
  suggestJournals: protectedProcedure
    .input(z.object({ abstract: z.string().min(10), keywords: z.string().optional() }))
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are an academic publishing expert. Given a paper abstract and keywords, suggest 5 relevant academic journals with a brief justification for each. Format as JSON array with fields: name, publisher, impactFactor (if known), justification.",
          },
          {
            role: "user",
            content: `Abstract: ${input.abstract}\nKeywords: ${input.keywords ?? ""}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "journal_suggestions",
            strict: true,
            schema: {
              type: "object",
              properties: {
                journals: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      publisher: { type: "string" },
                      impactFactor: { type: "string" },
                      justification: { type: "string" },
                    },
                    required: ["name", "publisher", "impactFactor", "justification"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["journals"],
              additionalProperties: false,
            },
          },
        },
      });
      const content = (response.choices[0]?.message?.content as string) ?? "{}";
      return JSON.parse(content);
    }),

  summarizeMeeting: protectedProcedure
    .input(z.object({ notes: z.string().min(10) }))
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are an academic meeting secretary. Given meeting notes, produce a structured summary with: key decisions, action items with owners, open questions, and a brief executive summary. Be concise and professional.",
          },
          { role: "user", content: input.notes },
        ],
      });
      return { summary: (response.choices[0]?.message?.content as string) ?? "" };
    }),

  draftCongressDescription: protectedProcedure
    .input(z.object({ name: z.string(), topic: z.string(), details: z.string().optional() }))
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are an academic communications expert. Draft a professional, engaging congress/conference description suitable for a research group's internal platform. Keep it informative, concise, and highlight relevance to AI, technology, and human wellbeing research.",
          },
          {
            role: "user",
            content: `Congress name: ${input.name}\nTopic: ${input.topic}\nAdditional details: ${input.details ?? ""}`,
          },
        ],
      });
      return { draft: (response.choices[0]?.message?.content as string) ?? "" };
    }),
});

// ─── App Router ───────────────────────────────────────────────────────────────

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  users: usersRouter,
  profiles: profilesRouter,
  news: newsRouter,
  messages: messagesRouter,
  meetings: meetingsRouter,
  congresses: congressesRouter,
  papers: papersRouter,
  events: eventsRouter,
  documents: documentsRouter,
  tasks: tasksRouter,
  notifications: notificationsRouter,
  ai: aiRouter,
});

export type AppRouter = typeof appRouter;
