export type BackupLog = {
  id: string;
  file_name: string | null;
  status: "SUCCESS" | "FAILED" | string;
  destination: string | null;
  error_message: string | null;
  created_at: string;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

function getAuthHeaders(): HeadersInit {
  const token =
    localStorage.getItem("access_token") ??
    localStorage.getItem("token");

  const workspaceId =
    localStorage.getItem("current_workspace_id");

  return {
    "Content-Type": "application/json",
    ...(token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {}),
    ...(workspaceId
      ? {
          "x-workspace-id": workspaceId,
        }
      : {}),
  };
}

export const backupService = {
  async run(): Promise<{ success: boolean; message: string }> {
    const response = await fetch(
      `${API_URL}/api/backups/run`,
      {
        method: "POST",
        headers: getAuthHeaders(),
      },
    );

    if (!response.ok) {
      throw new Error(
        `Impossible de lancer la sauvegarde (${response.status})`,
      );
    }

    return response.json();
  },

  async getAll(limit = 30): Promise<BackupLog[]> {
    const response = await fetch(
      `${API_URL}/api/backups?limit=${limit}`,
      {
        headers: getAuthHeaders(),
      },
    );

    if (!response.ok) {
      throw new Error(
        `Impossible de charger l'historique des sauvegardes (${response.status})`,
      );
    }

    return response.json();
  },
};



