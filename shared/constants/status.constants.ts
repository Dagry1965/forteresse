// ====================== CLIENT ======================
export const CLIENT_TYPE = {
  INDIVIDUAL: 'INDIVIDUAL',
  COMPANY: 'COMPANY',
} as const;

// ====================== VEHICLE ======================
export const VEHICLE_STATUS = {
  DISPONIBLE: 'DISPONIBLE',
  EN_REPARATION: 'EN_REPARATION',
  EN_ATTENTE_PIECES: 'EN_ATTENTE_PIECES',
  VENDU: 'VENDU',
  HORS_SERVICE: 'HORS_SERVICE',
} as const;

export const VEHICLE_STATUS_TRANSITIONS: Record<string, readonly string[]> = {
  [VEHICLE_STATUS.DISPONIBLE]: [
    VEHICLE_STATUS.EN_REPARATION,
    VEHICLE_STATUS.EN_ATTENTE_PIECES,
    VEHICLE_STATUS.HORS_SERVICE,
    VEHICLE_STATUS.VENDU,
  ],
  [VEHICLE_STATUS.EN_REPARATION]: [
    VEHICLE_STATUS.DISPONIBLE,
    VEHICLE_STATUS.EN_ATTENTE_PIECES,
    VEHICLE_STATUS.HORS_SERVICE,
  ],
  [VEHICLE_STATUS.EN_ATTENTE_PIECES]: [
    VEHICLE_STATUS.EN_REPARATION,
    VEHICLE_STATUS.DISPONIBLE,
    VEHICLE_STATUS.HORS_SERVICE,
  ],
  [VEHICLE_STATUS.HORS_SERVICE]: [
    VEHICLE_STATUS.DISPONIBLE,
    VEHICLE_STATUS.EN_REPARATION,
  ],
  [VEHICLE_STATUS.VENDU]: [],
};

// ====================== APPOINTMENT ======================
export const APPOINTMENT_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  IN_PROGRESS: 'IN_PROGRESS',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW',
  COMPLETED: 'COMPLETED',
} as const;

export const APPOINTMENT_STATUS_TRANSITIONS: Record<string, readonly string[]> = {
  [APPOINTMENT_STATUS.PENDING]: [
    APPOINTMENT_STATUS.CONFIRMED,
    APPOINTMENT_STATUS.IN_PROGRESS,
    APPOINTMENT_STATUS.CANCELLED,
    APPOINTMENT_STATUS.NO_SHOW,
  ],
  [APPOINTMENT_STATUS.CONFIRMED]: [
    APPOINTMENT_STATUS.IN_PROGRESS,
    APPOINTMENT_STATUS.CANCELLED,
    APPOINTMENT_STATUS.NO_SHOW,
  ],
  [APPOINTMENT_STATUS.IN_PROGRESS]: [
    APPOINTMENT_STATUS.COMPLETED,
  ],
  [APPOINTMENT_STATUS.COMPLETED]: [],
  [APPOINTMENT_STATUS.CANCELLED]: [],
  [APPOINTMENT_STATUS.NO_SHOW]: [],
};

// ====================== INTERVENTION ======================
export const INTERVENTION_STATUS = {
  PENDING: 'PENDING',
  DIAGNOSIS: 'DIAGNOSIS',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
} as const;

export const INTERVENTION_STATUS_TRANSITIONS: Record<string, readonly string[]> = {
  [INTERVENTION_STATUS.PENDING]: [
    INTERVENTION_STATUS.DIAGNOSIS,
    INTERVENTION_STATUS.IN_PROGRESS,
    INTERVENTION_STATUS.COMPLETED,
  ],
  [INTERVENTION_STATUS.DIAGNOSIS]: [
    INTERVENTION_STATUS.IN_PROGRESS,
    INTERVENTION_STATUS.COMPLETED,
  ],
  [INTERVENTION_STATUS.IN_PROGRESS]: [
    INTERVENTION_STATUS.COMPLETED,
  ],
  [INTERVENTION_STATUS.COMPLETED]: [],
};

