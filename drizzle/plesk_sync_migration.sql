-- ============================================================
-- AI&Tech4Human - Plesk Production Sync Migration
-- Run this ONCE in phpMyAdmin on the 'research' database
-- All statements use IF NOT EXISTS / MODIFY safely
-- ============================================================

-- -------------------------------------------------------
-- TABLE: meetings
-- Missing: pollDeadline, finalDate
-- Extra (in prod only): isPublic — keep it, no harm
-- -------------------------------------------------------
ALTER TABLE `meetings`
  ADD COLUMN IF NOT EXISTS `pollDeadline` datetime DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `finalDate` datetime DEFAULT NULL;

-- -------------------------------------------------------
-- TABLE: papers
-- Production has: id, creatorId, title, abstract, targetJournal,
--   status, doi, published, keywords, notes, submitted, accepted,
--   createdAt, updatedAt
-- Code expects: id, creatorId, title, abstract, keywords,
--   targetJournal, methodology, status, deadline, doiUrl,
--   additionalInfo, createdAt, updatedAt
-- Missing in prod: methodology, deadline, doiUrl, additionalInfo
-- Extra in prod: doi, published, notes, submitted, accepted
--   (keep them, they won't break inserts)
-- -------------------------------------------------------
ALTER TABLE `papers`
  ADD COLUMN IF NOT EXISTS `methodology` text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `deadline` datetime DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `doiUrl` text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `additionalInfo` text DEFAULT NULL;

-- -------------------------------------------------------
-- TABLE: congresses
-- Production columns (from phpMyAdmin screenshot earlier):
--   id, creatorId, name, description, topic, startDate, endDate,
--   location, modality, registrationFee, websiteUrl, cfpUrl,
--   cfpFileKey, cfpFileUrl, abstractDeadline, additionalInfo,
--   createdAt, updatedAt
-- Code expects same — should be OK already
-- But startDate/endDate/abstractDeadline need to be datetime
-- -------------------------------------------------------
ALTER TABLE `congresses`
  MODIFY COLUMN `startDate` datetime DEFAULT NULL,
  MODIFY COLUMN `endDate` datetime DEFAULT NULL,
  MODIFY COLUMN `abstractDeadline` datetime DEFAULT NULL;

-- -------------------------------------------------------
-- TABLE: events
-- Production has: id, creatorId, title, description, eventDate,
--   endDate, location, modality, websiteUrl, topic, createdAt, updatedAt
-- Code expects same — should be OK
-- -------------------------------------------------------
ALTER TABLE `events`
  MODIFY COLUMN `eventDate` datetime DEFAULT NULL,
  MODIFY COLUMN `endDate` datetime DEFAULT NULL;

-- -------------------------------------------------------
-- TABLE: meetingDateOptions
-- Code expects: id, meetingId, proposedDate, createdAt
-- -------------------------------------------------------
ALTER TABLE `meetingDateOptions`
  MODIFY COLUMN `proposedDate` datetime NOT NULL;

-- -------------------------------------------------------
-- TABLE: tasks
-- Code expects: id, creatorId, assigneeId, title, description,
--   status, priority, dueDate, relatedModule, relatedId,
--   createdAt, updatedAt
-- -------------------------------------------------------
ALTER TABLE `tasks`
  MODIFY COLUMN `dueDate` datetime DEFAULT NULL;

-- -------------------------------------------------------
-- Verify the changes
-- -------------------------------------------------------
DESCRIBE meetings;
DESCRIBE papers;
