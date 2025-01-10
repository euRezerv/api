/*
  Warnings:

  - A unique constraint covering the columns `[senderId,invitedUserId,status]` on the table `CompanyEmployeeInvitation` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "CompanyEmployeeInvitation_senderId_invitedUserId_key";

-- CreateIndex
CREATE UNIQUE INDEX "CompanyEmployeeInvitation_senderId_invitedUserId_status_key" ON "CompanyEmployeeInvitation"("senderId", "invitedUserId", "status");
