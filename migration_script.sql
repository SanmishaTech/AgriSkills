-- Migration script to rename Course to Chapter and Chapter to Section
-- This script needs to be run manually due to the complex name swapping

BEGIN;

-- Step 1: Rename existing Chapter table to Section (temporary name to avoid conflicts)
ALTER TABLE "Chapter" RENAME TO "Section_temp";

-- Step 2: Rename Course table to Chapter
ALTER TABLE "Course" RENAME TO "Chapter";

-- Step 3: Rename Section_temp to Section
ALTER TABLE "Section_temp" RENAME TO "Section";

-- Step 4: Update foreign key references
-- Update DemoVideo to reference chapterId instead of courseId
ALTER TABLE "DemoVideo" RENAME COLUMN "courseId" TO "chapterId";

-- Update Section to reference chapterId instead of courseId  
ALTER TABLE "Section" RENAME COLUMN "courseId" TO "chapterId";

-- Step 5: Update constraint names (drop and recreate foreign key constraints)
-- Drop existing foreign key constraints
ALTER TABLE "DemoVideo" DROP CONSTRAINT "DemoVideo_courseId_fkey";
ALTER TABLE "Section" DROP CONSTRAINT "Chapter_courseId_fkey";

-- Add new foreign key constraints with correct names
ALTER TABLE "DemoVideo" 
ADD CONSTRAINT "DemoVideo_chapterId_fkey" 
FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Section" 
ADD CONSTRAINT "Section_chapterId_fkey" 
FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 6: Update any indexes if they exist (check your specific database first)
-- This step may vary depending on what indexes exist in your database

COMMIT;
