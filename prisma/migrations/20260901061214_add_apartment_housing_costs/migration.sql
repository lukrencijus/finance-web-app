-- CreateTable
CREATE TABLE "Apartment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ApartmentMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "apartmentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ApartmentMember_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "Apartment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ApartmentMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ApartmentInvite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "apartmentId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "invitedById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ApartmentInvite_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "Apartment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ApartmentInvite_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HousingCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "apartmentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'EUR',
    "icon" TEXT,
    "color" TEXT NOT NULL DEFAULT '#64748B',
    "order" INTEGER DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HousingCategory_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "Apartment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HousingMonth" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "apartmentId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HousingMonth_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "Apartment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HousingEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "housingMonthId" TEXT NOT NULL,
    "housingCategoryId" TEXT NOT NULL,
    "amount" REAL,
    "quantity" REAL,
    "note" TEXT,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HousingEntry_housingMonthId_fkey" FOREIGN KEY ("housingMonthId") REFERENCES "HousingMonth" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "HousingEntry_housingCategoryId_fkey" FOREIGN KEY ("housingCategoryId") REFERENCES "HousingCategory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ApartmentMember_apartmentId_userId_key" ON "ApartmentMember"("apartmentId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ApartmentInvite_apartmentId_email_key" ON "ApartmentInvite"("apartmentId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "HousingCategory_apartmentId_name_key" ON "HousingCategory"("apartmentId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "HousingMonth_apartmentId_month_year_key" ON "HousingMonth"("apartmentId", "month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "HousingEntry_housingMonthId_housingCategoryId_key" ON "HousingEntry"("housingMonthId", "housingCategoryId");
