# Deployment Guide — AI&Tech4Human
## research.blancoguzman.es · Plesk + Node.js + MySQL

---

## 1. Prerequisites on the server

- Node.js ≥ 18 (recommended: 20 LTS)
- pnpm: `npm install -g pnpm`
- MySQL 8.x database already created in Plesk
- Domain `research.blancoguzman.es` pointing to the server

---

## 2. Create the MySQL database

In Plesk → Databases, create:

| Field    | Value                        |
|----------|------------------------------|
| DB name  | `aitech4human`               |
| User     | `aitech4human_user`          |
| Password | *(choose a strong password)* |

Then connect via SSH or phpMyAdmin and run the SQL below.

---

## 3. Database SQL — run this once

```sql
-- Run in order. Copy the full block into phpMyAdmin or mysql CLI.

CREATE TABLE IF NOT EXISTS `users` (
  `id` int AUTO_INCREMENT NOT NULL,
  `email` varchar(320) NOT NULL,
  `passwordHash` varchar(255) NOT NULL,
  `name` text,
  `role` enum('admin','member') NOT NULL DEFAULT 'member',
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  `lastSignedIn` timestamp NULL,
  CONSTRAINT `users_id` PRIMARY KEY(`id`),
  CONSTRAINT `users_email_unique` UNIQUE(`email`)
);

CREATE TABLE IF NOT EXISTS `profiles` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `photoUrl` text,
  `photoKey` text,
  `bio` text,
  `interests` text,
  `university` varchar(255),
  `department` varchar(255),
  `researchArea` varchar(255),
  `orcid` varchar(64),
  `googleScholar` varchar(512),
  `researchGate` varchar(512),
  `scopus` varchar(512),
  `webOfScience` varchar(512),
  `linkedin` varchar(512),
  `personalWeb` varchar(512),
  `cvPdfUrl` text,
  `cvPdfKey` text,
  `keywords` text,
  `languages` text,
  `availableToCollaborate` tinyint(1) DEFAULT 1,
  `isPublic` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `profiles_id` PRIMARY KEY(`id`),
  CONSTRAINT `profiles_userId_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `news` (
  `id` int AUTO_INCREMENT NOT NULL,
  `authorId` int NOT NULL,
  `title` varchar(512) NOT NULL,
  `slug` varchar(512) NOT NULL,
  `summary` text,
  `content` text NOT NULL,
  `coverImageUrl` text,
  `coverImageKey` text,
  `isPublished` tinyint(1) NOT NULL DEFAULT 0,
  `publishedAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `news_id` PRIMARY KEY(`id`),
  CONSTRAINT `news_slug_unique` UNIQUE(`slug`),
  CONSTRAINT `news_authorId_fk` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`)
);

CREATE TABLE IF NOT EXISTS `messages` (
  `id` int AUTO_INCREMENT NOT NULL,
  `senderId` int NOT NULL,
  `recipientId` int NOT NULL,
  `parentId` int NULL,
  `subject` varchar(512) NOT NULL,
  `body` text NOT NULL,
  `isReadByRecipient` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `messages_id` PRIMARY KEY(`id`),
  CONSTRAINT `messages_senderId_fk` FOREIGN KEY (`senderId`) REFERENCES `users`(`id`),
  CONSTRAINT `messages_recipientId_fk` FOREIGN KEY (`recipientId`) REFERENCES `users`(`id`)
);

