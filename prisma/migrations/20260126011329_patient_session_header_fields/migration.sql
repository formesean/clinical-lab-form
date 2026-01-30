/*
  Warnings:

  - You are about to drop the column `patientData` on the `PatientSession` table. All the data in the column will be lost.
  - Added the required column `age` to the `PatientSession` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dateOfBirth` to the `PatientSession` table without a default value. This is not possible if the table is not empty.
  - Added the required column `firstName` to the `PatientSession` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `PatientSession` table without a default value. This is not possible if the table is not empty.
  - Added the required column `middleName` to the `PatientSession` table without a default value. This is not possible if the table is not empty.
  - Added the required column `patientIdNum` to the `PatientSession` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sex` to the `PatientSession` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('MALE', 'FEMALE');

-- AlterTable
ALTER TABLE "PatientSession" DROP COLUMN "patientData",
ADD COLUMN     "age" INTEGER NOT NULL,
ADD COLUMN     "dateOfBirth" TEXT NOT NULL,
ADD COLUMN     "firstName" TEXT NOT NULL,
ADD COLUMN     "lastName" TEXT NOT NULL,
ADD COLUMN     "middleName" TEXT NOT NULL,
ADD COLUMN     "patientIdNum" TEXT NOT NULL,
ADD COLUMN     "requestedForms" "FormType"[],
ADD COLUMN     "requestingPhysician" TEXT,
ADD COLUMN     "sex" "Sex" NOT NULL;

-- CreateIndex
CREATE INDEX "PatientSession_patientIdNum_idx" ON "PatientSession"("patientIdNum");

-- CreateIndex
CREATE INDEX "PatientSession_lastName_firstName_idx" ON "PatientSession"("lastName", "firstName");
