-- CreateEnum
CREATE TYPE "CompanyEmployeeRole" AS ENUM ('REGULAR', 'MANAGER', 'OWNER');

-- CreateEnum
CREATE TYPE "ResourceCategory" AS ENUM ('SPORT_FIELD');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'APPROVED', 'CANCELLED', 'COMPLETED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocalProfile" (
    "id" TEXT NOT NULL,
    "givenName" TEXT NOT NULL,
    "familyName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "phoneNumberCountryISO" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "phoneNumberFormatted" TEXT NOT NULL,
    "isPhoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "profileImageUrl" TEXT,
    "password" TEXT,
    "isSystemAdmin" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,

    CONSTRAINT "LocalProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoogleProfile" (
    "id" TEXT NOT NULL,
    "googleId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "responseJson" JSONB NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "GoogleProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "county" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyEmployee" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "role" "CompanyEmployeeRole" NOT NULL,

    CONSTRAINT "CompanyEmployee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyUpdateHistory" (
    "id" TEXT NOT NULL,
    "modifications" JSON NOT NULL,
    "companyId" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyUpdateHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "ResourceCategory" NOT NULL,
    "companyId" TEXT NOT NULL,
    "requiresBookingApproval" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceAvailability" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,

    CONSTRAINT "ResourceAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceEmployee" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,

    CONSTRAINT "ResourceEmployee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "durationSeconds" INTEGER NOT NULL,
    "resourceId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "isCancelled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingCustomer" (
    "id" TEXT NOT NULL,
    "notes" TEXT,
    "bookingId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "isMainCustomer" BOOLEAN NOT NULL,

    CONSTRAINT "BookingCustomer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LocalProfile_email_key" ON "LocalProfile"("email");

-- CreateIndex
CREATE UNIQUE INDEX "LocalProfile_userId_key" ON "LocalProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LocalProfile_phoneNumberCountryISO_phoneNumber_key" ON "LocalProfile"("phoneNumberCountryISO", "phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "GoogleProfile_googleId_key" ON "GoogleProfile"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "GoogleProfile_userId_key" ON "GoogleProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyEmployee_companyId_employeeId_key" ON "CompanyEmployee"("companyId", "employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceEmployee_resourceId_employeeId_key" ON "ResourceEmployee"("resourceId", "employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "BookingCustomer_bookingId_customerId_key" ON "BookingCustomer"("bookingId", "customerId");

-- AddForeignKey
ALTER TABLE "LocalProfile" ADD CONSTRAINT "LocalProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoogleProfile" ADD CONSTRAINT "GoogleProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyEmployee" ADD CONSTRAINT "CompanyEmployee_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyEmployee" ADD CONSTRAINT "CompanyEmployee_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyUpdateHistory" ADD CONSTRAINT "CompanyUpdateHistory_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyUpdateHistory" ADD CONSTRAINT "CompanyUpdateHistory_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceAvailability" ADD CONSTRAINT "ResourceAvailability_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceEmployee" ADD CONSTRAINT "ResourceEmployee_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceEmployee" ADD CONSTRAINT "ResourceEmployee_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "CompanyEmployee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingCustomer" ADD CONSTRAINT "BookingCustomer_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingCustomer" ADD CONSTRAINT "BookingCustomer_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
