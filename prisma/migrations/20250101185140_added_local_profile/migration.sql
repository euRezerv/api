/*
  Warnings:

  - You are about to drop the column `createdAt` on the `GoogleProfile` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `GoogleProfile` table. All the data in the column will be lost.
  - You are about to drop the column `profileImageUrl` on the `GoogleProfile` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `firstName` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `googleProfileId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isEmailVerified` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isPhoneVerified` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isSystemAdmin` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `lastName` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `phoneNumber` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `phoneNumberCountryISO` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `GoogleProfile` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `responseJson` to the `GoogleProfile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `GoogleProfile` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_googleProfileId_fkey";

-- DropIndex
DROP INDEX "User_email_key";

-- DropIndex
DROP INDEX "User_phoneNumberCountryISO_phoneNumber_key";

-- AlterTable
ALTER TABLE "GoogleProfile" DROP COLUMN "createdAt",
DROP COLUMN "deletedAt",
DROP COLUMN "profileImageUrl",
ADD COLUMN     "responseJson" JSONB NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "email",
DROP COLUMN "firstName",
DROP COLUMN "googleProfileId",
DROP COLUMN "isEmailVerified",
DROP COLUMN "isPhoneVerified",
DROP COLUMN "isSystemAdmin",
DROP COLUMN "lastName",
DROP COLUMN "password",
DROP COLUMN "phoneNumber",
DROP COLUMN "phoneNumberCountryISO",
ADD COLUMN     "profileCompletion" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "LocalProfile" (
    "id" TEXT NOT NULL,
    "givenName" TEXT NOT NULL,
    "familyName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "phoneNumberCountryISO" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "isPhoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "profileImageUrl" TEXT,
    "password" TEXT,
    "isSystemAdmin" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,

    CONSTRAINT "LocalProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LocalProfile_email_key" ON "LocalProfile"("email");

-- CreateIndex
CREATE UNIQUE INDEX "LocalProfile_userId_key" ON "LocalProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LocalProfile_phoneNumberCountryISO_phoneNumber_key" ON "LocalProfile"("phoneNumberCountryISO", "phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "GoogleProfile_userId_key" ON "GoogleProfile"("userId");

-- AddForeignKey
ALTER TABLE "LocalProfile" ADD CONSTRAINT "LocalProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoogleProfile" ADD CONSTRAINT "GoogleProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
