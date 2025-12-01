-- CreateTable
CREATE TABLE "WalletNonce" (
    "id" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,
    "address" VARCHAR(42) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletNonce_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WalletNonce_nonce_key" ON "WalletNonce"("nonce");
