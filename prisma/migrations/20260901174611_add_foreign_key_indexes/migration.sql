-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE INDEX "ApartmentInvite_email_status_idx" ON "ApartmentInvite"("email", "status");

-- CreateIndex
CREATE INDEX "ApartmentInvite_invitedById_idx" ON "ApartmentInvite"("invitedById");

-- CreateIndex
CREATE INDEX "ApartmentMember_userId_idx" ON "ApartmentMember"("userId");

-- CreateIndex
CREATE INDEX "Capital_monthlySheetId_idx" ON "Capital"("monthlySheetId");

-- CreateIndex
CREATE INDEX "Capital_capitalCategoryId_idx" ON "Capital"("capitalCategoryId");

-- CreateIndex
CREATE INDEX "HousingEntry_housingCategoryId_idx" ON "HousingEntry"("housingCategoryId");

-- CreateIndex
CREATE INDEX "HousingMonth_apartmentId_year_month_idx" ON "HousingMonth"("apartmentId", "year", "month");

-- CreateIndex
CREATE INDEX "MonthlySheet_userId_year_month_idx" ON "MonthlySheet"("userId", "year", "month");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "SharedAccess_sharedWithId_idx" ON "SharedAccess"("sharedWithId");

-- CreateIndex
CREATE INDEX "Transaction_monthlySheetId_idx" ON "Transaction"("monthlySheetId");

-- CreateIndex
CREATE INDEX "Transaction_categoryId_idx" ON "Transaction"("categoryId");

-- CreateIndex
CREATE INDEX "Transaction_splitGroupId_idx" ON "Transaction"("splitGroupId");
