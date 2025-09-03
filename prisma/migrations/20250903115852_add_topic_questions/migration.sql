-- CreateTable
CREATE TABLE "TopicQuestion" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TopicQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopicQuestionSelection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TopicQuestionSelection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TopicQuestionSelection_userId_idx" ON "TopicQuestionSelection"("userId");

-- CreateIndex
CREATE INDEX "TopicQuestionSelection_topicId_idx" ON "TopicQuestionSelection"("topicId");

-- CreateIndex
CREATE UNIQUE INDEX "TopicQuestionSelection_userId_questionId_key" ON "TopicQuestionSelection"("userId", "questionId");

-- AddForeignKey
ALTER TABLE "TopicQuestion" ADD CONSTRAINT "TopicQuestion_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicQuestionSelection" ADD CONSTRAINT "TopicQuestionSelection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicQuestionSelection" ADD CONSTRAINT "TopicQuestionSelection_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "TopicQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
