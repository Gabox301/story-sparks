-- CreateTable
CREATE TABLE "public"."RevokedToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RevokedToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RevokedToken_token_key" ON "public"."RevokedToken"("token");

-- CreateIndex
CREATE INDEX "RevokedToken_token_idx" ON "public"."RevokedToken"("token");

-- CreateIndex
CREATE INDEX "RevokedToken_expiresAt_idx" ON "public"."RevokedToken"("expiresAt");
