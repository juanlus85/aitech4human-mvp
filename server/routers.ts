import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { systemRouter } from "./_core/systemRouter";
import { loginUser, registerUser, getUserFromToken, hashPassword, verifyPassword } from "./auth";
import {
  getAllUsers, getUserById, updateUser, deleteUser, updateUserPassword,
  getProfileByUserId, upsertProfile, getAllPublicProfiles,
  getPublishedNews, getAllNews, getNewsBySlug, getNewsById, createNews, updateNews, deleteNews,
  getInboxForUser, getSentByUser, getMessageById, createMessage, markMessageRead,
  getAttachmentsForMessage, createMessageAttachment,
  getAllMeetings, getMeetingById, createMeeting, updateMeeting, deleteMeeting,
  getMeetingAttendance, upsertAttendance, getMeetingDateOptions, createDateOption,
  getAppSettings, upsertAppSetting,
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
  getAllAnnouncements, getAnnouncementById, createAnnouncement, updateAnnouncement, deleteAnnouncement,
  getAnnouncementReplies, createAnnouncementReply, deleteAnnouncementReply,
  getAnnouncementAttachments,
  getAllLinks, createLink, deleteLink, updateLink,
  getCommProposalAttendance, upsertCommProposalAttendance, removeCommProposalAttendance,
  getCongressAttendance, upsertCongressAttendance, removeCongressAttendance,
  getAllProjectProposals, getProjectProposalById, createProjectProposal, updateProjectProposal, deleteProjectProposal,
  getProjectProposalInterests, toggleProjectProposalInterest,
  getAllResearchLines, createResearchLine, updateResearchLine, deleteResearchLine,
  joinResearchLine, leaveResearchLine,
} from "./db";
import { storagePut } from "./storage";
import { invokeLLM } from "./_core/llm";
import { notifyMembers, sendEmail } from "./email";
import { getAllUserEmails } from "./db";

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
  sendWelcomeEmail: adminProcedure
    .input(z.object({
      userId: z.number(),
      password: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      const user = await getUserById(input.userId);
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);padding:32px 40px;border-radius:12px 12px 0 0;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">AI&amp;Tech4Human</h1>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Research &amp; Innovation Group</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:40px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
            <p style="margin:0 0 16px;color:#374151;font-size:15px;">Dear <strong>${user.name}</strong>,</p>
            <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
              Welcome to the <strong>AI&amp;Tech4Human Research &amp; Innovation Group</strong> collaboration platform. Your account has been created and you can now access the member area.
            </p>
            <!-- Credentials box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;margin:24px 0;">
              <tr><td style="padding:20px 24px;">
                <p style="margin:0 0 12px;color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Your access credentials</p>
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:4px 0;color:#6b7280;font-size:14px;width:100px;">Website:</td>
                    <td style="padding:4px 0;"><a href="https://research.blancoguzman.es" style="color:#6366f1;font-size:14px;text-decoration:none;">research.blancoguzman.es</a></td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;color:#6b7280;font-size:14px;">Username:</td>
                    <td style="padding:4px 0;color:#111827;font-size:14px;font-weight:600;">${user.email}</td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;color:#6b7280;font-size:14px;">Password:</td>
                    <td style="padding:4px 0;color:#111827;font-size:14px;font-weight:600;">${input.password}</td>
                  </tr>
                </table>
              </td></tr>
            </table>
            <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
              You can change your password at any time from your <a href="https://research.blancoguzman.es/dashboard/profile" style="color:#6366f1;">profile settings</a> once logged in. If you have any questions, please do not hesitate to contact the Lead Researcher, Juan Luis Blanco Guzmán, at <a href="mailto:jbguzman@us.es" style="color:#6366f1;">jbguzman@us.es</a>.
            </p>
            <p style="margin:24px 0 0;color:#374151;font-size:15px;">Best regards,<br /><strong>AI&amp;Tech4Human Research &amp; Innovation Group</strong></p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:20px 40px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
            <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">
              This email was sent to ${user.email} because an account was created for you on the AI&amp;Tech4Human platform.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
      const sent = await sendEmail({
        to: user.email,
        subject: "Welcome to AI&Tech4Human Research & Innovation Group",
        html,
        text: `Dear ${user.name},\n\nWelcome to the AI&Tech4Human Research & Innovation Group collaboration platform. Your account has been created and you can now access the member area.\n\nWebsite: https://research.blancoguzman.es\nUsername: ${user.email}\nPassword: ${input.password}\n\nYou can change your password at any time from your profile settings (https://research.blancoguzman.es/dashboard/profile) once logged in. If you have any questions, please do not hesitate to contact the Lead Researcher, Juan Luis Blanco Guzmán, at jbguzman@us.es.\n\nBest regards,\nAI&Tech4Human Research & Innovation Group`,
      });
            if (!sent) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "SMTP not configured or email failed. Please check Settings > SMTP." });
      return { success: true };
    }),
  changePassword: protectedProcedure
    .input(z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(8),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await getUserById(ctx.user.id);
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      const valid = await verifyPassword(input.currentPassword, user.passwordHash);
      if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "Current password is incorrect" });
      const newHash = await hashPassword(input.newPassword);
      await updateUserPassword(user.id, newHash);
      return { success: true };
    }),
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
      notifyEmail: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { dateOptions, notifyEmail, ...meetingData } = input;
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
            if (notifyEmail && meeting) {
        try {
          const emails = await getAllUserEmails();
          const dateStr = input.fixedDate ? new Date(input.fixedDate).toLocaleString() : "TBD (date poll)";
          await notifyMembers({
            subject: `New Meeting: ${input.title}`,
            title: `New Meeting: ${input.title}`,
            body: `Date: ${dateStr}\nModality: ${input.modality}${input.location ? `\nLocation: ${input.location}` : ""}${input.agenda ? `\nAgenda: ${input.agenda}` : ""}`,
            memberEmails: emails,
          });
        } catch (err) {
          console.error("[Email] Failed to send meeting notification:", err);
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
      acronym: z.string().optional(),
      description: z.string().optional(),
      topic: z.string().optional(),
      startDate: z.coerce.date().optional(),
      endDate: z.coerce.date().optional(),
      location: z.string().optional(),
      country: z.string().optional(),
      modality: z.enum(["in-person", "online", "hybrid"]).optional(),
      registrationFee: z.string().optional(),
      websiteUrl: z.string().optional(),
      cfpUrl: z.string().optional(),
      abstractDeadline: z.coerce.date().optional(),
      paperDeadline: z.coerce.date().optional(),
      registrationDeadline: z.coerce.date().optional(),
      additionalInfo: z.string().optional(),
      notifyEmail: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { notifyEmail, ...data } = input;
      const result = await createCongress({ ...data, creatorId: ctx.user.id });
      if (notifyEmail && result) {
        const emails = await getAllUserEmails();
        await notifyMembers({
          subject: `New Conference: ${result.name}`,
          title: `New Conference: ${result.name}`,
          body: [
            result.acronym ? `Acronym: ${result.acronym}` : "",
            result.topic ? `Topic: ${result.topic}` : "",
            result.location ? `Location: ${result.location}` : "",
            result.startDate ? `Start date: ${new Date(result.startDate).toLocaleDateString()}` : "",
            result.websiteUrl ? `Website: ${result.websiteUrl}` : "",
            result.description ? `\n${result.description}` : "",
          ].filter(Boolean).join("\n"),
          memberEmails: emails,
        });
      }
      return result;
    }),
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      acronym: z.string().optional(),
      description: z.string().optional(),
      topic: z.string().optional(),
      startDate: z.coerce.date().optional(),
      endDate: z.coerce.date().optional(),
      location: z.string().optional(),
      country: z.string().optional(),
      modality: z.enum(["in-person", "online", "hybrid"]).optional(),
      registrationFee: z.string().optional(),
      websiteUrl: z.string().optional(),
      cfpUrl: z.string().optional(),
      abstractDeadline: z.coerce.date().optional(),
      paperDeadline: z.coerce.date().optional(),
      registrationDeadline: z.coerce.date().optional(),
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
  getProposalAttendance: protectedProcedure
    .input(z.object({ communicationId: z.number() }))
    .query(({ input }) => getCommProposalAttendance(input.communicationId)),
  respondProposalAttendance: protectedProcedure
    .input(z.object({
      communicationId: z.number(),
      response: z.enum(["attending", "maybe", "not_attending"]),
    }))
    .mutation(({ input, ctx }) => upsertCommProposalAttendance(input.communicationId, ctx.user.id, input.response)),
  removeProposalAttendance: protectedProcedure
    .input(z.object({ communicationId: z.number() }))
    .mutation(({ input, ctx }) => removeCommProposalAttendance(input.communicationId, ctx.user.id)),
  getCongressAttendance: protectedProcedure
    .input(z.object({ congressId: z.number() }))
    .query(({ input }) => getCongressAttendance(input.congressId)),
  respondCongressAttendance: protectedProcedure
    .input(z.object({
      congressId: z.number(),
      response: z.enum(["attending", "maybe", "not_attending"]),
    }))
    .mutation(({ input, ctx }) => upsertCongressAttendance(input.congressId, ctx.user.id, input.response)),
  removeCongressAttendance: protectedProcedure
    .input(z.object({ congressId: z.number() }))
    .mutation(({ input, ctx }) => removeCongressAttendance(input.congressId, ctx.user.id)),
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
      notifyEmail: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { notifyEmail, ...data } = input;
      const result = await createPaper({ ...data, creatorId: ctx.user.id });
      if (notifyEmail && result) {
        const emails = await getAllUserEmails();
        await notifyMembers({
          subject: `New Paper: ${result.title}`,
          title: `New Paper: ${result.title}`,
          body: [
            result.targetJournal ? `Target journal: ${result.targetJournal}` : "",
            result.keywords ? `Keywords: ${result.keywords}` : "",
            result.abstract ? `\n${result.abstract}` : "",
          ].filter(Boolean).join("\n"),
          memberEmails: emails,
        });
      }
      return result;
    }),

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
      notifyEmail: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { notifyEmail, ...data } = input;
      const result = await createEvent({ ...data, creatorId: ctx.user.id });
      if (notifyEmail && result) {
        const emails = await getAllUserEmails();
        await notifyMembers({
          subject: `New Event: ${result.title}`,
          title: `New Event: ${result.title}`,
          body: [
            result.topic ? `Topic: ${result.topic}` : "",
            result.location ? `Location: ${result.location}` : "",
            result.eventDate ? `Date: ${new Date(result.eventDate).toLocaleDateString()}` : "",
            result.modality ? `Modality: ${result.modality}` : "",
            result.websiteUrl ? `Website: ${result.websiteUrl}` : "",
            result.description ? `\n${result.description}` : "",
          ].filter(Boolean).join("\n"),
          memberEmails: emails,
        });
      }
      return result;
    }),

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

