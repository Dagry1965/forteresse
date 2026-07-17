const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {},
) {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("access_token")
      : null;

  const workspaceId =
    typeof window !== "undefined"
      ? localStorage.getItem("current_workspace_id")
      : null;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    "x-workspace-id": workspaceId || "",
    ...(token
      ? { Authorization: `Bearer ${token}` }
      : {}),
    ...(options.headers || {}),
  };

  const url =
    API_BASE +
    (endpoint.startsWith("/") ? endpoint : `/${endpoint}`);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (
      response.status === 401 &&
      typeof window !== "undefined"
    ) {
      localStorage.removeItem("access_token");
      window.location.href = "/login";
    }

    return response;
  } catch (error) {
    console.error("Erreur réseau :", error);
    throw error;
  }
}
