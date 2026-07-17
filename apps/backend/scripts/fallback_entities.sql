-- ============================================================
-- Fallback Workspace (si jamais)
-- ============================================================
INSERT OR IGNORE INTO Workspace (id, name, created_at, updated_at)
VALUES ("fallback_workspace", "Fallback Workspace", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ============================================================
-- Fallback User
-- ============================================================
INSERT OR IGNORE INTO User (id, email, name, password, created_at, updated_at, workspace_id)
VALUES ("user_fallback", "system@fallback.local", "System Fallback", "fallback", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971");

-- ============================================================
-- Fallback Client
-- ============================================================
INSERT OR IGNORE INTO Client (id, name, phone, email, created_at, updated_at, workspace_id)
VALUES ("client_fallback", "Client inconnu", "", "", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971");

-- ============================================================
-- Fallback Supplier
-- ============================================================
INSERT OR IGNORE INTO Supplier (id, name, phone, email, created_at, updated_at, workspace_id)
VALUES ("supplier_fallback", "Fournisseur inconnu", "", "", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971");

-- ============================================================
-- Fallback Product
-- ============================================================
INSERT OR IGNORE INTO Product (id, name, price, created_at, updated_at, workspace_id, supplier_id)
VALUES ("product_fallback", "Produit générique", 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971", "supplier_fallback");

-- ============================================================
-- Fallback Vehicle
-- ============================================================
INSERT OR IGNORE INTO Vehicle (id, registration, brand, model, created_at, updated_at, workspace_id, client_id)
VALUES ("vehicle_fallback", "UNKNOWN", "N/A", "N/A", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971", "client_fallback");

-- ============================================================
-- Fallback TimeSlot
-- ============================================================
INSERT OR IGNORE INTO TimeSlot (id, start, end, created_at, updated_at, workspace_id)
VALUES ("timeslot_fallback", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971");

-- ============================================================
-- Fallback PurchaseOrder
-- ============================================================
INSERT OR IGNORE INTO PurchaseOrder (id, reference, status, created_at, updated_at, workspace_id, supplier_id)
VALUES ("po_fallback", "PO-FALLBACK", "draft", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971", "supplier_fallback");

-- ============================================================
-- Fallback PurchaseReceipt
-- ============================================================
INSERT OR IGNORE INTO PurchaseReceipt (id, reference, created_at, updated_at, workspace_id, purchase_order_id)
VALUES ("pr_fallback", "PR-FALLBACK", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971", "po_fallback");

-- ============================================================
-- Fallback Proforma
-- ============================================================
INSERT OR IGNORE INTO Proforma (id, reference, total, status, created_at, updated_at, workspace_id, appointment_id)
VALUES ("proforma_fallback", "PRO-FALLBACK", 0, "draft", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971", "appointment_fallback");

-- ============================================================
-- Fallback Appointment
-- ============================================================
INSERT OR IGNORE INTO Appointment (id, date, status, created_at, updated_at, workspace_id, client_id, vehicle_id, time_slot_id, user_id)
VALUES ("appointment_fallback", CURRENT_TIMESTAMP, "pending", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971", "client_fallback", "vehicle_fallback", "timeslot_fallback", "user_fallback");

-- ============================================================
-- Fallback Invoice
-- ============================================================
INSERT OR IGNORE INTO Invoice (id, reference, total, status, created_at, updated_at, workspace_id, proforma_id, appointment_id, user_id)
VALUES ("invoice_fallback", "INV-FALLBACK", 0, "unpaid", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971", "proforma_fallback", "appointment_fallback", "user_fallback");

-- ============================================================
-- Fallback Payment
-- ============================================================
INSERT OR IGNORE INTO Payment (id, amount, method, created_at, updated_at, workspace_id, invoice_id, client_id, user_id)
VALUES ("payment_fallback", 0, "cash", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971", "invoice_fallback", "client_fallback", "user_fallback");

-- ============================================================
-- Fallback PurchaseOrderLine
-- ============================================================
INSERT OR IGNORE INTO PurchaseOrderLine (id, quantity, unit_price, created_at, updated_at, workspace_id, product_id, purchase_order_id)
VALUES ("pol_fallback", 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971", "product_fallback", "po_fallback");

-- ============================================================
-- Fallback StockMovement
-- ============================================================
INSERT OR IGNORE INTO StockMovement (id, quantity, type, created_at, updated_at, workspace_id, product_id)
VALUES ("stock_fallback", 0, "in", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971", "product_fallback");

-- ============================================================
-- Fallback InventoryReservation
-- ============================================================
INSERT OR IGNORE INTO InventoryReservation (id, quantity, created_at, updated_at, workspace_id, product_id)
VALUES ("reservation_fallback", 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971", "product_fallback");

-- ============================================================
-- Fallback InventoryAdjustment
-- ============================================================
INSERT OR IGNORE INTO InventoryAdjustment (id, quantity, reason, created_at, updated_at, workspace_id, product_id)
VALUES ("adjustment_fallback", 0, "fallback", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971", "product_fallback");

-- ============================================================
-- Fallback Intervention
-- ============================================================
INSERT OR IGNORE INTO Intervention (id, description, status, created_at, updated_at, workspace_id, appointment_id)
VALUES ("intervention_fallback", "Intervention fallback", "pending", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971", "appointment_fallback");

-- ============================================================
-- Fallback RefreshToken
-- ============================================================
INSERT OR IGNORE INTO RefreshToken (id, token_hash, expires_at, created_at, updated_at, workspace_id, user_id)
VALUES ("rt_fallback", "fallback_hash", DATETIME('now', '+365 days'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971", "user_fallback");
