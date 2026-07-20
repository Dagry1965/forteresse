"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DataTable, Column } from "@/components/ui/data-table";
import {
  backupService,
  BackupLog,
} from "@/services/backupService";

export default function SauvegardesPage() {
  const [backups, setBackups] = useState<BackupLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const loadBackups = async () => {
    try {
      setLoading(true);
      const data = await backupService.getAll(30);
      setBackups(data);
    } catch (error) {
      console.error(error);
      toast.error(
        "Impossible de charger l'historique des sauvegardes",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBackups();
  }, []);

  const runBackup = async () => {
    try {
      setRunning(true);
      const result = await backupService.run();
      toast.success(result.message);
      await loadBackups();
    } catch (error) {
      console.error(error);
      toast.error("Impossible de lancer la sauvegarde");
    } finally {
      setRunning(false);
    }
  };

  const columns: Column<BackupLog>[] = [
    {
      key: "created_at",
      header: "Date",
      render: (backup) =>
        new Date(backup.created_at).toLocaleString("fr-FR"),
    },
    {
      key: "file_name",
      header: "Fichier",
      render: (backup) => backup.file_name ?? "—",
    },
    {
      key: "destination",
      header: "Destination",
      render: (backup) =>
        backup.destination === "LOCAL_AND_GOOGLE_DRIVE"
          ? "Local + Google Drive"
          : backup.destination ?? "—",
    },
    {
      key: "status",
      header: "Statut",
      render: (backup) => (
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
            backup.status === "SUCCESS"
              ? "bg-emerald-100 text-emerald-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {backup.status === "SUCCESS" ? "Réussie" : "Échouée"}
        </span>
      ),
    },
    {
      key: "error_message",
      header: "Erreur",
      render: (backup) => backup.error_message ?? "—",
    },
  ];

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            Historique des sauvegardes
          </h1>
          <p className="text-muted-foreground">
            Consultez les 30 dernières sauvegardes automatiques.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={runBackup}
            disabled={running || loading}
          >
            {running ? "Sauvegarde en cours..." : "Lancer une sauvegarde"}
          </Button>

          <Button
            variant="outline"
            onClick={loadBackups}
            disabled={loading || running}
          >
            {loading ? "Actualisation..." : "Actualiser"}
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={backups}
        loading={loading}
      />
    </div>
  );
}

