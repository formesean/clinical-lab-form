/*
  Warnings:

  - A unique constraint covering the columns `[userIdNum]` on the table `Profile` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userIdNum` to the `Profile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "userIdNum" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userIdNum_key" ON "Profile"("userIdNum");
