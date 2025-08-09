-- CreateTable
CREATE TABLE "TopicDemo" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "demoUrls" TEXT[],
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TopicDemo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TopicDemo_topicId_key" ON "TopicDemo"("topicId");

-- AddForeignKey
ALTER TABLE "TopicDemo" ADD CONSTRAINT "TopicDemo_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
