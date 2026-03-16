-- CreateIndex
CREATE INDEX "Customer_name_idx" ON "Customer"("name");

-- CreateIndex
CREATE INDEX "InventoryItem_category_idx" ON "InventoryItem"("category");

-- CreateIndex
CREATE INDEX "InventoryItem_quantity_idx" ON "InventoryItem"("quantity");

-- CreateIndex
CREATE INDEX "Reservation_scheduledAt_idx" ON "Reservation"("scheduledAt");

-- CreateIndex
CREATE INDEX "Reservation_customerId_idx" ON "Reservation"("customerId");

-- CreateIndex
CREATE INDEX "Reservation_status_idx" ON "Reservation"("status");

-- CreateIndex
CREATE INDEX "StockLog_inventoryItemId_createdAt_idx" ON "StockLog"("inventoryItemId", "createdAt");
