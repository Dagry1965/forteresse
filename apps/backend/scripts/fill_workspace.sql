-- ============================================================
-- 1) Remplir tous les workspace_id manquants
-- ============================================================

UPDATE Client            SET workspace_id = "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971" WHERE workspace_id IS NULL;
UPDATE Vehicle           SET workspace_id = "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971" WHERE workspace_id IS NULL;
UPDATE Appointment       SET workspace_id = "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971" WHERE workspace_id IS NULL;
UPDATE Intervention      SET workspace_id = "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971" WHERE workspace_id IS NULL;
UPDATE Proforma          SET workspace_id = "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971" WHERE workspace_id IS NULL;
UPDATE Invoice           SET workspace_id = "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971" WHERE workspace_id IS NULL;
UPDATE Payment           SET workspace_id = "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971" WHERE workspace_id IS NULL;
UPDATE LineItem          SET workspace_id = "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971" WHERE workspace_id IS NULL;
UPDATE Supplier          SET workspace_id = "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971" WHERE workspace_id IS NULL;
UPDATE Product           SET workspace_id = "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971" WHERE workspace_id IS NULL;
UPDATE StockMovement     SET workspace_id = "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971" WHERE workspace_id IS NULL;
UPDATE InventoryReservation SET workspace_id = "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971" WHERE workspace_id IS NULL;
UPDATE InventoryAdjustment SET workspace_id = "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971" WHERE workspace_id IS NULL;
UPDATE PurchaseOrder     SET workspace_id = "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971" WHERE workspace_id IS NULL;
UPDATE PurchaseReceipt   SET workspace_id = "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971" WHERE workspace_id IS NULL;
UPDATE TimeSlot          SET workspace_id = "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971" WHERE workspace_id IS NULL;

-- ============================================================
-- 2) Remplir updated_at manquants
-- ============================================================

UPDATE Client          SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL;
UPDATE Vehicle         SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL;
UPDATE Workspace       SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL;
UPDATE WorkspaceMember SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL;
UPDATE PurchaseOrder   SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL;
UPDATE PurchaseReceipt SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL;
UPDATE Inventory       SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL;

-- ============================================================
-- 3) Champs critiques manquants
-- ============================================================

-- PurchaseOrderLine
UPDATE PurchaseOrderLine
SET product_id = (SELECT id FROM Product LIMIT 1)
WHERE product_id IS NULL;

UPDATE PurchaseOrderLine
SET purchase_order_id = (SELECT id FROM PurchaseOrder LIMIT 1)
WHERE purchase_order_id IS NULL;

-- RefreshToken
UPDATE RefreshToken SET token_hash = "placeholder" WHERE token_hash IS NULL;
UPDATE RefreshToken SET user_id = (SELECT id FROM User LIMIT 1) WHERE user_id IS NULL;
