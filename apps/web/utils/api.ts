// apps/web/utils/api.ts

const API_BASE = "http://localhost:4000";
const WORKSPACE_ID = "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971";

export async function apiFetch(endpoint: string, options: any = {}) {
  // Récupération du token depuis le localStorage (plus simple pour cet utilitaire hors React)
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  
  const headers = {
    'Content-Type': 'application/json',
    'x-workspace-id': WORKSPACE_ID,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const res = await fetch(url, { ...options, headers });

    // Gestion automatique de la déconnexion si le token est expiré
    if (res.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }

    return res;
  } catch (err) {
    console.error(`Erreur API (${endpoint}):`, err);
    throw err;
  }
}
