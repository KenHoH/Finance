-- Create SplitBillItem table
CREATE TABLE "SplitBillItem" (
    "id" TEXT NOT NULL,
    "splitBillId" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "price" DECIMAL(12,2) NOT NULL,
    "assignedTo" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SplitBillItem_pkey" PRIMARY KEY ("id")
);

-- Add index on splitBillId
CREATE INDEX "SplitBillItem_splitBillId_idx" ON "SplitBillItem"("splitBillId");

-- Add foreign key
ALTER TABLE "SplitBillItem" ADD CONSTRAINT "SplitBillItem_splitBillId_fkey" FOREIGN KEY ("splitBillId") REFERENCES "SplitBill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
