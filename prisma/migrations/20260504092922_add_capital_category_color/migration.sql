-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CapitalCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "color" TEXT NOT NULL DEFAULT '#3B82F6',
    "order" INTEGER DEFAULT 0,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CapitalCategory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CapitalCategory" ("createdAt", "icon", "id", "name", "order", "updatedAt", "userId") SELECT "createdAt", "icon", "id", "name", "order", "updatedAt", "userId" FROM "CapitalCategory";
DROP TABLE "CapitalCategory";
ALTER TABLE "new_CapitalCategory" RENAME TO "CapitalCategory";
CREATE UNIQUE INDEX "CapitalCategory_userId_name_key" ON "CapitalCategory"("userId", "name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
