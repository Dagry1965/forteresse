'use client';

import React, { useEffect, useState } from 'react';
import { API } from '@/lib/api';

interface HealthStatus {
  endpoint: string;
  status: 'loading' | 'ok' | 'error';
  message?: string;
  responseTime?: number;
}

const endpointsToCheck = [
  { name: 'Clients', url: 'http://localhost:4000/api/clients' },
  { name: 'Appointments Pending', url: 'http://localhost:4000/api/appointments/pending' },
  { name: 'Interventions', url: 'http://localhost:4000/api/interventions' },
  { name: 'Unpaid Invoices', url: 'http://localhost:4000/api/invoices/unpaid' },
];

export default function SystemHealth() {
  const [statuses, setStatuses] = useState<HealthStatus[]>(
    endpointsToCheck.map(ep => ({
      endpoint: ep.name,
      status: 'loading',
    }))
  );

  const checkEndpoint = async (name: string, url: string, index: number) => {
    const startTime = Date.now();

    try {
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'x-workspace-id': localStorage.getItem('current_workspace_id') || '',
        },
      });

      const responseTime = Date.now() - startTime;

      setStatuses(prev => {
        const newStatuses = [...prev];
        newStatuses[index] = {
          endpoint: name,
          status: res.ok ? 'ok' : 'error',
          message: res.ok ? 'OK' : `Erreur ${res.status}`,
          responseTime,
        };
        return newStatuses;
      });
    } catch (error) {
      setStatuses(prev => {
        const newStatuses = [...prev];
        newStatuses[index] = {
          endpoint: name,
          status: 'error',
          message: 'Impossible de joindre le serveur',
        };
        return newStatuses;
      });
    }
  };

  useEffect(() => {
    endpointsToCheck.forEach((ep, index) => {
      checkEndpoint(ep.name, ep.url, index);
    });
  }, []);

  return (
    <div className="bg-white rounded-3xl border p-6">
      <h3 className="text-lg font-bold mb-4">État de santé du système</h3>
      
      <div className="space-y-3">
        {statuses.map((item, index) => (
          <div key={index} className="flex items-center justify-between border rounded-2xl px-4 py-3">
            <div className="font-medium">{item.endpoint}</div>
            
            <div className="flex items-center gap-3">
              {item.status === 'loading' && (
                <span className="text-yellow-600">Vérification...</span>
              )}
              
              {item.status === 'ok' && (
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                  OK {item.responseTime && `(${item.responseTime}ms)`}
                </span>
              )}
              
              {item.status === 'error' && (
                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                  {item.message}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <button 
        onClick={() => window.location.reload()} 
        className="mt-4 text-sm text-blue-600 hover:underline"
      >
        Rafraîchir les statuts
      </button>
    </div>
  );
}