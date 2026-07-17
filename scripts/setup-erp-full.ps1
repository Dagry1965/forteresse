# =====================================================
# Script ERP - Services + Hooks (Version Stable)
# =====================================================

$projectRoot = "C:\Users\Admin\forteresse"
$basePath = Join-Path $projectRoot "apps\web"

Write-Host "Création des dossiers dans : $basePath" -ForegroundColor Cyan

New-Item -ItemType Directory -Force -Path "$basePath\services" | Out-Null
New-Item -ItemType Directory -Force -Path "$basePath\hooks"   | Out-Null

function Write-Content {
    param([string]$Path, [string]$Content)
    [System.IO.File]::WriteAllText($Path, $Content, [System.Text.UTF8Encoding]::new($false))
}

Write-Host "`nCréation des Services..." -ForegroundColor Yellow

# ===================== SERVICES =====================

Write-Content "$basePath\services\clientService.ts" @'
import { API } from '@/lib/api';

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  type: 'INDIVIDUAL' | 'COMPANY';
}

export const clientService = {
  getAll: () => API.get<Client[]>('/clients'),
  getById: (id: string) => API.get<Client>(`/clients/${id}`),
  create: (data: Partial<Client>) => API.post<Client>('/clients', data),
  update: (id: string, data: Partial<Client>) => API.put<Client>(`/clients/${id}`, data),
  delete: (id: string) => API.delete(`/clients/${id}`),
};
'@

Write-Content "$basePath\services\vehicleService.ts" @'
import { API } from '@/lib/api';

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  plateNumber: string;
  clientId: string;
}

export const vehicleService = {
  getAll: () => API.get<Vehicle[]>('/vehicles'),
  getByClient: (clientId: string) => API.get<Vehicle[]>(`/vehicles?clientId=${clientId}`),
  create: (data: Partial<Vehicle>) => API.post<Vehicle>('/vehicles', data),
  update: (id: string, data: Partial<Vehicle>) => API.put<Vehicle>(`/vehicles/${id}`, data),
  delete: (id: string) => API.delete(`/vehicles/${id}`),
};
'@

Write-Content "$basePath\services\appointmentService.ts" @'
import { API } from '@/lib/api';

export const appointmentService = {
  getAll: () => API.get('/appointments'),
  getPending: () => API.get('/appointments/pending'),
  create: (data: any) => API.post('/appointments', data),
  validate: (id: string, action: 'confirm' | 'cancel') =>
    API.post(`/appointments/${id}/validate`, { action }),
};
'@

Write-Content "$basePath\services\workshopService.ts" @'
import { API } from '@/lib/api';

export const workshopService = {
  getAll: () => API.get('/interventions'),
  createFromAppointment: (appointmentId: string) =>
    API.post(`/interventions/from-appointment/${appointmentId}`, {}),
  updateStatus: (id: string, status: string) =>
    API.put(`/interventions/${id}`, { status }),
};
'@

Write-Content "$basePath\services\proformaService.ts" @'
import { API } from '@/lib/api';

export const proformaService = {
  create: (data: any) => API.post('/proformas', data),
  getAll: () => API.get('/proformas'),
};
'@

Write-Content "$basePath\services\financeService.ts" @'
import { API } from '@/lib/api';

export const financeService = {
  getUnpaidInvoices: () => API.get('/api/finance/unpaid'),
  createPayment: (data: any) => API.post('/api/finance/payments', data),
};
'@

Write-Content "$basePath\services\stockService.ts" @'
import { API } from '@/lib/api';

export const stockService = {
  getAll: () => API.get('/api/inventory/products'),
};
'@

Write-Host "✓ Services créés." -ForegroundColor Green

# ===================== HOOKS =====================

Write-Host "`nCréation des Hooks..." -ForegroundColor Yellow

Write-Content "$basePath\hooks\useClients.ts" @'
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

Write-Host "✓ Hooks créés." -ForegroundColor Green
Write-Host "`n✅ Script terminé avec succès !" -ForegroundColor Green