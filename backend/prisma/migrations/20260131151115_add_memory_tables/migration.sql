-- CreateTable
CREATE TABLE "user_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "preferred_name" TEXT,
    "age" INTEGER,
    "interests" TEXT[],
    "occupation" TEXT,
    "location" TEXT,
    "conversation_preferences" TEXT[],
    "relationships" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "episodic_memories" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "session_id" TEXT,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "importance" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "episodic_memories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_user_id_key" ON "user_profiles"("user_id");

-- CreateIndex
CREATE INDEX "user_profiles_user_id_idx" ON "user_profiles"("user_id");

-- CreateIndex
CREATE INDEX "episodic_memories_user_id_idx" ON "episodic_memories"("user_id");

-- CreateIndex
CREATE INDEX "episodic_memories_user_id_type_idx" ON "episodic_memories"("user_id", "type");

-- CreateIndex
CREATE INDEX "episodic_memories_session_id_idx" ON "episodic_memories"("session_id");

-- CreateIndex
CREATE INDEX "episodic_memories_expires_at_idx" ON "episodic_memories"("expires_at");
