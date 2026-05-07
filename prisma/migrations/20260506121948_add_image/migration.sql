-- DropForeignKey
ALTER TABLE `attempts` DROP FOREIGN KEY `attempts_userId_fkey`;

-- DropIndex
DROP INDEX `attempts_userId_fkey` ON `attempts`;

-- AlterTable
ALTER TABLE `questions` ADD COLUMN `imageUrl` VARCHAR(255) NULL;

-- AddForeignKey
ALTER TABLE `attempts` ADD CONSTRAINT `attempts_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
