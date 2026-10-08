-- Run once on the production MySQL database used by research.blancoguzman.es.
-- Stores only hashes of single-use password-reset tokens; no password is stored here.

CREATE TABLE IF NOT EXISTS `passwordResetTokens` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `tokenHash` varchar(255) NOT NULL,
  `expiresAt` datetime NOT NULL,
  `usedAt` datetime NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `passwordResetTokens_id` PRIMARY KEY (`id`),
  CONSTRAINT `passwordResetTokens_tokenHash_unique` UNIQUE (`tokenHash`),
  CONSTRAINT `passwordResetTokens_userId_users_id_fk`
    FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
