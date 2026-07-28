const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function api<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {

  const token = localStorage.getItem("access_token") || localStorage.getItem("token");
  const refreshToken = localStorage.getItem("refreshToken");
  const workspaceId = localStorage.getItem("current_workspace_id");

  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;

  const doFetch = async (accessToken: string | null) => {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      ...(workspaceId && { "x-workspace-id": workspaceId }),
      ...(options.headers || {}),
    };

    // 🔥 LOG 1 : Requête sortante
    console.log(`%c🚀 API CALL: ${options.method || 'GET'} ${fullUrl}`, 'color: #00bfff; font-weight: bold;');
    console.log('📤 Headers:', { 
        "x-workspace-id": workspaceId, 
        "Authorization": accessToken ? "Bearer (présent)" : "Manquant" 
    });

    const res = await fetch(fullUrl, {
      ...options,
      headers,
    });

    const text = await res.text();
    let json: any = null;

    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = { message: text || "Erreur serveur" };
    }

    // === GESTION DES ERREURS ===
    if (!res.ok) {
      // 🔥 LOG 2 : Erreur API
      console.error(`%c❌ API ERROR [${res.status}]: ${fullUrl}`, 'color: #ff4500; font-weight: bold;', json);

      return Promise.reject({
        status: res.status,
        message: json?.message || `Erreur ${res.status}`,
        data: json,
      });
    }

    // 🔥 LOG 3 : Succès API
    console.log(`%c✅ API SUCCESS: ${fullUrl}`, 'color: #32cd32; font-weight: bold;', json);

    return json as T;
  };

  // Refresh Token
  try {
    return await doFetch(token);
  } catch (error: any) {
    if (error?.status === 401 && refreshToken) {
      console.warn("🔄 Tentative de refresh token...");
      try {
        const refreshRes = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });

        if (refreshRes.ok) {
          const data = await refreshRes.json();
          const newAccessToken = data.accessToken || data.access_token;
          localStorage.setItem("token", newAccessToken);
          console.log("✅ Token rafraîchi, on rejoue la requête initiale.");
          return await doFetch(newAccessToken);
        } else {
          console.error("❌ Refresh token invalide, déconnexion.");
          localStorage.clear();
          window.location.href = "/login";
          return Promise.reject({ message: "Session expirée" });
        }
      } catch {
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject({ message: "Session expirée" });
      }
    }

    return Promise.reject(error);
  }
}

export const API = {
  get: <T = any>(url: string) => api<T>(url),
  post: <T = any>(url: string, body?: any) =>
    api<T>(url, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  put: <T = any>(url: string, body?: any) =>
    api<T>(url, { method: "PUT", body: body ? JSON.stringify(body) : undefined }),
  patch: <T = any>(url: string, body?: any) =>
    api<T>(url, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  delete: <T = any>(url: string) => api<T>(url, { method: "DELETE" }),
};

export type FetchTimeSlotsParams = {
  workspaceId: string;
  date: string;
  companyId?: string;
};

export async function fetchTimeSlots({
  workspaceId,
  date,
}: FetchTimeSlotsParams) {
  const params = new URLSearchParams({
    workspaceId,
    date,
  });

  return API.get<any[]>(`/api/time-slots/available?${params.toString()}`);
}

export async function fetchVehicles(workspaceId: string) {
  const params = new URLSearchParams({ workspaceId });
  return API.get<any[]>(`/api/vehicles?${params.toString()}`);
}

export async function fetchEnterpriseVehicles(companyId: string) {
  const workspaceId =
    typeof window !== "undefined"
      ? localStorage.getItem("current_workspace_id") || ""
      : "";

  const params = new URLSearchParams({
    workspaceId,
    companyId,
  });

  return API.get<any[]>(`/api/vehicles?${params.toString()}`);
}

export interface ReserveAppointmentParams {
  workspaceId: string;
  userId?: string;
  vehicleId: string;
  timeSlotId: string;
  date?: string;
  initialDescription?: string;
  companyId?: string;
  publicOrigin?: boolean;
}

export async function reserveAppointment({
  workspaceId,
  userId,
  vehicleId,
  timeSlotId,
  date,
}: ReserveAppointmentParams) {
  if (!vehicleId) {
    throw new Error("Veuillez sélectionner un véhicule.");
  }

  if (!timeSlotId) {
    throw new Error("Veuillez sélectionner un créneau.");
  }

  const vehicle = await API.get<{
    id: string;
    client_id?: string;
    clientId?: string;
    client?: {
      id: string;
    };
  }>(`/api/vehicles/${vehicleId}`);

  const clientId =
    vehicle.client_id ||
    vehicle.clientId ||
    vehicle.client?.id;

  if (!clientId) {
    throw new Error(
      "Aucun client n'est associé à ce véhicule.",
    );
  }

  return API.post('/api/appointments', {
    clientId,
    vehicleId,
    timeSlotId,
    date,
    user_id: userId,
    workspaceId,
  });
}

export async function fetchAppointmentsByDate(
  workspaceId: string,
  date: string,
) {
  const params = new URLSearchParams({
    workspaceId,
    date,
  });

  return API.get<any[]>(
    `/api/appointments?${params.toString()}`,
  );
}