// ====================== PROFORMA ======================
export const PROFORMA_STATUS = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
} as const;

export const PROFORMA_STATUS_TRANSITIONS: Record<string, readonly string[]> = {
  [PROFORMA_STATUS.DRAFT]: [
    PROFORMA_STATUS.SENT,
    PROFORMA_STATUS.ACCEPTED,
    PROFORMA_STATUS.REJECTED,
  ],
  [PROFORMA_STATUS.SENT]: [
    PROFORMA_STATUS.ACCEPTED,
    PROFORMA_STATUS.REJECTED,
  ],
  [PROFORMA_STATUS.ACCEPTED]: [],
  [PROFORMA_STATUS.REJECTED]: [],
};

// ====================== INVOICE ======================
export const INVOICE_STATUS = {
  DRAFT: 'DRAFT',
  UNPAID: 'UNPAID',
  PARTIALLY_PAID: 'PARTIALLY_PAID',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE',
  CANCELLED: 'CANCELLED',
} as const;

export const INVOICE_TYPE = {
  PROFORMA: 'PROFORMA',
  INVOICE: 'INVOICE',
  FLEET: 'FLEET',
} as const;

// ====================== PAYMENT SCHEDULE ======================
export const PAYMENT_SCHEDULE_STATUS = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  CANCELLED: 'CANCELLED',
} as const;

// ====================== TIME SLOT ======================
export const TIME_SLOT_STATUS = {
  OPEN: 'OPEN',
  CLOSED: 'CLOSED',
  CANCELLED: 'CANCELLED',
} as const;

export const TIME_SLOT_STATUS_TRANSITIONS: Record<string, readonly string[]> = {
  [TIME_SLOT_STATUS.OPEN]: [
    TIME_SLOT_STATUS.CLOSED,
    TIME_SLOT_STATUS.CANCELLED,
  ],
  [TIME_SLOT_STATUS.CLOSED]: [
    TIME_SLOT_STATUS.OPEN,
    TIME_SLOT_STATUS.CANCELLED,
  ],
  [TIME_SLOT_STATUS.CANCELLED]: [],
};

// ====================== USER / MEMBER ======================
export const USER_ROLE = {
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
  MECHANIC: 'MECHANIC',
} as const;

// ====================== CASE (WORK ORDER) ======================
export const CASE_STATUS = {
  RECEIVED: 'RECEIVED',
  DIAGNOSIS: 'DIAGNOSIS',
  WAITING_PARTS: 'WAITING_PARTS',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  INVOICED: 'INVOICED',
} as const;

export const CASE_STATUS_TRANSITIONS: Record<string, readonly string[]> = {
  [CASE_STATUS.RECEIVED]: [
    CASE_STATUS.DIAGNOSIS,
    CASE_STATUS.IN_PROGRESS,
  ],
  [CASE_STATUS.DIAGNOSIS]: [
    CASE_STATUS.WAITING_PARTS,
    CASE_STATUS.IN_PROGRESS,
  ],
  [CASE_STATUS.WAITING_PARTS]: [
    CASE_STATUS.IN_PROGRESS,
  ],
  [CASE_STATUS.IN_PROGRESS]: [
    CASE_STATUS.COMPLETED,
  ],
  [CASE_STATUS.COMPLETED]: [
    CASE_STATUS.INVOICED,
  ],
  [CASE_STATUS.INVOICED]: [],
};

// ====================== PURCHASE ORDER (COMMANDE FOURNISSEUR) ======================
export const PURCHASE_ORDER_STATUS = {
  DRAFT: 'DRAFT',               // En cours de rédaction
  SENT: 'SENT',                 // Envoyée au fournisseur
  PARTIALLY_RECEIVED: 'PARTIALLY_RECEIVED', // Reçue en partie (ex: 5 filtres sur 10)
  RECEIVED: 'RECEIVED',         // Entièrement reçue
  CANCELLED: 'CANCELLED',       // Annulée
} as const;

