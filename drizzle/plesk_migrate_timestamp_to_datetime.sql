-- ============================================================
-- Migration: TIMESTAMP → DATETIME for business date columns
-- Run this SQL in phpMyAdmin or via MySQL CLI on your Plesk server
-- Safe to run multiple times (MODIFY COLUMN is idempotent)
-- ============================================================

ALTER TABLE `congresses` MODIFY COLUMN `startDate` datetime;
ALTER TABLE `congresses` MODIFY COLUMN `endDate` datetime;
ALTER TABLE `congresses` MODIFY COLUMN `abstractDeadline` datetime;
ALTER TABLE `events` MODIFY COLUMN `eventDate` datetime;
ALTER TABLE `events` MODIFY COLUMN `endDate` datetime;
ALTER TABLE `meetingDateOptions` MODIFY COLUMN `proposedDate` datetime NOT NULL;
ALTER TABLE `meetings` MODIFY COLUMN `fixedDate` datetime;
ALTER TABLE `meetings` MODIFY COLUMN `pollDeadline` datetime;
ALTER TABLE `meetings` MODIFY COLUMN `finalDate` datetime;
ALTER TABLE `papers` MODIFY COLUMN `deadline` datetime;
