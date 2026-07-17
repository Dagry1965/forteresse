-- ============================================================
-- Appointment
-- ============================================================
UPDATE Appointment SET client_id    = "client_fallback"    WHERE client_id IS NULL;
UPDATE Appointment SET vehicle_id   = "vehicle_fallback"   WHERE vehicle_id IS NULL;
UPDATE Appointment SET time_slot_id = "timeslot_fallback"  WHERE time_slot_id IS NULL;
UPDATE Appointment SET user_id      = "user_fallback"      WHERE user_id IS NULL;

-- ============================================================
-- Vehicle
-- ============================================================
UPDATE Vehicle SET client_id = "client_fallback" WHERE client_id IS NULL;

-- ============================================================
-- Invoice / Proforma
-- ============================================================
UPDATE Proforma SET appointment_id = "appointment_fallback" WHERE appointment_id IS NULL;

UPDATE Invoice SET proforma_id    = "proforma_fallback"   WHERE proforma_id IS NULL;
UPDATE Invoice SET appointment_id = "appointment_fallback" WHERE appointment_id IS NULL;
UPDATE Invoice SET user_id        = "user_fallback"       WHERE user_id IS NULL;

-- ============================================================
-- Payment
-- ============================================================
UPDATE Payment SET invoice_id = "invoice_fallback" WHERE invoice_id IS NULL;
UPDATE Payment SET client_id  = "client_fallback"  WHERE client_id IS NULL;
UPDATE Payment SET user_id    = "user_fallback"    WHERE user_id IS NULL;

-- ============================================================
-- Product / Supplier
-- ============================================================
UPDATE Product SET supplier_id = "supplier_fallback" WHERE supplier_id IS NULL;

-- ============================================================
-- PurchaseOrder / PurchaseReceipt / PurchaseOrderLine
-- ============================================================
UPDATE PurchaseOrder SET supplier_id = "supplier_fallback" WHERE supplier_id IS NULL;

UPDATE PurchaseReceipt SET purchase_order_id = "po_fallback" WHERE purchase_order_id IS NULL;

UPDATE PurchaseOrderLine SET product_id        = "product_fallback" WHERE product_id IS NULL;
UPDATE PurchaseOrderLine SET purchase_order_id = "po_fallback"      WHERE purchase_order_id IS NULL;

-- ============================================================
-- Stock / Inventory
-- ============================================================
UPDATE StockMovement        SET product_id = "product_fallback" WHERE product_id IS NULL;
UPDATE InventoryReservation SET product_id = "product_fallback" WHERE product_id IS NULL;
UPDATE InventoryAdjustment  SET product_id = "product_fallback" WHERE product_id IS NULL;

-- ============================================================
-- Intervention
-- ============================================================
UPDATE Intervention SET appointment_id = "appointment_fallback" WHERE appointment_id IS NULL;

-- ============================================================
-- RefreshToken
-- ============================================================
UPDATE RefreshToken SET user_id = "user_fallback" WHERE user_id IS NULL;

-- ============================================================
-- workspace_id partout (sécurité finale)
-- ============================================================
UPDATE User                SET workspace_id = "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971" WHERE workspace_id IS NULL;
UPDATE Client              SET workspace_id = "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971" WHERE workspace_id IS NULL;
UPDATE Supplier            SET workspace_id = "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971" WHERE workspace_id IS NULL;
UPDATE Product             SET workspace_id = "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971" WHERE workspace_id IS NULL;
UPDATE Vehicle             SET workspace_id = "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971" WHERE workspace_id IS NULL;
UPDATE TimeSlot            SET workspace_id = "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971" WHERE workspace_id IS NULL;
UPDATE Appointment         SET workspace_id = "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971" WHERE workspace_id IS NULL;
UPDATE PurchaseOrder       SET workspace_id = "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971" WHERE workspace_id IS NULL;
UPDATE PurchaseReceipt     SET workspace_id = "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971" WHERE workspace_id IS NULL;
UPDATE PurchaseOrderLine   SET workspace_id = "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971" WHERE workspace_id IS NULL;
UPDATE StockMovement       SET workspace_id = "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971" WHERE workspace_id IS NULL;
UPDATE InventoryReservation SET workspace_id = "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971" WHERE workspace_id IS NULL;
UPDATE InventoryAdjustment SET workspace_id = "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971" WHERE workspace_id IS NULL;
UPDATE Proforma            SET workspace_id = "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971" WHERE workspace_id IS NULL;
UPDATE Invoice             SET workspace_id = "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971" WHERE workspace_id IS NULL;
UPDATE Payment             SET workspace_id = "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971" WHERE workspace_id IS NULL;
UPDATE Intervention        SET workspace_id = "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971" WHERE workspace_id IS NULL;
UPDATE RefreshToken        SET workspace_id = "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971" WHERE workspace_id IS NULL;
