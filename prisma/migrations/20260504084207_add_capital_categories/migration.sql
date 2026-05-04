/*
  Warnings:

  - You are about to drop the column `name` on the `Capital` table. All the data in the column will be lost.
  - You are about to drop the column `percentage` on the `Capital` table. All the data in the column will be lost.
  - Added the required column `capitalCategoryId` to the `Capital` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "CapitalCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "order" INTEGER DEFAULT 0,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CapitalCategory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Capital" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "amount" REAL NOT NULL,
    "order" INTEGER DEFAULT 0,
    "monthlySheetId" TEXT NOT NULL,
    "capitalCategoryId" TEXT NOT NULL,
    CONSTRAINT "Capital_monthlySheetId_fkey" FOREIGN KEY ("monthlySheetId") REFERENCES "MonthlySheet" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Capital_capitalCategoryId_fkey" FOREIGN KEY ("capitalCategoryId") REFERENCES "CapitalCategory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Capital" ("amount", "id", "monthlySheetId") SELECT "amount", "id", "monthlySheetId" FROM "Capital";
DROP TABLE "Capital";
ALTER TABLE "new_Capital" RENAME TO "Capital";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "CapitalCategory_userId_name_key" ON "CapitalCategory"("userId", "name");
