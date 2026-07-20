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
  const token = localStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    ...(token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {}),
  };
}

export const backupService = {
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
