/*
  Warnings:

  - The values [SPORT_FIELD] on the enum `ResourceCategory` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "ServiceSubcategory" AS ENUM ('HAIR_CUT');

-- AlterEnum
BEGIN;
CREATE TYPE "ResourceCategory_new" AS ENUM ('BEAUTY', 'EDUCATION', 'HEALTH', 'SPORT');
ALTER TABLE "Resource" ALTER COLUMN "category" TYPE "ResourceCategory_new" USING ("category"::text::"ResourceCategory_new");
ALTER TYPE "ResourceCategory" RENAME TO "ResourceCategory_old";
ALTER TYPE "ResourceCategory_new" RENAME TO "ResourceCategory";
DROP TYPE "ResourceCategory_old";
COMMIT;

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "subcategories" "ServiceSubcategory"[];
