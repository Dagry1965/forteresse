'use client';

import React, { useState } from "react";
import { Button } from "../components/ui/button";
import { TextField } from "../components/ui/text-field";
import { DateField } from "../components/ui/date-field";
import { Alert } from "../components/ui/alert";
import Section from "../components/section";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function BookingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    plateNumber: "",
    make: "",
    model: "",
    scheduled_at: "",
    description: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const goToNextStep = () => {
    if (!formData.name || !formData.email || !formData.phone) {
      alert("Veuillez remplir vos coordonnées.");
      return;
    }

    setStep(2);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (
      !formData.plateNumber ||
      !formData.make ||
      !formData.model ||
      !formData.scheduled_at
    ) {
      alert("Veuillez remplir les informations obligatoires.");
      return;
    }

    setLoading(true);

    try {
      const workspaceId =
        typeof window !== "undefined"
          ? localStorage.getItem("current_workspace_id")
          : null;

      const response = await fetch(
        `${API_BASE_URL}/api/public/appointments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...formData,
            workspaceId,
          }),
        },
      );

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Erreur lors de l'envoi.");
      }

      setSuccess(true);
    } catch (error) {
      console.error("Erreur de prise de rendez-vous :", error);
      alert("Impossible d'envoyer la demande de rendez-vous.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[oklch(0.98_0_0)] p-6">
        <div className="w-full max-w-md text-center">
          <Alert type="success" title="Demande reçue !">
            Votre rendez-vous est en cours de validation. Nous vous
            recontacterons très vite.
          </Alert>

          <Button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 w-full rounded-2xl py-6"
          >
            Faire une nouvelle demande
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-[oklch(0.98_0_0)] p-6 md:p-10">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold tracking-tighter">
          Prendre rendez-vous
        </h1>

        <p className="mt-2 text-[oklch(0.45_0_0)]">
          Votre garage AMARKHYS à votre service
        </p>
      </div>

      <div className="w-full max-w-xl">
        <Section
          title={
            step === 1
              ? "Vos coordonnées"
              : "Votre véhicule et le rendez-vous"
          }
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {step === 1 ? (
              <>
                <TextField
                  label="Nom complet"
                  required
                  value={formData.name}
                  onChange={(event) =>
                    handleChange("name", event.target.value)
                  }
                />

                <TextField
                  label="Email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(event) =>
                    handleChange("email", event.target.value)
                  }
                />

                <TextField
                  label="Téléphone"
                  required
                  value={formData.phone}
                  onChange={(event) =>
                    handleChange("phone", event.target.value)
                  }
                />

                <Button
                  type="button"
                  onClick={goToNextStep}
                  className="w-full"
                >
                  Continuer
                </Button>
              </>
            ) : (
              <>
                <TextField
                  label="Immatriculation"
                  required
                  value={formData.plateNumber}
                  onChange={(event) =>
                    handleChange("plateNumber", event.target.value)
                  }
                />

                <TextField
                  label="Marque"
                  required
                  value={formData.make}
                  onChange={(event) =>
                    handleChange("make", event.target.value)
                  }
                />

                <TextField
                  label="Modèle"
                  required
                  value={formData.model}
                  onChange={(event) =>
                    handleChange("model", event.target.value)
                  }
                />

                <DateField
                  label="Date souhaitée"
                  required
                  value={formData.scheduled_at}
                  onChange={(event) =>
                    handleChange("scheduled_at", event.target.value)
                  }
                />

                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="booking-description"
                    className="text-sm font-medium"
                  >
                    Description du besoin
                  </label>

                  <textarea
                    id="booking-description"
                    rows={5}
                    value={formData.description}
                    onChange={(event) =>
                      handleChange("description", event.target.value)
                    }
                    placeholder="Décrivez la panne ou le service souhaité"
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-full"
                  >
                    Retour
                  </Button>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full"
                  >
                    {loading
                      ? "Envoi en cours..."
                      : "Envoyer la demande"}
                  </Button>
                </div>
              </>
            )}
          </form>
        </Section>
      </div>
    </div>
  );
}
