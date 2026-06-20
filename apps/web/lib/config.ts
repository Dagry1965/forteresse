// apps/web/lib/config.ts
export const CONFIG = {
  API_BASE: process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000",
  WORKSPACE_ID: process.env.NEXT_PUBLIC_WORKSPACE_ID || ""
};
