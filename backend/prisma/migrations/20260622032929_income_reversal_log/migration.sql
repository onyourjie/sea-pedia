-- CreateTable
CREATE TABLE "IncomeReversalLog" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "driverId" TEXT,
    "reversedIncome" DECIMAL(15,2) NOT NULL,
    "reversedEarning" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncomeReversalLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IncomeReversalLog_orderId_key" ON "IncomeReversalLog"("orderId");
