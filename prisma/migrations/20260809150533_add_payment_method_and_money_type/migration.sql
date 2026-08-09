-- AlterTable
ALTER TABLE "CapitalCategory" ADD COLUMN "moneyType" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "amount" REAL NOT NULL,
    "description" TEXT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "categoryId" TEXT NOT NULL,
    "monthlySheetId" TEXT NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurringIntervalMonths" INTEGER,
    "paymentMethod" TEXT NOT NULL DEFAULT 'BANK',
    "splitMonths" INTEGER,
    "splitIndex" INTEGER,
    "splitGroupId" TEXT,
    CONSTRAINT "Transaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Transaction_monthlySheetId_fkey" FOREIGN KEY ("monthlySheetId") REFERENCES "MonthlySheet" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Transaction" ("amount", "categoryId", "createdAt", "date", "description", "id", "isRecurring", "monthlySheetId", "recurringIntervalMonths", "splitGroupId", "splitIndex", "splitMonths", "type") SELECT "amount", "categoryId", "createdAt", "date", "description", "id", "isRecurring", "monthlySheetId", "recurringIntervalMonths", "splitGroupId", "splitIndex", "splitMonths", "type" FROM "Transaction";
DROP TABLE "Transaction";
ALTER TABLE "new_Transaction" RENAME TO "Transaction";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
