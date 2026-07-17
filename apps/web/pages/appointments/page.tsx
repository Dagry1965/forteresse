'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';

const FullCalendar = dynamic(() => import('@fullcalendar/react'), {
  ssr: false,
});

import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';

export default function CalendarTestPage() {
  const [events] = useState([
    {
      id: '1',
      title: 'Test RDV 1',
      start: new Date().toISOString(),
      end: new Date(Date.now() + 60 * 60000).toISOString(),
    },
    {
      id: '2',
      title: 'Test RDV 2',
      start: new Date(Date.now() + 2 * 3600000).toISOString(),
      end: new Date(Date.now() + 3 * 3600000).toISOString(),
    },
  ]);

  return (
    <div style={{ padding: 20 }}>
      <h1>Calendar Test (isolé)</h1>

      <div style={{ height: '85vh', background: 'white', padding: 10 }}>
        <FullCalendar
          plugins={[timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          locale={frLocale}
          height="100%"
          editable={true}
          selectable={true}
          nowIndicator={true}
          events={events}
        />
      </div>
    </div>
  );
}