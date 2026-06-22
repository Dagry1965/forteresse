import React, { useState } from "react";
import { Button } from "../components/ui/button";
import { TextField } from "../components/ui/text-field";
import { DateField } from "../components/ui/date-field";
import { Alert } from "../components/ui/alert";
import Section from "../components/section";

const WORKSPACE_ID = "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971";

export default function BookingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "",
    plateNumber: "", make: "", model: "",
    scheduled_at: "", description: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("http://localhost:4000/api/public/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, workspaceId: WORKSPACE_ID })
      });
      if (res.ok) setSuccess(true);
      else alert("erreur lors de l'envoi");
    } catch (err) {
      alert("impossible de joindre le serveur");
    } finally { setLoading(false); }
  };

  if (success) return (
    <div className="flex h-screen items-center justify-center p-6 bg-[oklch(0.98_0_0)] font-sans">
      <div className="max-w-md w-full text-center flex flex-col gap-6">
        <Alert type="success" title="demande reÃƒÆ’Ã‚Â§ue !">
          votre rendez-vous est en cours de validation. nous vous recontacterons trÃƒÆ’Ã‚Â¨s vite.
        </Alert>
        <Button onClick={() => window.location.reload()} className="py-6 rounded-2xl font-bold uppercase tracking-widest text-[10px]">nouvelle demande</Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[oklch(0.98_0_0)] p-10 font-sans flex flex-col items-center gap-12">
      <div className="text-center flex flex-col gap-2">
        <h1 className="text-4xl font-bold tracking-tighter lowercase">prendre rendez-vous</h1>
        <p className="text-[oklch(0.45_0_0)] font-medium italic">votre garage forteresse ÃƒÆ’Ã‚Â  votre service</p>
      </div>

      <div className="max-w-xl w-full">
        <Section title={step === 1 ? "vos coordonnÃƒÆ’Ã‚Â©es" : "votre vÃƒÆ’Ã‚Â©hicule"}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {step === 1 ? (
              <>
                <TextField label="nom complet" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                <TextField label="email" type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                <TextField label="tÃƒÆ’Ã‚Â©lÃƒÆ’Ã‚Â©phone" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                <Button type="button" onClick={() => setStep(2)} className="py-6 rounded-2xl font-bold uppercase tracking-widest text-[10px]">ÃƒÆ’Ã‚Â©tape suivante</Button>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <TextField label="immatriculation" required value={formData.plateNumber} onChange={e => setFormData({...formData, plateNumber: e.target.value})} className="font-mono" />
                  <TextField label="marque" required value={formData.make} onChange={e => setFormData({...formData, make: e.target.value})} />
                </div>
                <TextField label="modÃƒÆ’Ã‚Â¨le" required value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} />
                <DateField label="date souhaitÃƒÆ’Ã‚Â©e" required value={formData.scheduled_at} onChange={e => setFormData({...formData, scheduled_at: e.target.value})} />
                <TextField label="motif" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                <div className="flex gap-4">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1 py-6 rounded-2xl font-bold uppercase tracking-widest text-[10px]">retour</Button>
                  <Button type="submit" className="flex-[2] py-6 rounded-2xl font-bold uppercase tracking-widest text-[10px]" disabled={loading}>{loading ? "envoi..." : "confirmer le rdv"}</Button>
                </div>
              </>
            )}
          </form>
        </Section>
      </div>
    </div>
  );
}
// DÃƒÆ’Ã‚Â©sactivation sidebar admin
BookingPage.getLayout = (page: any) => page;
