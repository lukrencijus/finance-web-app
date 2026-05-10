-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CapitalCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "color" TEXT NOT NULL DEFAULT '#64748B',
    "order" INTEGER DEFAULT 0,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CapitalCategory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CapitalCategory" ("color", "createdAt", "icon", "id", "name", "order", "updatedAt", "userId") SELECT "color", "createdAt", "icon", "id", "name", "order", "updatedAt", "userId" FROM "CapitalCategory";
DROP TABLE "CapitalCategory";
ALTER TABLE "new_CapitalCategory" RENAME TO "CapitalCategory";
CREATE UNIQUE INDEX "CapitalCategory_userId_name_key" ON "CapitalCategory"("userId", "name");
CREATE TABLE "new_SharedAccess" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "sharedWithId" TEXT NOT NULL,
    "permission" TEXT NOT NULL DEFAULT 'VIEW',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SharedAccess_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SharedAccess_sharedWithId_fkey" FOREIGN KEY ("sharedWithId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_SharedAccess" ("createdAt", "id", "ownerId", "sharedWithId") SELECT "createdAt", "id", "ownerId", "sharedWithId" FROM "SharedAccess";
DROP TABLE "SharedAccess";
ALTER TABLE "new_SharedAccess" RENAME TO "SharedAccess";
CREATE UNIQUE INDEX "SharedAccess_ownerId_sharedWithId_key" ON "SharedAccess"("ownerId", "sharedWithId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
