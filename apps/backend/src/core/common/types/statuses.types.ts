import {
  APPOINTMENT_STATUS,
  TIME_SLOT_STATUS,
  VEHICLE_STATUS,
  INTERVENTION_STATUS,
  PROFORMA_STATUS,
  INVOICE_STATUS,
} from '../../../../../../shared/constants/status.constants';

export type AppointmentStatus = (typeof APPOINTMENT_STATUS)[keyof typeof APPOINTMENT_STATUS];
export type TimeSlotStatus = (typeof TIME_SLOT_STATUS)[keyof typeof TIME_SLOT_STATUS];
export type VehicleStatus = (typeof VEHICLE_STATUS)[keyof typeof VEHICLE_STATUS];
export type InterventionStatus = (typeof INTERVENTION_STATUS)[keyof typeof INTERVENTION_STATUS];
export type ProformaStatus = (typeof PROFORMA_STATUS)[keyof typeof PROFORMA_STATUS];
export type InvoiceStatus = (typeof INVOICE_STATUS)[keyof typeof INVOICE_STATUS];