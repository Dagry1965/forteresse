'use client';

import React, { useEffect, useState } from "react";
import { useRouter } from "next/router"; // ← Important : next/router (pas next/navigation)
import { clientService } from "@/services/clientService";
import { Button } from "@/components/ui/button";

export default function ClientDetailPage() {
  const router = useRouter();
  const clientId = router.query.id as string; // ← Récupération de l'ID

  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadClient = async () => {
    if (!clientId) return;

    try {
      setLoading(true);
      const data = await clientService.getOne(clientId);
      setClient(data);
    } catch (error) {
      console.error("Erreur chargement client", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clientId) {
      loadClient();
    }
  }, [clientId]);

  if (loading) {
    return <div className="p-10 text-xl">Chargement...</div>;
  }

  if (!client) {
    return <div className="p-10 text-red-600">Client introuvable</div>;
  }

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold mb-6">{client.name}</h1>

      <div className="bg-white p-6 rounded-2xl shadow max-w-lg">
        <p><strong>Email :</strong> {client.email || "—"}</p>
        <p><strong>Téléphone :</strong> {client.phone || "—"}</p>
        <p><strong>Type :</strong> {client.type}</p>

        <div className="mt-6 flex gap-3">
          <Button onClick={() => router.push(`/clients/${client.id}/edit`)}>
            Modifier
          </Button>
          <Button 
            variant="outline" 
            onClick={() => router.push("/clients")}
          >
            Retour à la liste
          </Button>
        </div>
      </div>
    </div>
  );
}