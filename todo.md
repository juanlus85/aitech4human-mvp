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
