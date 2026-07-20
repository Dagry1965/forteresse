import { API } from "@/lib/api";

export interface UserMembership {
  id: string;
  role: string;
  workspace_id: string;
}

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  workspace_id: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  workspaceMembers?: UserMembership[];
}

export interface CreateUserPayload {
  email: string;
  password: string;
  name: string;
  role: "ADMIN" | "MEMBER" | "MECHANIC";
  workspace_id: string;
}

export const userService = {
  async getAll(workspaceId: string): Promise<UserAccount[]> {
    if (!workspaceId) {
      throw new Error("workspaceId est requis");
    }

    return API.get<UserAccount[]>(
      `/api/users?workspaceId=${encodeURIComponent(workspaceId)}`
    );
  },

  async create(data: CreateUserPayload): Promise<UserAccount> {
    return API.post<UserAccount>("/api/users", data);
  },

  async update(id: string, data: Partial<CreateUserPayload>) {
    return API.patch(`/api/users/${id}`, data);
  },

  async restore(id: string) {
    return API.patch(`/api/users/${id}/restore`);
  },

  async delete(id: string) {
    return API.delete(`/api/users/${id}`);
  },
};