CREATE TABLE IF NOT EXISTS `messageAttachments` (
  `id` int AUTO_INCREMENT NOT NULL,
  `messageId` int NOT NULL,
  `fileName` varchar(512) NOT NULL,
  `fileKey` text NOT NULL,
  `fileUrl` text NOT NULL,
  `fileSize` bigint NULL,
  `mimeType` varchar(128),
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `messageAttachments_id` PRIMARY KEY(`id`),
  CONSTRAINT `messageAttachments_messageId_fk` FOREIGN KEY (`messageId`) REFERENCES `messages`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `meetings` (
  `id` int AUTO_INCREMENT NOT NULL,
  `organizerId` int NOT NULL,
  `title` varchar(512) NOT NULL,
  `description` text,
  `modality` enum('online','in-person','hybrid') NOT NULL,
  `location` text,
  `meetingLink` text,
  `agenda` text,
  `type` enum('fixed','poll') NOT NULL DEFAULT 'fixed',
  `fixedDate` timestamp NULL,
  `status` enum('scheduled','cancelled','completed') NOT NULL DEFAULT 'scheduled',
  `isPublic` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `meetings_id` PRIMARY KEY(`id`),
  CONSTRAINT `meetings_organizerId_fk` FOREIGN KEY (`organizerId`) REFERENCES `users`(`id`)
);

CREATE TABLE IF NOT EXISTS `meetingAttendance` (
  `id` int AUTO_INCREMENT NOT NULL,
  `meetingId` int NOT NULL,
  `userId` int NOT NULL,
  `response` enum('attending','maybe','not_attending') NOT NULL DEFAULT 'maybe',
  `note` text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `meetingAttendance_id` PRIMARY KEY(`id`),
  CONSTRAINT `meetingAttendance_meetingId_fk` FOREIGN KEY (`meetingId`) REFERENCES `meetings`(`id`) ON DELETE CASCADE,
  CONSTRAINT `meetingAttendance_userId_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `meetingDateOptions` (
  `id` int AUTO_INCREMENT NOT NULL,
  `meetingId` int NOT NULL,
  `proposedDate` timestamp NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `meetingDateOptions_id` PRIMARY KEY(`id`),
  CONSTRAINT `meetingDateOptions_meetingId_fk` FOREIGN KEY (`meetingId`) REFERENCES `meetings`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `meetingDateVotes` (
  `id` int AUTO_INCREMENT NOT NULL,
  `dateOptionId` int NOT NULL,
  `userId` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `meetingDateVotes_id` PRIMARY KEY(`id`),
  CONSTRAINT `meetingDateVotes_dateOptionId_fk` FOREIGN KEY (`dateOptionId`) REFERENCES `meetingDateOptions`(`id`) ON DELETE CASCADE,
  CONSTRAINT `meetingDateVotes_userId_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `congresses` (
  `id` int AUTO_INCREMENT NOT NULL,
  `creatorId` int NOT NULL,
  `name` varchar(512) NOT NULL,
  `acronym` varchar(64),
  `description` text,
  `location` varchar(512),
  `country` varchar(128),
  `modality` enum('in-person','online','hybrid'),
  `startDate` timestamp NULL,
  `endDate` timestamp NULL,
  `abstractDeadline` timestamp NULL,
  `paperDeadline` timestamp NULL,
  `registrationDeadline` timestamp NULL,
  `registrationFee` varchar(128),
  `websiteUrl` text,
  `cfpUrl` text,
  `cfpPdfKey` text,
  `topic` text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `congresses_id` PRIMARY KEY(`id`),
  CONSTRAINT `congresses_creatorId_fk` FOREIGN KEY (`creatorId`) REFERENCES `users`(`id`)
);

CREATE TABLE IF NOT EXISTS `commProposals` (
  `id` int AUTO_INCREMENT NOT NULL,
  `congressId` int NOT NULL,
  `proposerId` int NOT NULL,
  `title` varchar(512) NOT NULL,
  `topic` text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `commProposals_id` PRIMARY KEY(`id`),
  CONSTRAINT `commProposals_congressId_fk` FOREIGN KEY (`congressId`) REFERENCES `congresses`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `commProposalInterests` (
  `id` int AUTO_INCREMENT NOT NULL,
  `communicationId` int NOT NULL,
  `userId` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `commProposalInterests_id` PRIMARY KEY(`id`),
  CONSTRAINT `commProposalInterests_communicationId_fk` FOREIGN KEY (`communicationId`) REFERENCES `commProposals`(`id`) ON DELETE CASCADE,
  CONSTRAINT `commProposalInterests_userId_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `papers` (
  `id` int AUTO_INCREMENT NOT NULL,
  `creatorId` int NOT NULL,
  `title` varchar(512) NOT NULL,
  `abstract` text,
  `targetJournal` varchar(512),
  `status` enum('idea','draft','writing','submitted','under_review','accepted','published') NOT NULL DEFAULT 'idea',
  `doi` varchar(255),
  `publishedUrl` text,
  `keywords` text,
  `notes` text,
  `submittedAt` timestamp NULL,
  `acceptedAt` timestamp NULL,
  `publishedAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `papers_id` PRIMARY KEY(`id`),
  CONSTRAINT `papers_creatorId_fk` FOREIGN KEY (`creatorId`) REFERENCES `users`(`id`)
);

CREATE TABLE IF NOT EXISTS `paperContributors` (
  `id` int AUTO_INCREMENT NOT NULL,
  `paperId` int NOT NULL,
  `userId` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `paperContributors_id` PRIMARY KEY(`id`),
  CONSTRAINT `paperContributors_paperId_fk` FOREIGN KEY (`paperId`) REFERENCES `papers`(`id`) ON DELETE CASCADE,
  CONSTRAINT `paperContributors_userId_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `events` (
  `id` int AUTO_INCREMENT NOT NULL,
  `creatorId` int NOT NULL,
  `title` varchar(512) NOT NULL,
  `description` text,
  `eventDate` timestamp NULL,
  `endDate` timestamp NULL,
  `location` varchar(512),
  `modality` enum('in-person','online','hybrid'),
  `websiteUrl` text,
  `topic` text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `events_id` PRIMARY KEY(`id`),
  CONSTRAINT `events_creatorId_fk` FOREIGN KEY (`creatorId`) REFERENCES `users`(`id`)
);

CREATE TABLE IF NOT EXISTS `eventInterests` (
  `id` int AUTO_INCREMENT NOT NULL,
  `eventId` int NOT NULL,
  `userId` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `eventInterests_id` PRIMARY KEY(`id`),
  CONSTRAINT `eventInterests_eventId_fk` FOREIGN KEY (`eventId`) REFERENCES `events`(`id`) ON DELETE CASCADE,
  CONSTRAINT `eventInterests_userId_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `documentFolders` (
  `id` int AUTO_INCREMENT NOT NULL,
  `creatorId` int NOT NULL,
  `parentId` int NULL,
  `name` varchar(255) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `documentFolders_id` PRIMARY KEY(`id`),
  CONSTRAINT `documentFolders_creatorId_fk` FOREIGN KEY (`creatorId`) REFERENCES `users`(`id`)
);

CREATE TABLE IF NOT EXISTS `documents` (
  `id` int AUTO_INCREMENT NOT NULL,
  `uploaderId` int NOT NULL,
  `folderId` int NULL,
  `fileName` varchar(512) NOT NULL,
  `fileKey` text NOT NULL,
  `fileUrl` text NOT NULL,
  `fileSize` bigint NULL,
  `mimeType` varchar(128),
  `description` text,
  `accessLevel` enum('all','admin') NOT NULL DEFAULT 'all',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `documents_id` PRIMARY KEY(`id`),
  CONSTRAINT `documents_uploaderId_fk` FOREIGN KEY (`uploaderId`) REFERENCES `users`(`id`)
);

CREATE TABLE IF NOT EXISTS `tasks` (
  `id` int AUTO_INCREMENT NOT NULL,
  `creatorId` int NOT NULL,
  `assigneeId` int NULL,
  `title` varchar(512) NOT NULL,
  `description` text,
  `status` enum('todo','in_progress','done') NOT NULL DEFAULT 'todo',
  `priority` enum('low','medium','high') NOT NULL DEFAULT 'medium',
  `dueDate` timestamp NULL,
  `relatedModule` varchar(64),
  `relatedId` int NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `tasks_id` PRIMARY KEY(`id`),
  CONSTRAINT `tasks_creatorId_fk` FOREIGN KEY (`creatorId`) REFERENCES `users`(`id`),
  CONSTRAINT `tasks_assigneeId_fk` FOREIGN KEY (`assigneeId`) REFERENCES `users`(`id`)
);

CREATE TABLE IF NOT EXISTS `notifications` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `type` varchar(64) NOT NULL,
  `title` varchar(512) NOT NULL,
  `body` text,
  `relatedModule` varchar(64),
  `relatedId` int NULL,
  `isRead` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `notifications_id` PRIMARY KEY(`id`),
  CONSTRAINT `notifications_userId_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
```

---

## 4. Create the first admin user

After running the SQL above, insert your admin account. Replace the hash with a real bcrypt hash (see step below):

```sql
-- Generate the hash first (see step 4a), then run this:
INSERT INTO users (email, passwordHash, name, role, isActive)
VALUES ('tu@email.com', '$2b$10$REPLACE_WITH_REAL_HASH', 'Your Name', 'admin', 1);
```

### 4a. Generate the bcrypt hash (run on the server via SSH)

```bash
node -e "const b=require('bcryptjs'); b.hash('YOUR_PASSWORD',10).then(h=>console.log(h))"
```

Copy the output and paste it into the SQL above.

---

## 5. Clone the repository on the server

```bash
# Via SSH on the server
cd /var/www/vhosts/blancoguzman.es/research.blancoguzman.es
git clone https://github.com/juanlus85/aitech4human-mvp.git .
```

---

## 6. Create the `.env` file

Create `/var/www/vhosts/blancoguzman.es/research.blancoguzman.es/.env`:

```env
# Database — use the credentials from Plesk
DATABASE_URL=mysql://aitech4human_user:YOUR_DB_PASSWORD@localhost:3306/aitech4human

# JWT — generate a random 64-char string
JWT_SECRET=REPLACE_WITH_64_CHAR_RANDOM_STRING

# App
NODE_ENV=production
PORT=3000

# Storage — for file uploads (Manus built-in S3, keep as-is for Manus deploy)
# If deploying outside Manus, configure your own S3-compatible storage here
BUILT_IN_FORGE_API_URL=
BUILT_IN_FORGE_API_KEY=
```

**Generate a secure JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 7. Install dependencies and build

```bash
cd /var/www/vhosts/blancoguzman.es/research.blancoguzman.es

# Install pnpm if not present
npm install -g pnpm

# Install dependencies
pnpm install --frozen-lockfile

# Build frontend + backend
pnpm build
```

---

## 8. Configure Plesk — Node.js Application

In Plesk → research.blancoguzman.es → Node.js:

| Setting              | Value                                      |
|----------------------|--------------------------------------------|
| Node.js version      | 20.x LTS                                   |
| Document root        | `/research.blancoguzman.es` (the domain root) |
| Application root     | same as document root                      |
| Application startup file | `dist/index.js`                        |
| Application mode     | Production                                 |
| Environment variables | Add all from `.env` above                 |

Click **Enable Node.js** and then **Run NPM Install** if Plesk offers it (skip if you already ran `pnpm install`).

---

## 9. Deploy updates (git pull workflow)

Every time you want to deploy new changes from Manus:

```bash
cd /var/www/vhosts/blancoguzman.es/research.blancoguzman.es

# Pull latest code
git pull origin main

# Install any new dependencies
pnpm install --frozen-lockfile

# Rebuild
pnpm build

# Restart the Node.js app in Plesk
# (either via Plesk UI → Node.js → Restart, or:)
touch tmp/restart.txt
```

---

## 10. Pushing updates from Manus to GitHub

Every time I make changes to the platform, I will push them to GitHub automatically. You only need to run `git pull origin main` on the server and rebuild.

---

## Notes

- **File uploads** use the Manus built-in S3 storage by default. For production on your own server you will need to configure an S3-compatible bucket (e.g. MinIO, Cloudflare R2, or AWS S3) and update the storage helpers in `server/storage.ts`.
- **Email notifications** are not yet wired to an SMTP provider. To enable them, add `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` to `.env` and integrate Nodemailer in the relevant router procedures.
- The `drizzle/` folder contains the migration files. If you ever need to reset the DB, re-run the SQL from step 3.
