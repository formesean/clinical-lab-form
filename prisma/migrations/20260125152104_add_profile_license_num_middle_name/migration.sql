/*
  Warnings:

  - A unique constraint covering the columns `[licenseNum]` on the table `Profile` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `licenseNum` to the `Profile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "licenseNum" TEXT NOT NULL,
ADD COLUMN     "middleName" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Profile_licenseNum_key" ON "Profile"("licenseNum");
