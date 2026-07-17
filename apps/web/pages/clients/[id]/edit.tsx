'use client';

import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { clientService } from "@/services/clientService";
import { Button } from "@/components/ui/button";

export default function EditClientPage() {
  const router = useRouter();
  const clientId = router.query.id as string;

  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Champs communs
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Champs entreprise
  const [siret, setSiret] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [contactPerson, setContactPerson] = useState("");

  const loadClient = async () => {
    if (!clientId) return;

    try {
      setLoading(true);
      const data = await clientService.getOne(clientId);

      setClient(data);
      setName(data.name || "");
      setEmail(data.email || "");
      setPhone(data.phone || "");

      if (data.type === "COMPANY") {
        setSiret(data.siret || "");
        setVatNumber(data.vatNumber || "");
        setContactPerson(data.contactPerson || "");
      }
    } catch (err) {
      console.error("Erreur chargement client", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClient();
  }, [clientId]);

  const handleSave = async () => {
    try {
      const payload: any = {
        name,
        email,
        phone,
      };

      if (client.type === "COMPANY") {
        payload.siret = siret;
        payload.vatNumber = vatNumber;
        payload.contactPerson = contactPerson;
      }

      await clientService.update(clientId, payload);
      alert("Client mis à jour !");
      router.push(`/clients/${clientId}`);
    } catch (err) {
      alert("Erreur lors de la mise à jour");
    }
  };

  if (!clientId || loading) {
    return <div className="p-10">Chargement...</div>;
  }

  return (
    <div className="p-10 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 lowercase">Modifier le client</h1>

      <div className="space-y-5">

        {/* Champs communs */}
        <input
          className="w-full border rounded-2xl px-4 py-3"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nom"
        />

        <input
          className="w-full border rounded-2xl px-4 py-3"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
        />

        <input
          className="w-full border rounded-2xl px-4 py-3"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Téléphone"
        />

        {/* Champs entreprise */}
        {client.type === "COMPANY" && (
          <>
            <input
              className="w-full border rounded-2xl px-4 py-3"
              value={siret}
              onChange={(e) => setSiret(e.target.value)}
              placeholder="SIRET"
            />

            <input
              className="w-full border rounded-2xl px-4 py-3"
              value={vatNumber}
              onChange={(e) => setVatNumber(e.target.value)}
              placeholder="Numéro TVA"
            />

            <input
              className="w-full border rounded-2xl px-4 py-3"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              placeholder="Contact principal"
            />
          </>
        )}

        <Button className="w-full py-4" onClick={handleSave}>
          Enregistrer
        </Button>

        <Button
          variant="outline"
          className="w-full py-4"
          onClick={() => router.push(`/clients/${clientId}`)}
        >
          Retour
        </Button>
      </div>
    </div>
  );
}
