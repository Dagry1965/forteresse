# ================================================
# Script : Création des Hooks uniquement
# ================================================

$basePath = "C:\Users\Admin\forteresse\apps\web\hooks"

New-Item -ItemType Directory -Force -Path $basePath | Out-Null

function Write-FileSafe {
    param([string]$Path, [string]$Content)
    [System.IO.File]::WriteAllText($Path, $Content, [System.Text.UTF8Encoding]::new($false))
    Write-Host "✓ Créé : $Path" -ForegroundColor Green
}

# ====================== HOOKS ======================

# useClients
Write-FileSafe "$basePath\useClients.ts" @'
'use client';
import { useState, useEffect } from 'react';
import { clientService, Client } from '@/services/clientService';

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const data = await clientService.getAll();
      setClients(data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClients(); }, []);
  return { clients, loading, refetch: fetchClients };
}
'@

# useVehicles
Write-FileSafe "$basePath\useVehicles.ts" @'
'use client';
import { useState, useEffect } from 'react';
import { vehicleService, Vehicle } from '@/services/vehicleService';

export function useVehicles(clientId?: string) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const data = clientId 
        ? await vehicleService.getByClient(clientId)
        : await vehicleService.getAll();
      setVehicles(data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVehicles(); }, [clientId]);
  return { vehicles, loading, refetch: fetchVehicles };
}
'@

# useAppointments
Write-FileSafe "$basePath\useAppointments.ts" @'
'use client';
import { useState, useEffect } from 'react';
import { appointmentService } from '@/services/appointmentService';

export function useAppointments() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const all = await appointmentService.getAll();
      const pend = await appointmentService.getPending();
      setAppointments(all || []);
      setPending(pend || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);
  return { appointments, pending, loading, refetch: fetchAll };
}
'@

# useWorkshop
Write-FileSafe "$basePath\useWorkshop.ts" @'
'use client';
import { useState, useEffect } from 'react';
import { workshopService } from '@/services/workshopService';

export function useWorkshop() {
  const [interventions, setInterventions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInterventions = async () => {
    try {
      setLoading(true);
      const data = await workshopService.getAll();
      setInterventions(data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInterventions(); }, []);
  return { interventions, loading, refetch: fetchInterventions };
}
'@

# useFinance (Caisse)
Write-FileSafe "$basePath\useFinance.ts" @'
'use client';
import { useState, useEffect } from 'react';
import { financeService } from '@/services/financeService';

export function useFinance() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUnpaid = async () => {
    try {
      setLoading(true);
      const data = await financeService.getUnpaidInvoices();
      setInvoices(data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUnpaid(); }, []);
  return { invoices, loading, refetch: fetchUnpaid };
}
'@

Write-Host "`n✅ Tous les hooks ont été créés avec succès !" -ForegroundColor Green