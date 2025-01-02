/*
  Warnings:

  - Changed the type of `dayOfWeek` on the `ResourceAvailability` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- AlterTable
ALTER TABLE "ResourceAvailability" DROP COLUMN "dayOfWeek",
ADD COLUMN     "dayOfWeek" "DayOfWeek" NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "googleProfileId" TEXT;

-- CreateTable
CREATE TABLE "GoogleProfile" (
    "id" TEXT NOT NULL,
    "googleId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "profileImageUrl" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "GoogleProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GoogleProfile_googleId_key" ON "GoogleProfile"("googleId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_googleProfileId_fkey" FOREIGN KEY ("googleProfileId") REFERENCES "GoogleProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
