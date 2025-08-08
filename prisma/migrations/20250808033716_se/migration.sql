-- CreateTable
CREATE TABLE "public"."Story" (
    "id" TEXT NOT NULL,
    "theme" TEXT NOT NULL,
    "mainCharacterName" TEXT NOT NULL,
    "mainCharacterTraits" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "extendedCount" INTEGER NOT NULL DEFAULT 0,
    "imageUrl" TEXT,
    "audioUrl" TEXT,
    "textFileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Story_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Story_userId_idx" ON "public"."Story"("userId");

-- CreateIndex
CREATE INDEX "Story_createdAt_idx" ON "public"."Story"("createdAt");

-- CreateIndex
CREATE INDEX "Story_favorite_idx" ON "public"."Story"("favorite");

-- AddForeignKey
ALTER TABLE "public"."Story" ADD CONSTRAINT "Story_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
