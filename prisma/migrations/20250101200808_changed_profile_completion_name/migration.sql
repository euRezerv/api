/*
  Warnings:

  - You are about to drop the column `profileCompletion` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "profileCompletion",
ADD COLUMN     "isProfileComplete" BOOLEAN NOT NULL DEFAULT false;
