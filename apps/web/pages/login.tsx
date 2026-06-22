import { useState } from "react";
import { EmptyState } from '../components/ui/empty-state';
import { Tabs } from '../components/ui/tabs';
import { Alert } from '../components/ui/alert';
import { TextareaField } from '../components/ui/textarea-field';
import { SelectField } from '../components/ui/select-field';
import { ResponsiveGrid } from '../components/ui/responsive-grid';
import { DataTable } from '../components/ui/data-table';
import { DateField } from '../components/ui/date-field';
import { TextField } from '../components/ui/text-field';
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";

const API_BASE = "http://localhost:4000";
const WORKSPACE_ID = "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971";

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
          email,
          password,
          workspaceId: WORKSPACE_ID,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        login(data.accessToken, data.refreshToken);
      } else {
        setError(data.message || "Identifiants ou Workspace invalides");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(
        "Impossible de joindre le serveur (VÃƒÆ’Ã‚Â©rifiez que le backend sur le port 4000 est lancÃƒÆ’Ã‚Â©)",
      );
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
            placeholder="ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢"
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


