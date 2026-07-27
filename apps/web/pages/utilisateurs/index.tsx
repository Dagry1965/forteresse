"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DataTable, Column } from "@/components/ui/data-table";
import { USER_ROLE } from '../../../../shared/constants/status.constants';
import {
  userService,
  UserAccount,
  CreateUserPayload,
} from "@/services/userService";

export default function UtilisateursPage() {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<CreateUserPayload>({
    name: "",
    email: "",
    password: "",
    role: USER_ROLE.MEMBER,
    workspace_id: "",
  });

  const loadUsers = async () => {
    const workspaceId = localStorage.getItem("current_workspace_id");

    if (!workspaceId) {
      toast.error("Aucun garage sélectionné");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await userService.getAll(workspaceId);
      setUsers(data);
      setForm((current) => ({
        ...current,
        workspace_id: workspaceId,
      }));
    } catch (error) {
      console.error(error);
      toast.error("Impossible de charger les utilisateurs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      await userService.create(form);
      toast.success("Utilisateur créé avec succès");

      setForm((current) => ({
        name: "",
        email: "",
        password: "",
        role: USER_ROLE.MEMBER,
        workspace_id: current.workspace_id,
      }));

      await loadUsers();
    } catch (error) {
      console.error(error);
      toast.error("Impossible de créer l'utilisateur");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    const confirmed = window.confirm(
      "Désactiver cet utilisateur ?"
    );

    if (!confirmed) return;

    try {
      await userService.delete(id);
      toast.success("Utilisateur désactivé");
      await loadUsers();
    } catch (error) {
      console.error(error);
      toast.error("Impossible de désactiver l'utilisateur");
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await userService.restore(id);
      toast.success("Utilisateur réactivé");
      await loadUsers();
    } catch (error) {
      console.error(error);
      toast.error("Impossible de réactiver l'utilisateur");
    }
  };

  const columns: Column<UserAccount>[] = [
    { key: "name", header: "Nom" },
    { key: "email", header: "Email" },
    {
      key: "role",
      header: "Rôle",
      render: (user) =>
        user.workspaceMembers?.[0]?.role ?? USER_ROLE.MEMBER,
    },
    {
      key: "status",
      header: "Statut",
      render: (user) => (
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
            user.deleted_at
              ? "bg-red-100 text-red-700"
              : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {user.deleted_at ? "Désactivé" : "Actif"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (user) =>
        user.deleted_at ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleRestore(user.id)}
          >
            Réactiver
          </Button>
        ) : (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDeactivate(user.id)}
          >
            Désactiver
          </Button>
        ),
    },
  ];

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Utilisateurs</h1>
        <p className="text-muted-foreground">
          Gérez les comptes autorisés à accéder à AMARKHYS.
        </p>
      </div>

      <form
        autoComplete="off"
        onSubmit={handleCreate}
        className="grid grid-cols-1 md:grid-cols-2 gap-4 border rounded-lg p-5"
      >
        <input
          className="border rounded-md px-3 py-2"
          placeholder="Nom complet"
          value={form.name}
          onChange={(event) =>
            setForm({ ...form, name: event.target.value })
          }
          required
        />

        <input
          className="border rounded-md px-3 py-2"
          type="email"
          name="new-user-email"
          autoComplete="off"
          placeholder="Adresse email"
          value={form.email}
          onChange={(event) =>
            setForm({ ...form, email: event.target.value })
          }
          required
        />

        <input
          className="border rounded-md px-3 py-2"
          type="password"
          name="new-user-password"
          autoComplete="new-password"
          placeholder="Mot de passe temporaire"
          value={form.password}
          onChange={(event) =>
            setForm({ ...form, password: event.target.value })
          }
          required
        />

        <select
          className="border rounded-md px-3 py-2"
          value={form.role}
          onChange={(event) =>
            setForm({
              ...form,
              role: event.target.value as CreateUserPayload["role"],
            })
          }
        >
          <option value="MEMBER">Accueil / Membre</option>
          <option value="MECHANIC">Mécanicien</option>
          <option value="ADMIN">Administrateur</option>
        </select>

        <div className="md:col-span-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Création..." : "Créer l'utilisateur"}
          </Button>
        </div>
      </form>

      <DataTable
        columns={columns}
        data={users}
        loading={loading}
      />
    </div>
  );
}



