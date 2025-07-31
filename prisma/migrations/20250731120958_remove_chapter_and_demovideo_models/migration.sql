/*
  Warnings:

  - You are about to drop the `Chapter` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DemoVideo` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Chapter" DROP CONSTRAINT "Chapter_courseId_fkey";

-- DropForeignKey
ALTER TABLE "DemoVideo" DROP CONSTRAINT "DemoVideo_courseId_fkey";

-- DropTable
DROP TABLE "Chapter";

-- DropTable
DROP TABLE "DemoVideo";
