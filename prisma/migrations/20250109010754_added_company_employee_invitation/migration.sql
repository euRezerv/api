-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'CANCELLED');

-- CreateTable
CREATE TABLE "CompanyEmployeeInvitation" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "invitedUserId" TEXT NOT NULL,
    "role" "CompanyEmployeeRole" NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyEmployeeInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CompanyEmployeeInvitation_senderId_invitedUserId_key" ON "CompanyEmployeeInvitation"("senderId", "invitedUserId");

-- AddForeignKey
ALTER TABLE "CompanyEmployeeInvitation" ADD CONSTRAINT "CompanyEmployeeInvitation_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "CompanyEmployee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyEmployeeInvitation" ADD CONSTRAINT "CompanyEmployeeInvitation_invitedUserId_fkey" FOREIGN KEY ("invitedUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
