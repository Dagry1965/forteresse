'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { proformaService } from '@/services/proformaService';
import { workshopService } from '@/services/workshopService';
import { stockService } from '@/services/stockService';
import { Button } from '../components/ui/button';
import Section from '../components/section';

export default function CreateProforma() {
  const { token } = useAuth();
  const router = useRouter();
  const queryInterventionId = router.query.interventionId as string;

  const [products, setProducts] = useState<any[]>([]);
  const [interventions, setInterventions] = useState<any[]>([]);
  const [interventionId, setInterventionId] = useState("");
  const [selectedLines, setSelectedLines] = useState<any[]>([]);
  const [laborPrice, setLaborPrice] = useState(0);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const prods = await stockService.getAll();
      const intervs = await workshopService.getAll();

      setProducts(prods || []);
      setInterventions(intervs || []);

      if (queryInterventionId) setInterventionId(queryInterventionId);
    } catch (err) {
      console.error("Erreur chargement", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && router.isReady) loadData();
  }, [token, router.isReady, queryInterventionId]);

  const addLine = (product: any) => {
    setSelectedLines([
      ...selectedLines,
      {
        product_id: product.id,
        name: product.name,
        quantity: 1,
        price: Number(product.selling_price),
      },
    ]);
  };

  const addLabor = () => {
    if (laborPrice <= 0) return;
    setSelectedLines([
      ...selectedLines,
      {
        product_id: null,
        name: "Main d'œuvre",
        quantity: 1,
        price: Number(laborPrice),
      },
    ]);
    setLaborPrice(0);
  };

  const removeLine = (index: number) => {
    setSelectedLines(selectedLines.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return selectedLines.reduce((sum, line) => sum + line.quantity * line.price, 0);
  };

  const submitProforma = async () => {
    if (!interventionId) return alert("Veuillez sélectionner une intervention.");
    if (selectedLines.length === 0) return alert("Le devis est vide.");

    const payload = {
      intervention_id: interventionId,
      lines: selectedLines.map((line) => ({
        product_id: line.product_id,
        description: line.name,
        quantity: line.quantity,
        unit_price: line.price,
      })),
    };

    try {
      await proformaService.create(payload);
      setMessage({ text: "Devis créé avec succès !", type: "success" });
      setSelectedLines([]);
      setTimeout(() => router.push('/workshop'), 1500);
    } catch (err) {
      setMessage({ text: "Erreur lors de la création du devis", type: "error" });
    }
  };

  if (!token) return <p className="p-10">Veuillez vous connecter...</p>;

  return (
    <div className="max-w-5xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8 lowercase">Établir un Devis (Proforma)</h1>

      <div className="mb-8">
        <label className="font-bold text-sm">Intervention liée :</label>
        <select
          value={interventionId}
          onChange={(e) => setInterventionId(e.target.value)}
          className="w-full mt-2 border rounded-2xl px-4 py-3"
        >
          <option value="">-- Sélectionner une intervention --</option>
          {interventions.map((inter) => (
            <option key={inter.id} value={inter.id}>
              {inter.appointment?.vehicle?.plateNumber} — {inter.appointment?.vehicle?.client?.name} ({inter.status})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Catalogue */}
        <div>
          <Section title="Catalogue Pièces">
            <div className="max-h-[400px] overflow-auto border rounded-2xl">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="flex justify-between items-center p-4 border-b hover:bg-gray-50"
                >
                  <div>
                    <div className="font-medium">{product.name}</div>
                    <div className="text-xs text-gray-500">Stock: {product.inventory?.quantity || 0}</div>
                  </div>
                  <Button onClick={() => addLine(product)} size="sm">
                    {product.selling_price} €
                  </Button>
                </div>
              ))}
            </div>

            {/* Main d'œuvre */}
            <div className="mt-6">
              <h3 className="font-bold mb-2">Main d'œuvre</h3>
              <div className="flex gap-3">
                <input
                  type="number"
                  placeholder="Prix main d'œuvre"
                  value={laborPrice}
                  onChange={(e) => setLaborPrice(Number(e.target.value))}
                  className="flex-1 border rounded-2xl px-4 py-2"
                />
                <Button onClick={addLabor}>Ajouter</Button>
              </div>
            </div>
          </Section>
        </div>

        {/* Récapitulatif */}
        <div>
          <Section title="Récapitulatif du Devis">
            {selectedLines.length === 0 ? (
              <p className="text-center py-10 text-gray-500">Votre devis est vide.</p>
            ) : (
              <>
                <div className="space-y-3 mb-6">
                  {selectedLines.map((line, index) => (
                    <div key={index} className="flex justify-between items-center border-b pb-2">
                      <span>{line.name}</span>
                      <div className="flex items-center gap-4">
                        <span className="font-bold">{(line.quantity * line.price).toFixed(2)} €</span>
                        <button onClick={() => removeLine(index)} className="text-red-500">✕</button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between text-xl font-bold border-t pt-4">
                  <span>Total</span>
                  <span>{calculateTotal().toFixed(2)} €</span>
                </div>

                <Button onClick={submitProforma} className="w-full mt-6 py-6">
                  Valider le devis
                </Button>
              </>
            )}
          </Section>
        </div>
      </div>

      {message.text && (
        <div className={`mt-6 p-4 rounded-2xl ${message.type === "success" ? "bg-green-100" : "bg-red-100"}`}>
          {message.text}
        </div>
      )}
    </div>
  );
}