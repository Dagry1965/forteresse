'use client';

import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";

const API_BASE = "http://localhost:4000";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
        }),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        setError("Réponse invalide du serveur.");
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setError(data?.message || "Identifiants incorrects.");
        setLoading(false);
        return;
      }

      if (!data.access_token || !data.user) {
        setError("Réponse invalide du serveur.");
        setLoading(false);
        return;
      }

      // 🔥 CORRECTION CRITIQUE : clé cohérente avec lib/api.ts
      localStorage.setItem("access_token", data.access_token);

      // 🔥 Stockage du workspace multi-tenant
      const workspaceId = data.user?.memberships?.[0]?.workspaceId;
      if (workspaceId) {
        localStorage.setItem("current_workspace_id", workspaceId);
      }

      // 🔥 Mise à jour du contexte Auth
      login(data.access_token, data.user);

      // 🔥 Redirection
      window.location.href = "/dashboard";

    } catch (err) {
      console.error("Erreur login:", err);
      setError("Impossible de joindre le serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-slate-100 font-sans">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl bg-white px-6 py-8 shadow-lg"
      >
        <h2 className="mb-6 text-center text-2xl font-bold text-slate-900">
          Forteresse ERP - Login
        </h2>

        {error && (
          <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-slate-600">
            Email
          </label>
          <input
            type="email"
            placeholder="admin@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="mb-6">
          <label className="mb-1 block text-sm font-medium text-slate-600">
            Mot de passe
          </label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full py-3 text-base font-bold"
        >
          {loading ? "Connexion en cours..." : "Se connecter"}
        </Button>
      </form>
    </div>
  );
}
