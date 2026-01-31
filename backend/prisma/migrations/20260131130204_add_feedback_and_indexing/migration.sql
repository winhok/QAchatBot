-- CreateTable
CREATE TABLE "indexed_records" (
    "id" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "content_hash" TEXT NOT NULL,
    "collection" TEXT NOT NULL DEFAULT 'default',
    "indexed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "indexed_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedbacks" (
    "id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "indexed_records_collection_idx" ON "indexed_records"("collection");

-- CreateIndex
CREATE INDEX "indexed_records_content_hash_idx" ON "indexed_records"("content_hash");

-- CreateIndex
CREATE UNIQUE INDEX "indexed_records_source_id_collection_key" ON "indexed_records"("source_id", "collection");

-- CreateIndex
CREATE INDEX "feedbacks_session_id_idx" ON "feedbacks"("session_id");

-- CreateIndex
CREATE INDEX "feedbacks_message_id_idx" ON "feedbacks"("message_id");

-- CreateIndex
CREATE INDEX "feedbacks_score_idx" ON "feedbacks"("score");

-- CreateIndex
CREATE INDEX "feedbacks_created_at_idx" ON "feedbacks"("created_at");

-- AddForeignKey
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
