/*
  Warnings:

  - You are about to drop the column `code` on the `Prescription` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[medicalCode]` on the table `Prescription` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `medicalCode` to the `Prescription` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Prescription` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fullName` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Prescription_code_key";

-- AlterTable
ALTER TABLE "Prescription" DROP COLUMN "code",
ADD COLUMN     "medicalCode" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "name",
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "fullName" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Prescription_medicalCode_key" ON "Prescription"("medicalCode");
