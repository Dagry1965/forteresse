import {
  APPOINTMENT_STATUS,
  APPOINTMENT_STATUS_TRANSITIONS,
  CASE_STATUS,
  CASE_STATUS_TRANSITIONS,
  INTERVENTION_STATUS,
  INTERVENTION_STATUS_TRANSITIONS,
  PROFORMA_STATUS,
  PROFORMA_STATUS_TRANSITIONS,
  PURCHASE_ORDER_STATUS,
  PURCHASE_ORDER_STATUS_TRANSITIONS,
  TIME_SLOT_STATUS,
  TIME_SLOT_STATUS_TRANSITIONS,
  VEHICLE_STATUS,
  VEHICLE_STATUS_TRANSITIONS,
} from '../../../../../shared/constants/status.constants';

type StatusMap = Record<string, string>;
type TransitionMap = Record<string, readonly string[]>;

function validateTransitionMap(
  statuses: StatusMap,
  transitions: TransitionMap,
): void {
  const knownStatuses = Object.values(statuses);

  expect(Object.keys(transitions).sort()).toEqual(
    [...knownStatuses].sort(),
  );

  for (const [currentStatus, nextStatuses] of Object.entries(transitions)) {
    expect(knownStatuses).toContain(currentStatus);

    for (const nextStatus of nextStatuses) {
      expect(knownStatuses).toContain(nextStatus);
      expect(nextStatus).not.toBe(currentStatus);
    }
  }
}

describe('Transitions de statuts metier', () => {
  it.each([
    ['vehicule', VEHICLE_STATUS, VEHICLE_STATUS_TRANSITIONS],
    ['rendez-vous', APPOINTMENT_STATUS, APPOINTMENT_STATUS_TRANSITIONS],
    ['intervention', INTERVENTION_STATUS, INTERVENTION_STATUS_TRANSITIONS],
    ['proforma', PROFORMA_STATUS, PROFORMA_STATUS_TRANSITIONS],
    ['creneau', TIME_SLOT_STATUS, TIME_SLOT_STATUS_TRANSITIONS],
    ['dossier', CASE_STATUS, CASE_STATUS_TRANSITIONS],
    [
      'commande fournisseur',
      PURCHASE_ORDER_STATUS,
      PURCHASE_ORDER_STATUS_TRANSITIONS,
    ],
  ])(
    'declare uniquement des transitions valides pour %s',
    (_label, statuses, transitions) => {
      validateTransitionMap(statuses, transitions);
    },
  );

  it('protege les statuts terminaux', () => {
    expect(APPOINTMENT_STATUS_TRANSITIONS[APPOINTMENT_STATUS.COMPLETED]).toEqual([]);
    expect(APPOINTMENT_STATUS_TRANSITIONS[APPOINTMENT_STATUS.CANCELLED]).toEqual([]);
    expect(APPOINTMENT_STATUS_TRANSITIONS[APPOINTMENT_STATUS.NO_SHOW]).toEqual([]);
    expect(INTERVENTION_STATUS_TRANSITIONS[INTERVENTION_STATUS.COMPLETED]).toEqual([]);
    expect(PROFORMA_STATUS_TRANSITIONS[PROFORMA_STATUS.ACCEPTED]).toEqual([]);
    expect(PROFORMA_STATUS_TRANSITIONS[PROFORMA_STATUS.REJECTED]).toEqual([]);
    expect(TIME_SLOT_STATUS_TRANSITIONS[TIME_SLOT_STATUS.CANCELLED]).toEqual([]);
    expect(CASE_STATUS_TRANSITIONS[CASE_STATUS.INVOICED]).toEqual([]);
    expect(
      PURCHASE_ORDER_STATUS_TRANSITIONS[PURCHASE_ORDER_STATUS.RECEIVED],
    ).toEqual([]);
    expect(
      PURCHASE_ORDER_STATUS_TRANSITIONS[PURCHASE_ORDER_STATUS.CANCELLED],
    ).toEqual([]);
    expect(VEHICLE_STATUS_TRANSITIONS[VEHICLE_STATUS.VENDU]).toEqual([]);
  });

  it('autorise les parcours metier principaux', () => {
    expect(
      APPOINTMENT_STATUS_TRANSITIONS[APPOINTMENT_STATUS.PENDING],
    ).toContain(APPOINTMENT_STATUS.CONFIRMED);

    expect(
      INTERVENTION_STATUS_TRANSITIONS[INTERVENTION_STATUS.IN_PROGRESS],
    ).toContain(INTERVENTION_STATUS.COMPLETED);

    expect(
      CASE_STATUS_TRANSITIONS[CASE_STATUS.COMPLETED],
    ).toContain(CASE_STATUS.INVOICED);

    expect(
      PURCHASE_ORDER_STATUS_TRANSITIONS[PURCHASE_ORDER_STATUS.SENT],
    ).toContain(PURCHASE_ORDER_STATUS.RECEIVED);
  });
});