// Helper: call OpenAI using API key from appSettings DB
async function callOpenAI(messages: Array<{role: string; content: string}>, responseFormat?: Record<string, unknown>) {
  const settings = await getAppSettings();
  const apiKey = settings["openai_api_key"];
  if (!apiKey) throw new Error("OpenAI API key is not configured. Please add it in Settings → AI Configuration.");
  const body: Record<string, unknown> = {
    model: "gpt-4o-mini",
    messages,
  };
  if (responseFormat) body.response_format = responseFormat;
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API error: ${res.status} – ${err}`);
  }
  return res.json();
}

const aiRouter = router({
  suggestJournals: protectedProcedure
    .input(z.object({ abstract: z.string().min(10), keywords: z.string().optional() }))
    .mutation(async ({ input }) => {
      const response = await callOpenAI([
        { role: "system", content: "You are an academic publishing expert. Given a paper abstract and keywords, suggest 5 relevant academic journals with a brief justification for each. Format as JSON object with a 'journals' array, each item having: name, publisher, impactFactor (string, if known), justification." },
        { role: "user", content: `Abstract: ${input.abstract}\nKeywords: ${input.keywords ?? ""}` },
      ], { type: "json_object" });
      const content = (response.choices[0]?.message?.content as string) ?? "{}";
      return JSON.parse(content);
    }),
  _suggestJournals_old: protectedProcedure
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
      const response = await callOpenAI([
        { role: "system", content: "You are an academic meeting secretary. Given meeting notes, produce a structured summary with: key decisions, action items with owners, open questions, and a brief executive summary. Be concise and professional." },
        { role: "user", content: input.notes },
      ]);
      return { summary: (response.choices[0]?.message?.content as string) ?? "" };
    }),
  draftCongressDescription: protectedProcedure
    .input(z.object({ name: z.string(), topic: z.string(), details: z.string().optional() }))
    .mutation(async ({ input }) => {
      const response = await callOpenAI([
        { role: "system", content: "You are an academic communications expert. Draft a professional, engaging conference description suitable for a research group's internal platform. Keep it informative, concise, and highlight relevance to AI, technology, and human wellbeing research." },
        { role: "user", content: `Conference name: ${input.name}\nTopic: ${input.topic}\nAdditional details: ${input.details ?? ""}` },
      ]);
      return { draft: (response.choices[0]?.message?.content as string) ?? "" };
    }),
});

// ─── App Router ───────────────────────────────────────────────────────────────

// ─── Announcements Router ─────────────────────────────────────────────────────
const announcementsRouter = router({
  list: protectedProcedure.query(async () => {
    return getAllAnnouncements();
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const ann = await getAnnouncementById(input.id);
      if (!ann) throw new TRPCError({ code: "NOT_FOUND" });
      const replies = await getAnnouncementReplies(input.id);
      const attachments = await getAnnouncementAttachments(input.id);
      return { ...ann, replies, attachments };
    }),

  create: protectedProcedure
    .input(z.object({
      subject: z.string().min(1).max(512),
      body: z.string().min(1),
      isPinned: z.boolean().optional(),
      notifyEmail: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const result = await createAnnouncement({
        authorId: ctx.user.id,
        subject: input.subject,
        body: input.body,
        isPinned: (input.isPinned ?? false) ? 1 : 0,
      });
      if (input.notifyEmail && result) {
        const emails = await getAllUserEmails();
        await notifyMembers({
          subject: `Announcement: ${result.subject}`,
          title: result.subject,
          body: result.body,
          memberEmails: emails,
        });
      }
      return result;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      subject: z.string().min(1).max(512).optional(),
      body: z.string().min(1).optional(),
      isPinned: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const ann = await getAnnouncementById(input.id);
      if (!ann) throw new TRPCError({ code: "NOT_FOUND" });
      if (ann.authorId !== ctx.user.id && ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const { id, isPinned: isPinnedBool, ...rest } = input;
      const data: any = { ...rest };
      if (isPinnedBool !== undefined) data.isPinned = isPinnedBool ? 1 : 0;
      await updateAnnouncement(id, data);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const ann = await getAnnouncementById(input.id);
      if (!ann) throw new TRPCError({ code: "NOT_FOUND" });
      if (ann.authorId !== ctx.user.id && ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      await deleteAnnouncement(input.id);
      return { success: true };
    }),

  reply: protectedProcedure
    .input(z.object({
      announcementId: z.number(),
      body: z.string().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      return createAnnouncementReply({
        announcementId: input.announcementId,
        authorId: ctx.user.id,
        body: input.body,
      });
    }),

  deleteReply: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await deleteAnnouncementReply(input.id);
            return { success: true };
    }),
});

// ─── Settings Router (admin only) ─────────────────────────────────────────────
const settingsRouter = router({
  get: protectedProcedure
    .use(({ ctx, next }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return next({ ctx });
    })
    .query(async () => {
      return getAppSettings();
    }),
  set: protectedProcedure
    .use(({ ctx, next }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return next({ ctx });
    })
    .input(z.object({
      key: z.string().min(1).max(128),
      value: z.string(),
    }))
    .mutation(async ({ input }) => {
      await upsertAppSetting(input.key, input.value);
      return { success: true };
    }),
});

const linksRouter = router({
  list: protectedProcedure.query(async () => getAllLinks()),
  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      url: z.string().min(1),
      description: z.string().optional(),
      category: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => createLink({ ...input, creatorId: ctx.user.id })),
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      url: z.string().optional(),
      description: z.string().optional(),
      category: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const all = await getAllLinks();
      const link = all.find((l: { id: number; creatorId: number }) => l.id === input.id);
      if (!link) throw new TRPCError({ code: "NOT_FOUND" });
      if (link.creatorId !== ctx.user.id && ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const { id, ...data } = input;
      return updateLink(id, data);
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const all = await getAllLinks();
      const link = all.find((l: { id: number; creatorId: number }) => l.id === input.id);
      if (!link) throw new TRPCError({ code: "NOT_FOUND" });
      if (link.creatorId !== ctx.user.id && ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return deleteLink(input.id);
    }),
});

// ─── Project Proposals Router ─────────────────────────────────────────────────────────────
const projectProposalsRouter = router({
  list: protectedProcedure.query(() => getAllProjectProposals()),
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getProjectProposalById(input.id)),
  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      objectives: z.string().optional(),
      methodology: z.string().optional(),
      expectedOutcomes: z.string().optional(),
      fundingSource: z.string().optional(),
      budget: z.string().optional(),
      startDate: z.coerce.date().optional(),
      endDate: z.coerce.date().optional(),
      status: z.enum(["idea","draft","submitted","approved","rejected","active","completed"]).default("idea"),
      keywords: z.string().optional(),
      additionalInfo: z.string().optional(),
    }))
    .mutation(({ input, ctx }) => createProjectProposal({ ...input, creatorId: ctx.user.id })),
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().min(1).optional(),
      description: z.string().optional(),
      objectives: z.string().optional(),
      methodology: z.string().optional(),
      expectedOutcomes: z.string().optional(),
      fundingSource: z.string().optional(),
      budget: z.string().optional(),
      startDate: z.coerce.date().optional(),
      endDate: z.coerce.date().optional(),
      status: z.enum(["idea","draft","submitted","approved","rejected","active","completed"]).optional(),
      keywords: z.string().optional(),
      additionalInfo: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const p = await getProjectProposalById(input.id);
      if (!p) throw new TRPCError({ code: "NOT_FOUND" });
      if (p.creatorId !== ctx.user.id && ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const { id, ...data } = input;
      return updateProjectProposal(id, data);
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const p = await getProjectProposalById(input.id);
      if (!p) throw new TRPCError({ code: "NOT_FOUND" });
      if (p.creatorId !== ctx.user.id && ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return deleteProjectProposal(input.id);
    }),
  getInterests: protectedProcedure
    .input(z.object({ proposalId: z.number() }))
    .query(({ input }) => getProjectProposalInterests(input.proposalId)),
  toggleInterest: protectedProcedure
    .input(z.object({ proposalId: z.number() }))
    .mutation(({ input, ctx }) => toggleProjectProposalInterest(input.proposalId, ctx.user.id)),
});

// ─── Research Lines Router ────────────────────────────────────────────────────
const researchLinesRouter = router({
  getAll: protectedProcedure.query(() => getAllResearchLines()),
  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      objectives: z.string().optional(),
      keywords: z.string().optional(),
      status: z.enum(["active", "inactive", "completed"]).optional(),
    }))
    .mutation(({ input, ctx }) => createResearchLine({ ...input, creatorId: ctx.user.id })),
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().min(1).optional(),
      description: z.string().optional(),
      objectives: z.string().optional(),
      keywords: z.string().optional(),
      status: z.enum(["active", "inactive", "completed"]).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const lines = await getAllResearchLines();
      const line = lines.find((l) => l.id === input.id);
      if (!line) throw new TRPCError({ code: "NOT_FOUND" });
      if (line.creatorId !== ctx.user.id && ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const { id, ...data } = input;
      return updateResearchLine(id, data);
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const lines = await getAllResearchLines();
      const line = lines.find((l) => l.id === input.id);
      if (!line) throw new TRPCError({ code: "NOT_FOUND" });
      if (line.creatorId !== ctx.user.id && ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return deleteResearchLine(input.id);
    }),
  join: protectedProcedure
    .input(z.object({ lineId: z.number() }))
    .mutation(({ input, ctx }) => joinResearchLine(input.lineId, ctx.user.id)),
  leave: protectedProcedure
    .input(z.object({ lineId: z.number() }))
    .mutation(({ input, ctx }) => leaveResearchLine(input.lineId, ctx.user.id)),
});

const contactRouter = router({
  sendMessage: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        subject: z.string().min(1),
        message: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      await sendEmail({
        to: "jbguzman@us.es",
        subject: `[AI&Tech4Human Contact] ${input.subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #5b21b6;">New Contact Message — AI&amp;Tech4Human</h2>
            <table style="width:100%; border-collapse:collapse; margin-top:16px;">
              <tr><td style="padding:8px; font-weight:bold; background:#f5f3ff;">From</td><td style="padding:8px;">${input.name}</td></tr>
              <tr><td style="padding:8px; font-weight:bold; background:#f5f3ff;">Email</td><td style="padding:8px;"><a href="mailto:${input.email}">${input.email}</a></td></tr>
              <tr><td style="padding:8px; font-weight:bold; background:#f5f3ff;">Subject</td><td style="padding:8px;">${input.subject}</td></tr>
            </table>
            <div style="margin-top:16px; padding:16px; background:#fafafa; border-left:4px solid #5b21b6;">
              <p style="white-space:pre-wrap; margin:0;">${input.message}</p>
            </div>
            <p style="margin-top:24px; font-size:12px; color:#888;">Sent via the AI&amp;Tech4Human contact form at research.blancoguzman.es</p>
          </div>
        `,
      });
      return { success: true };
    }),
});

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
  announcements: announcementsRouter,
  settings: settingsRouter,
  links: linksRouter,
  projectProposals: projectProposalsRouter,
  researchLines: researchLinesRouter,
  contact: contactRouter,
});
export type AppRouter = typeof appRouter;