export const PURCHASE_ORDER_STATUS_TRANSITIONS: Record<string, readonly string[]> = {
  [PURCHASE_ORDER_STATUS.DRAFT]: [
    PURCHASE_ORDER_STATUS.SENT,
    PURCHASE_ORDER_STATUS.CANCELLED,
  ],
  [PURCHASE_ORDER_STATUS.SENT]: [
    PURCHASE_ORDER_STATUS.PARTIALLY_RECEIVED,
    PURCHASE_ORDER_STATUS.RECEIVED,
    PURCHASE_ORDER_STATUS.CANCELLED,
  ],
  [PURCHASE_ORDER_STATUS.PARTIALLY_RECEIVED]: [
    PURCHASE_ORDER_STATUS.RECEIVED,
  ],
  [PURCHASE_ORDER_STATUS.RECEIVED]: [],
  [PURCHASE_ORDER_STATUS.CANCELLED]: [],
};

// ====================== STOCK ALERT (ÉTAT DU STOCK) ======================
// Utile pour les filtres et les indicateurs visuels (pastilles de couleur)
export const STOCK_ALERT_STATUS = {
  IN_STOCK: 'IN_STOCK',         // Stock suffisant
  LOW_STOCK: 'LOW_STOCK',       // Sous le seuil de sécurité
  OUT_OF_STOCK: 'OUT_OF_STOCK', // Rupture
} as const;

// ====================== STOCK MOVEMENT TYPE ======================
// Ton modèle Prisma a un champ "type" (String), voici les valeurs recommandées
export const STOCK_MOVEMENT_TYPE = {
  IN_PURCHASE: 'IN_PURCHASE',   // Entrée suite à achat
  IN_ADJUSTMENT: 'IN_ADJUSTMENT', // Correction manuelle (inventaire +)
  IN_RETURN: 'IN_RETURN',       // Retour de pièce non utilisée
  OUT_WORKSHOP: 'OUT_WORKSHOP', // Sortie pour une intervention
  OUT_ADJUSTMENT: 'OUT_ADJUSTMENT', // Correction manuelle (casse/vol -)
  OUT_RETURN_TO_SUPPLIER: 'OUT_RETURN_TO_SUPPLIER', // Retour au fournisseur
} as const;

// ====================== NUMBER SEQUENCES (TYPES DE DOCUMENTS) ======================
export const DOCUMENT_CONFIG = {
  INVOICE: { code: 'FAC', type: 'INVOICE' },
  PROFORMA: { code: 'DEV', type: 'PROFORMA' },
  PURCHASE_ORDER: { code: 'CMD', type: 'PURCHASE_ORDER' },
  CASE: { code: 'DOS', type: 'CASE' },
  RECEIPT: { code: 'REC', type: 'RECEIPT' },
  INVENTORY: { code: 'INV', type: 'INVENTORY' },
  CREDIT_NOTE: { code: 'AV', type: 'CREDIT_NOTE' },
} as const;

// ====================== TYPES UTILES ======================
export type AppointmentStatus = keyof typeof APPOINTMENT_STATUS;
export type TimeSlotStatus = keyof typeof TIME_SLOT_STATUS;
export type VehicleStatus = keyof typeof VEHICLE_STATUS;
export type InterventionStatus = keyof typeof INTERVENTION_STATUS;
export type ProformaStatus = keyof typeof PROFORMA_STATUS;
export type InvoiceStatus = keyof typeof INVOICE_STATUS;
export type CaseStatus = keyof typeof CASE_STATUS;
export type PurchaseOrderStatus = keyof typeof PURCHASE_ORDER_STATUS;
export type StockAlertStatus = keyof typeof STOCK_ALERT_STATUS;
export type StockMovementType = keyof typeof STOCK_MOVEMENT_TYPE;
export type DocumentType = keyof typeof DOCUMENT_CONFIG;
