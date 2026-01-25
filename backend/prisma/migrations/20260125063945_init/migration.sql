-- CreateTable
CREATE TABLE "reasonings" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "checkpoint_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "duration" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reasonings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reasonings_checkpoint_id_key" ON "reasonings"("checkpoint_id");

-- CreateIndex
CREATE INDEX "reasonings_session_id_idx" ON "reasonings"("session_id");

-- CreateIndex
CREATE INDEX "reasonings_checkpoint_id_idx" ON "reasonings"("checkpoint_id");

-- AddForeignKey
ALTER TABLE "reasonings" ADD CONSTRAINT "reasonings_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
