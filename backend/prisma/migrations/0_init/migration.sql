-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "folders" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "color" TEXT,
    "description" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "folder_id" TEXT,
    "name" TEXT,
    "type" TEXT NOT NULL DEFAULT 'normal',
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_message_at" TIMESTAMP(3),

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memories" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "folder_id" TEXT,
    "scope" TEXT NOT NULL DEFAULT 'folder',
    "category" TEXT NOT NULL DEFAULT 'general',
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "memories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tool_calls" (
    "id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "tool_call_id" TEXT NOT NULL,
    "tool_name" TEXT NOT NULL,
    "args" JSONB NOT NULL,
    "result" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "duration" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tool_calls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "collection" TEXT NOT NULL DEFAULT 'default',
    "content" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "folders_user_id_idx" ON "folders"("user_id");

-- CreateIndex
CREATE INDEX "folders_user_id_is_default_idx" ON "folders"("user_id", "is_default");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_user_id_status_idx" ON "sessions"("user_id", "status");

-- CreateIndex
CREATE INDEX "sessions_folder_id_idx" ON "sessions"("folder_id");

-- CreateIndex
CREATE INDEX "sessions_status_idx" ON "sessions"("status");

-- CreateIndex
CREATE INDEX "memories_user_id_idx" ON "memories"("user_id");

-- CreateIndex
CREATE INDEX "memories_user_id_scope_idx" ON "memories"("user_id", "scope");

-- CreateIndex
CREATE INDEX "memories_folder_id_idx" ON "memories"("folder_id");

-- CreateIndex
CREATE INDEX "memories_expires_at_idx" ON "memories"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "memories_user_id_folder_id_scope_category_key_key" ON "memories"("user_id", "folder_id", "scope", "category", "key");

-- CreateIndex
CREATE INDEX "messages_session_id_idx" ON "messages"("session_id");

-- CreateIndex
CREATE INDEX "messages_session_id_seq_idx" ON "messages"("session_id", "seq");

-- CreateIndex
CREATE INDEX "messages_role_idx" ON "messages"("role");

-- CreateIndex
CREATE UNIQUE INDEX "messages_session_id_seq_key" ON "messages"("session_id", "seq");

-- CreateIndex
CREATE INDEX "tool_calls_message_id_idx" ON "tool_calls"("message_id");

-- CreateIndex
CREATE INDEX "tool_calls_tool_name_idx" ON "tool_calls"("tool_name");

-- CreateIndex
CREATE UNIQUE INDEX "tool_calls_message_id_seq_key" ON "tool_calls"("message_id", "seq");

-- CreateIndex
CREATE INDEX "documents_user_id_idx" ON "documents"("user_id");

-- CreateIndex
CREATE INDEX "documents_user_id_collection_idx" ON "documents"("user_id", "collection");

-- CreateIndex
CREATE INDEX "documents_collection_idx" ON "documents"("collection");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memories" ADD CONSTRAINT "memories_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tool_calls" ADD CONSTRAINT "tool_calls_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

