# AI&Tech4Human — Project TODO

## Phase 1: Database & Schema
- [x] Design and create complete schema in drizzle/schema.ts (users, profiles, news, messages, meetings, congresses, papers, events, documents, tasks, notifications)
- [x] Run initial migration (pnpm db:push)

## Phase 2: Custom Authentication
- [x] Implement registration and login with username/password (bcrypt + JWT)
- [x] Remove Manus OAuth dependency from auth flow
- [x] JWT authentication middleware on the server
- [x] Roles: Administrator and Member
- [x] adminProcedure for restricted routes
- [x] Public Login page

## Phase 3: Public Website
- [x] Home: hero, group description, featured members, latest news, CTA
- [x] About page: mission, scientific objectives, partner universities
- [x] Members list with full academic profile (photo, bio, university, ORCID, Scholar, RG, LinkedIn, areas, CV PDF)
- [x] Member detail page
- [x] News section: list and detail
- [x] Contact page with form
- [x] Public navigation with header and footer

## Phase 4: Private Panel — Base
- [x] Dashboard with summary: upcoming events, meetings, messages, deadlines, notifications
- [x] Editable personal profile: photo, bio, interests, links, academic info
- [x] Admin panel: user management (create, edit, delete, assign role)
- [x] Admin panel: news management (create, edit, delete, publish)
- [x] Private panel layout with sidebar and navigation

## Phase 5: Collaborative Modules
- [x] Messages module: compose, reply, attachments, email notification, internal notifications
- [x] Meetings with fixed date: date, time, modality, address/link, topics
- [x] Attendance options: Will attend / Not sure / Cannot attend
- [x] Meetings with date poll: propose dates, voting, automatic conversion to fixed
- [x] Email notifications when creating a meeting

## Phase 6: Content Modules
- [x] Congresses module: dates, location, modality, cost, link, CFP PDF/link, abstract deadline
- [x] Within congress: create communication proposal with title, topic and interest in participating
- [x] Papers module: title, target journal, status (Idea/Draft/Writing/Submitted/Under review/Accepted/Published), interested contributors
- [x] Events module: create event, express interest in attending

## Phase 7: Documents, Calendar, Tasks & Notifications
- [x] Document repository: upload, download, role-based access control
- [x] Integrated calendar: meetings, congresses, events, deadlines
- [x] Tasks/Kanban board: create, assign, statuses, link to modules
- [x] Internal notifications system: bell icon, list, mark as read
- [x] Automatic deadline reminders

## Phase 8: AI Assistant
- [x] Journal suggester from abstract
- [x] Meeting summarizer from notes/transcript
- [x] Assistant for drafting congress descriptions or proposals

## Phase 9: Visual Style
- [x] Fluid gradient lavender + rose blush + pale mint as background
- [x] Elegant serif typography (Playfair Display) for headings
- [x] Minimalist sans-serif (Inter) for secondary text
- [x] Geometric accents: thin brackets in corners, subtle vertical lines
- [x] Smooth transitions and generous negative space
- [x] Muted slate-purple palette for main typography
- [x] Light mode with coherent editorial aesthetic throughout the app

## Phase 10: Quality & Delivery
- [x] Vitest tests for authentication, roles and main procedures
- [x] Error handling and empty states in all modules
- [x] Final checkpoint and delivery to user

## Round 2: Bug Fixes & New Features

- [x] Fix Meetings insert error — z.coerce.date() for all date fields in routers.ts
- [x] Fix Congresses insert error — z.coerce.date() for all date fields in routers.ts
- [x] Fix Papers insert error — z.coerce.date() for all date fields in routers.ts
- [x] Fix Documents crash — SelectItem value changed from "" to "none", folderId handling updated
- [x] Events: show list of interested members (db.ts join with users + Events.tsx pill list UI)
- [x] Messages: show previous thread history when replying (original message quote in reply dialog)

## Round 3: Upload Fix

- [x] Fix profile photo upload silently failing on Plesk — replaced base64-over-tRPC with multipart FormData REST endpoint /api/upload/photo (multer)
- [x] Fix CV PDF upload silently failing on Plesk — replaced base64-over-tRPC with multipart FormData REST endpoint /api/upload/cv (multer)
- [x] Added loading spinner on photo button and "Uploading..." state on CV button
- [x] Added explicit onError toast so any future upload error is visible to the user

## Round 4: Local Storage Fallback

- [x] Replace Manus-only S3 storage with dual-mode adapter: uses local filesystem (uploads/ folder) when BUILT_IN_FORGE_API_URL/KEY are absent, Manus S3 when present
- [x] Register /uploads static route in Express to serve locally uploaded files
- [x] Ensure uploads/ directory is created automatically on server start

## Round 5: MySQL Date Fix

- [x] Fix Meetings/Congresses/Papers/Events insert failures on production MySQL — root cause was drizzle passing Date objects with milliseconds (2026-05-23 12:12:00.000) which MySQL rejects; fixed by initializing mysql2 pool with timezone:'+00:00' and dateStrings:false

## Round 9 — New features & fixes

- [x] Update logo with new transparent PNG in header, sidebar, and favicon
- [x] Remove "News" from public navigation menu
- [x] Create Announcements module: DB tables (announcements, announcementReplies, announcementAttachments)
- [x] Create Announcements module: tRPC procedures (list, getById, create, reply, delete)
- [x] Create Announcements module: UI page with forum-style thread view, threaded replies
- [x] Add "Announcements" to dashboard sidebar navigation
- [x] Add "Notify by email" checkbox (unchecked by default) to Events creation form
- [x] Add "Notify by email" checkbox (unchecked by default) to Congresses creation form
- [x] Add "Notify by email" checkbox (unchecked by default) to Papers creation form
- [x] Add "Notify by email" checkbox (unchecked by default) to Announcements creation form
- [x] Fix Contact form: show clear message that SMTP is not configured
- [x] Fix AI Assistant: show clear message that OpenAI API key is not configured

## Round 10 — Bug Fixes & New Features

- [x] Fix Announcements INSERT error (FK constraint on authorId)
- [x] Fix Member #N display — show real name in interest/attendance lists
- [x] Rename "Congresses" to "Conferences" throughout the app
- [x] Create admin Settings page: SMTP configuration (host, port, user, password, from)
- [x] Create admin Settings page: OpenAI API key configuration
- [x] Store SMTP/OpenAI settings in DB (appSettings table)
- [x] Version indicator in Settings page footer

## Round 11 — Real Email Notifications via SMTP

- [x] Install nodemailer and @types/nodemailer
- [x] Create server/email.ts helper: reads SMTP config from appSettings DB, sends email via Nodemailer
- [x] Add getAllUserEmails() helper to db.ts to get all active member emails
- [x] Add notifyEmail: boolean to Congress create procedure and send email to all members when true
- [x] Add notifyEmail: boolean to Event create procedure and send email to all members when true
- [x] Add notifyEmail: boolean to Paper create procedure and send email to all members when true
- [x] Add notifyEmail: boolean to Announcement create procedure and send email to all members when true
- [x] Wire notifyEmail checkbox state to the create mutation in Congresses.tsx
- [x] Wire notifyEmail checkbox state to the create mutation in Events.tsx
- [x] Wire notifyEmail checkbox state to the create mutation in Papers.tsx
- [x] Wire notifyEmail checkbox state to the create mutation in Announcements.tsx
