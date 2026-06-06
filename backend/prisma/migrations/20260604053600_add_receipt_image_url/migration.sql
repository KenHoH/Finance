-- Fix SplitBill: replace old array column with single string URL
ALTER TABLE "SplitBill" DROP COLUMN IF EXISTS "receiptProofs";
ALTER TABLE "SplitBill" ADD COLUMN "receiptImageUrl" TEXT;

-- Fix SplitParticipant: rename paymentProof to paymentProofUrl and add rejectionReason
ALTER TABLE "SplitParticipant" RENAME COLUMN "paymentProof" TO "paymentProofUrl";
ALTER TABLE "SplitParticipant" ADD COLUMN "rejectionReason" TEXT;
