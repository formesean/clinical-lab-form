-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "FormType" AS ENUM ('CHEM', 'OGTT', 'CBC', 'BT', 'UA', 'SE', 'PT', 'OBT', 'IMMUNO', 'MICRO');

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "status" "AccountStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientSession" (
    "id" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "patientData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabForm" (
    "id" TEXT NOT NULL,
    "patientSessionId" TEXT NOT NULL,
    "formType" "FormType" NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormEditLock" (
    "id" TEXT NOT NULL,
    "patientSessionId" TEXT NOT NULL,
    "formType" "FormType" NOT NULL,
    "lockedByUserId" TEXT NOT NULL,
    "lockToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormEditLock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PatientSession_createdByUserId_idx" ON "PatientSession"("createdByUserId");

-- CreateIndex
CREATE INDEX "PatientSession_updatedAt_idx" ON "PatientSession"("updatedAt");

-- CreateIndex
CREATE INDEX "LabForm_updatedAt_idx" ON "LabForm"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "LabForm_patientSessionId_formType_key" ON "LabForm"("patientSessionId", "formType");

-- CreateIndex
CREATE INDEX "FormEditLock_expiresAt_idx" ON "FormEditLock"("expiresAt");

-- CreateIndex
CREATE INDEX "FormEditLock_updatedAt_idx" ON "FormEditLock"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "FormEditLock_patientSessionId_formType_key" ON "FormEditLock"("patientSessionId", "formType");

-- AddForeignKey
ALTER TABLE "PatientSession" ADD CONSTRAINT "PatientSession_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabForm" ADD CONSTRAINT "LabForm_patientSessionId_fkey" FOREIGN KEY ("patientSessionId") REFERENCES "PatientSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormEditLock" ADD CONSTRAINT "FormEditLock_patientSessionId_fkey" FOREIGN KEY ("patientSessionId") REFERENCES "PatientSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormEditLock" ADD CONSTRAINT "FormEditLock_lockedByUserId_fkey" FOREIGN KEY ("lockedByUserId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
