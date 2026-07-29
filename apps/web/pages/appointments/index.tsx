'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';

const FullCalendar = dynamic(() => import('@fullcalendar/react'), { ssr: false });

import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';

import { appointmentService } from '@/services/appointmentService';
import { clientService, Client } from '@/services/clientService';
import { vehicleService, Vehicle } from '@/services/vehicleService';

import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

import { EntityFormModal } from '@/components/common/EntityFormModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { AppointmentUiMapper } from '@/shared/mappers/appointmentUiMapper';
import { APPOINTMENT_STATUS } from '../../../../shared/constants/status.constants';

export default function AppointmentsPage() {
  const router = useRouter();
  /* ================= ÉTATS ================= */
  const [appointments, setAppointments] = useState<any[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // ✅ CHANGEMENT : 'list' par défaut au lieu de 'calendar'
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [queryPrefillHandled, setQueryPrefillHandled] = useState(false);

  // Filtres et recherche
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterDate, setFilterDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // États pour l'annulation
  const [cancelDialogOpen, setCancelModalOpen] = useState(false);
  const [apptToCancel, setApptToCancel] = useState<string | null>(null);

  const [form, setForm] = useState({
    id: '',
    clientId: '',
    vehicleId: '',
    timeSlotId: '',
    startTime: '',
    endTime: '',
  });

  /* ================= CHARGEMENT ================= */
  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const workspaceId =
        localStorage.getItem("current_workspace_id") || undefined;

      if (!workspaceId) {
        toast.error("Aucun espace de travail sélectionné.");
        setLoading(false);
        return;
      }

      const [appts, cls, vehs] = await Promise.all([
        appointmentService.getAll(workspaceId),
        clientService.getAll(workspaceId),
        vehicleService.getAll(workspaceId),
      ]);
      setAppointments(appts || []);
      setClients(cls || []);
      setVehicles(vehs || []);
    } catch (e) {
      toast.error('Erreur de chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const loadSlots = async (date: string) => {
    try {
      setLoadingSlots(true);
      const workspaceId = localStorage.getItem('current_workspace_id') || undefined;
      const slots = await appointmentService.getAvailableSlots(date, workspaceId);
      setAvailableSlots(slots || []);
    } catch (e) {
      toast.error('Erreur lors de la récupération des créneaux');
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (!router.isReady || queryPrefillHandled || loading) return;

    const clientId =
      typeof router.query.clientId === 'string'
        ? router.query.clientId
        : '';
    const vehicleId =
      typeof router.query.vehicleId === 'string'
        ? router.query.vehicleId
        : '';

    if (!clientId && !vehicleId) {
      setQueryPrefillHandled(true);
      return;
    }

    if (!clientId || !vehicleId) {
      toast.error(
        'Les informations du client et du v\u00e9hicule sont incompl\u00e8tes.',
      );
      setQueryPrefillHandled(true);
      return;
    }

    if (vehicles.length === 0) return;

    const selectedVehicle = vehicles.find(
      (vehicle) => (vehicle.id || vehicle._id) === vehicleId,
    );

    if (!selectedVehicle) {
      toast.error('Le v\u00e9hicule demand\u00e9 est introuvable.');
      setQueryPrefillHandled(true);
      return;
    }

    const vehicleClientId =
      selectedVehicle.clientId ||
      (selectedVehicle as Vehicle & { client_id?: string }).client_id ||
      '';

    if (vehicleClientId !== clientId) {
      toast.error(
        'Ce v\u00e9hicule n\u2019appartient pas au client s\u00e9lectionn\u00e9.',
      );
      setQueryPrefillHandled(true);
      return;
    }

    const date = new Date().toISOString().split('T')[0];
    setSelectedDate(date);
    void loadSlots(date);
    setIsEditing(false);
    setForm({
      id: '',
      clientId,
      vehicleId,
      timeSlotId: '',
      startTime: '',
      endTime: '',
    });
    setModalOpen(true);
    setQueryPrefillHandled(true);
  }, [
    router.isReady,
    router.query.clientId,
    router.query.vehicleId,
    queryPrefillHandled,
    loading,
    vehicles,
  ]);

  const calendarEvents = useMemo(() => {
  return appointments
    .map(AppointmentUiMapper.toFullCalendar)
    .filter(
      (
        event,
      ): event is NonNullable<
        ReturnType<typeof AppointmentUiMapper.toFullCalendar>
      > => event !== null,
    );
}, [appointments]);

  /* ================= FILTRAGE ET RECHERCHE (CRUCIAL) ================= */
  const filteredAppointments = useMemo(() => {
    return appointments.filter((appt) => {
      const matchStatus = filterStatus
        ? appt.status === filterStatus
        : appt.status !== APPOINTMENT_STATUS.COMPLETED && appt.status !== APPOINTMENT_STATUS.CANCELLED;

      const matchDate =
        !filterDate ||
        (appt.date &&
          new Date(appt.date).toISOString().split('T')[0] === filterDate);

      const s = searchTerm.toLowerCase().trim();
      const clientName = appt.client?.name?.toLowerCase() || '';
      const vehicleInfo =
        `${appt.vehicle?.brand || ''} ${appt.vehicle?.model || ''}`.toLowerCase();
      const matchSearch =
        !s || clientName.includes(s) || vehicleInfo.includes(s);

      return matchStatus && matchDate && matchSearch;
    });
  }, [appointments, filterStatus, filterDate, searchTerm]);

  /* ================= GESTION WORKSHOP (ATELIER) ================= */
  const handleStartWorkshop = async (id: string) => {
    try {
      await appointmentService.startIntervention(id);
      toast.success('Véhicule envoyé à l’atelier (Diagnostic)');
      fetchInitialData();
    } catch (e: any) {
      toast.error(
        e.response?.data?.message || "Erreur lors de l'envoi à l'atelier",
      );
    }
  };

  /* ================= GESTION MODAL ================= */
  const openCreateModal = (dateStr?: string) => {
    const d = dateStr
      ? dateStr.split('T')[0]
      : new Date().toISOString().split('T')[0];
    setSelectedDate(d);
    loadSlots(d);
    setIsEditing(false);
    setForm({
      id: '',
      clientId: '',
      vehicleId: '',
      timeSlotId: '',
      startTime: '',
      endTime: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (appointment: any) => {
    if (!appointment) return;
    const d = appointment.date || new Date().toISOString().split('T')[0];
    setSelectedDate(d);
    loadSlots(d);
    setIsEditing(true);
    setForm({
      id: appointment.id || appointment._id,
      clientId: appointment.client_id || appointment.clientId,
      vehicleId: appointment.vehicle_id || appointment.vehicleId,
      timeSlotId: appointment.time_slot_id || appointment.timeSlotId || '',
      startTime: appointment.startTime || '',
      endTime: appointment.endTime || '',
    });
    setModalOpen(true);
  };

  const handleCancelClick = (id: string) => {
    setApptToCancel(id);
    setCancelModalOpen(true);
  };

  const confirmCancel = async () => {
    if (!apptToCancel) return;
    try {
      await appointmentService.cancel(apptToCancel);
      toast.success('Le rendez-vous a été annulé');
      fetchInitialData();
    } catch (e: any) {
      toast.error("Erreur lors de l’annulation");
    } finally {
      setCancelModalOpen(false);
      setApptToCancel(null);
    }
  };

  /* ================= SOUMISSION ================= */
  const handleSubmit = async () => {
    if (!form.clientId || !form.vehicleId || !form.startTime) {
      toast.error('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    try {
      const workspaceId =
        localStorage.getItem('current_workspace_id') || undefined;
      const payload: any = {
        clientId: form.clientId,
        vehicleId: form.vehicleId,
        date: selectedDate,
        workspaceId,
      };

      if (form.timeSlotId && form.timeSlotId.trim() !== '') {
        payload.timeSlotId = form.timeSlotId;
      } else {
        payload.startTime = form.startTime;
        payload.endTime = form.endTime;
      }

      if (isEditing && form.id) {
        await appointmentService.update(form.id, payload);
        toast.success('Rendez-vous mis à jour');
      } else {
        await appointmentService.create(payload);
        toast.success('Rendez-vous créé');
      }

      setModalOpen(false);
      fetchInitialData();
    } catch (e: any) {
      const errorMsg =
        e.response?.data?.message ||
        e.message ||
        'Erreur lors de l’enregistrement';
      toast.error(errorMsg);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Rendez-vous</h1>
        <Button onClick={() => openCreateModal()}>+ Nouveau rendez-vous</Button>
      </div>

      {/* Barre de Recherche et Filtres */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <select
            className="border rounded-md px-3 py-2 text-sm bg-white min-w-[150px]"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Rendez-vous actifs</option>
            <option value={APPOINTMENT_STATUS.PENDING}>En attente</option>
            <option value={APPOINTMENT_STATUS.CONFIRMED}>Confirmé</option>
            <option value={APPOINTMENT_STATUS.COMPLETED}>Consommés / Atelier</option>
            <option value={APPOINTMENT_STATUS.CANCELLED}>Annulés</option>
          </select>

          <input
            type="date"
            className="border rounded-md px-3 py-2 text-sm bg-white"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />

          {(filterStatus || filterDate || searchTerm) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterStatus('');
                setFilterDate('');
                setSearchTerm('');
              }}
            >
              Réinitialiser
            </Button>
          )}
        </div>

        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Rechercher un client ou un véhicule..."
            className="w-full border rounded-full px-10 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="absolute left-4 top-2.5 text-gray-400 text-xs">
            🔍
          </span>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-4 top-2.5 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-2 mb-4 bg-muted p-1 w-fit rounded-lg">
        <Button
          variant={viewMode === 'calendar' ? 'secondary' : 'ghost'}
          onClick={() => setViewMode('calendar')}
        >
          Calendrier
        </Button>
        <Button
          variant={viewMode === 'list' ? 'secondary' : 'ghost'}
          onClick={() => setViewMode('list')}
        >
          Liste
        </Button>
      </div>

      {viewMode === 'calendar' ? (
        <div className="bg-white p-4 border rounded-xl shadow-sm">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            locale={frLocale}
            events={calendarEvents}
            editable
            selectable
            dateClick={(arg) => openCreateModal(arg.dateStr)}
            eventClick={(info) => {
              const appt = info.event.extendedProps.appointment;
              if (appt) openEditModal(appt);
            }}
            height="700px"
          />
        </div>
      ) : (
        <DataTable
          data={filteredAppointments}
          loading={loading}
          onRowClick={(row) => openEditModal(row)}
          searchable={false}
          columns={[
            {
              key: 'date',
              header: 'Date',
              render: (r) =>
                r.date
                  ? new Date(r.date).toLocaleDateString('fr-FR', {
                      weekday: 'short',
                      day: '2-digit',
                      month: 'short',
                    })
                  : '—',
            },
            {
              key: 'client',
              header: 'Client',
              render: (r) => r.client?.name || '—',
            },
            {
              key: 'vehicle',
              header: 'Véhicule',
              render: (r) =>
                r.vehicle
                  ? `${r.vehicle.brand || ''} ${r.vehicle.model || ''}`.trim()
                  : '—',
            },
            {
              key: 'time',
              header: 'Horaire',
              render: (r) => {
                const startStr = r.time_slot?.start || r.startTime;
                const endStr = r.time_slot?.end || r.endTime;
                if (!startStr) return '—';
                const start = new Date(startStr).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const end = new Date(endStr).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                return `${start} → ${end}`;
              },
            },
            {
              key: 'status',
              header: 'Statut',
              render: (r) => {
                const status = r.status;
                let colorClass = 'bg-gray-100 text-gray-700';
                if (status === APPOINTMENT_STATUS.CONFIRMED)
                  colorClass = 'bg-green-100 text-green-700 font-bold';
                else if (status === APPOINTMENT_STATUS.PENDING)
                  colorClass = 'bg-yellow-100 text-yellow-700';
                else if (status === APPOINTMENT_STATUS.CANCELLED)
                  colorClass = 'bg-red-100 text-red-700';
                else if (status === APPOINTMENT_STATUS.COMPLETED)
                  colorClass = 'bg-blue-100 text-blue-700';
                return (
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${colorClass}`}
                  >
                    {status}
                  </span>
                );
              },
            },
            {
              key: 'actions',
              header: 'Actions',
              render: (r) => (
                <div
                  className="flex gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  {(r.status === APPOINTMENT_STATUS.PENDING || r.status === APPOINTMENT_STATUS.CONFIRMED) && (
                    <Button
                      size="sm"
                      className="bg-orange-500 hover:bg-orange-600 text-white"
                      onClick={() => handleStartWorkshop(r.id || r._id)}
                    >
                      Démarrer Atelier
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditModal(r)}
                  >
                    Modifier
                  </Button>

                  {r.status !== APPOINTMENT_STATUS.CANCELLED && r.status !== APPOINTMENT_STATUS.COMPLETED && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() =>
                        handleCancelClick(r.id || r._id)
                      }
                    >
                      Annuler
                    </Button>
                  )}
                </div>
              ),
            },
          ]}
        />
      )}

      {/* MODALE DE FORMULAIRE */}
      <EntityFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={isEditing ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous'}
        onSubmit={handleSubmit}
      >
        <div className="space-y-4 py-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Date</label>
            <input
              type="date"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={selectedDate}
              onChange={(e) => {
                const date = e.target.value;
                setSelectedDate(date);
                setForm({
                  ...form,
                  timeSlotId: '',
                  startTime: '',
                  endTime: '',
                });
                loadSlots(date);
              }}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Client</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.clientId}
              onChange={(e) =>
                setForm({
                  ...form,
                  clientId: e.target.value,
                  vehicleId: '',
                })
              }
            >
              <option value="">Sélectionner un client</option>
              {clients.map((c) => (
                <option key={c.id || c._id} value={c.id || c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Véhicule</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
              value={form.vehicleId}
              disabled={!form.clientId}
              onChange={(e) =>
                setForm({ ...form, vehicleId: e.target.value })
              }
            >
              <option value="">Sélectionner un véhicule</option>
              {vehicles
                .filter(
                  (v) =>
                    (v.clientId || (v as any).client_id) === form.clientId,
                )
                .map((v) => (
                  <option key={v.id || v._id} value={v.id || v._id}>
                    {v.brand} {v.model} ({v.registration})
                  </option>
                ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Créneau horaire</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.startTime}
              onChange={(e) => {
                const slot = availableSlots.find(
                  (s: any) => s.start === e.target.value,
                );
                if (slot) {
                  setForm({
                    ...form,
                    startTime: slot.start,
                    endTime: slot.end,
                    timeSlotId: slot.id || slot._id || '',
                  });
                }
              }}
            >
              <option value="">
                {loadingSlots ? 'Chargement...' : 'Choisir une heure'}
              </option>
              {availableSlots.map((s: any, idx: number) => {
                const label =
                  s.label ||
                  `${new Date(s.start).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })} → ${new Date(s.end).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}`;

                const totalCapacity =
                  typeof s.booked === 'number' &&
                  typeof s.available === 'number'
                    ? s.booked + s.available
                    : undefined;

                const capacityInfo =
                  s.available === 0
                    ? ' (Complet)'
                    : totalCapacity !== undefined
                    ? ` (${s.booked}/${totalCapacity})`
                    : '';

                return (
                  <option
                    key={idx}
                    value={s.start}
                    disabled={s.isAvailable === false || s.available === 0}
                  >
                    {label}
                    {capacityInfo}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </EntityFormModal>

      <ConfirmDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelModalOpen}
        onConfirm={confirmCancel}
        title="Annuler le rendez-vous"
        description="Êtes-vous sûr de vouloir annuler ce rendez-vous ? Cette action est irréversible."
        confirmText="Annuler"
        cancelText="Retour"
        variant="destructive"
      />
    </div>
  );
}



