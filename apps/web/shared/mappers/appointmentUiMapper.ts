export class AppointmentUiMapper {
  static toCalendar(appt: any) {
    if (!appt) return null;

    const start = appt.time_slot?.start ? new Date(appt.time_slot.start) : null;
    const end = appt.time_slot?.end ? new Date(appt.time_slot.end) : null;

    if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) {
      return null;
    }

    return {
      id: appt.id,
      title: AppointmentUiMapper.buildTitle(appt),
      start,
      end,
      status: appt.status ?? 'UNKNOWN',
      raw: appt,
    };
  }

  static toFullCalendar(appt: any) {
    const base = AppointmentUiMapper.toCalendar(appt);
    if (!base) return null;

    const color = AppointmentUiMapper.color(base.status);

    return {
      id: base.id,
      title: base.title,
      start: base.start,
      end: base.end,
      backgroundColor: color,
      borderColor: color,
      extendedProps: {
        appointment: base.raw,
      },
    };
  }

  static buildTitle(appt: any) {
    const client = appt.client?.name || 'Client';
    const vehicle = `${appt.vehicle?.make || ''} ${appt.vehicle?.model || ''}`.trim();

    return vehicle ? `${client} - ${vehicle}` : client;
  }

  static color(status?: string) {
    switch (status) {
      case 'PENDING':
        return '#eab308';
      case 'CONFIRMED':
        return '#3b82f6';
      case 'IN_PROGRESS':
        return '#8b5cf6';
      case 'COMPLETED':
        return '#22c55e';
      case 'CANCELLED':
        return '#ef4444';
      case 'NO_SHOW':
        return '#6b7280';
      default:
        return '#64748b';
    }
  }
}