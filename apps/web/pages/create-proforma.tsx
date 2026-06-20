import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const WORKSPACE_ID = "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971";

export default function CreateProforma() {
  const { token } = useAuth();
  const router = useRouter();
  const queryInterventionId = router.query.interventionId as string;

  const [products, setProducts] = useState<any[]>([]);
  const [interventions, setInterventions] = useState<any[]>([]);
  const [interventionId, setInterventionId] = useState("");
  const [selectedLines, setSelectedLines] = useState<any[]>([]);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(true);

  // Pour la main d'oeuvre
  const [laborPrice, setLaborPrice] = useState(0);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Charger les produits (Catalogue)
      const resP = await apiFetch(`/api/inventory/products?workspaceId=${WORKSPACE_ID}`);
      const dataP = await resP.json();
      setProducts(Array.isArray(dataP) ? dataP : []);
      
      // 2. Charger les interventions à l'atelier
      const resI = await apiFetch(`/api/interventions?workspaceId=${WORKSPACE_ID}`);
      const dataI = await resI.json();
      setInterventions(Array.isArray(dataI) ? dataI : []);

      // Si on arrive depuis la page Atelier avec un ID d'intervention
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

  const addLine = (p: any) => {
    setSelectedLines([...selectedLines, { 
        product_id: p.id, 
        name: p.name, 
        quantity: 1, 
        price: Number(p.selling_price) 
    }]);
  };

  const addLabor = () => {
    if (laborPrice <= 0) return;
    setSelectedLines([...selectedLines, { 
        product_id: null, 
        name: "Main d'œuvre", 
        quantity: 1, 
        price: Number(laborPrice) 
    }]);
    setLaborPrice(0);
  };

  const calculateTotal = () => {
    return selectedLines.reduce((sum, l) => sum + (l.quantity * l.price), 0);
  };

  const submitProforma = async () => {
    if (!interventionId) return alert("Veuillez sélectionner une intervention.");
    if (selectedLines.length === 0) return alert("Le devis est vide.");
    
    const payload = {
      workspaceId: WORKSPACE_ID,
      intervention_id: interventionId, // Doit correspondre au DTO Backend
      lines: selectedLines.map(l => ({ 
        product_id: l.product_id, 
        description: l.name, 
        quantity: l.quantity, 
        unit_price: l.price 
      }))
    };

    try {
        const res = await apiFetch('/api/proformas', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            setMessage({ text: "✅ Devis généré avec succès !", type: "success" });
            setSelectedLines([]);
            setTimeout(() => router.push('/workshop'), 1500);
        } else {
            const err = await res.json();
            setMessage({ text: `❌ Erreur : ${err.message}`, type: "error" });
        }
    } catch (err) {
        setMessage({ text: "❌ Impossible de joindre le serveur", type: "error" });
    }
  };

  if (!token) return <p style={{ padding: 24 }}>Veuillez vous connecter...</p>;

  return (
    <div style={{ padding: 24, fontFamily: "sans-serif", maxWidth: '1000px', margin: '0 auto' }}>
      <h1>🧾 Établir un Devis (Proforma)</h1>
      
      <div style={{ background: '#f8fafc', padding: 20, borderRadius: 8, marginBottom: 20, border: '1px solid #e2e8f0' }}>
        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: 10 }}>Choisir l'Intervention liée :</label>
        <select 
            value={interventionId} 
            onChange={e => setInterventionId(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
        >
          <option value="">--- Sélectionner l'intervention en cours ---</option>
          {interventions.map(i => (
            <option key={i.id} value={i.id}>
              🔧 {i.appointment?.vehicle?.plateNumber} — {i.appointment?.vehicle?.client?.name} ({i.status})
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        {/* CATALOGUE */}
        <div>
          <h3>📦 Catalogue Pièces</h3>
          <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 8, background: 'white' }}>
            {products.map(p => (
              <div key={p.id} style={{ padding: '12px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <strong>{p.name}</strong><br/>
                    <small style={{ color: '#64748b' }}>Stock: {p.inventory?.quantity || 0} | Réf: {p.reference}</small>
                </div>
                <button 
                    onClick={() => addLine(p)}
                    style={{ background: '#2563eb', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer' }}
                >
                    {p.selling_price}€ +
                </button>
              </div>
            ))}
          </div>

          <h3 style={{ marginTop: 24 }}>🛠️ Main d'œuvre</h3>
          <div style={{ display: 'flex', gap: 10 }}>
            <input 
                type="number" 
                placeholder="Prix Main d'œuvre" 
                value={laborPrice} 
                onChange={e => setLaborPrice(Number(e.target.value))}
                style={{ flex: 1, padding: 10, borderRadius: 6, border: '1px solid #cbd5e1' }}
            />
            <button onClick={addLabor} style={{ background: '#10b981', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}>Ajouter</button>
          </div>
        </div>

        {/* RÉCAPITULATIF */}
        <div style={{ background: 'white', padding: 24, borderRadius: 12, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', height: 'fit-content' }}>
          <h3>📋 Récapitulatif Devis</h3>
          {selectedLines.length === 0 ? (
            <p style={{ color: '#64748b', textAlign: 'center', padding: 20 }}>Votre devis est vide.</p>
          ) : (
            <>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                        {selectedLines.map((l, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '10px 0' }}>{l.name}</td>
                                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{l.price.toFixed(2)}€</td>
                                <td style={{ textAlign: 'right' }}>
                                    <button onClick={() => setSelectedLines(selectedLines.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>✕</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div style={{ marginTop: 20, paddingTop: 20, borderTop: '2px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>TOTAL TTC</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>{calculateTotal().toFixed(2)} €</span>
                </div>
                <button 
                    onClick={submitProforma} 
                    style={{ width: '100%', background: '#1e293b', color: 'white', marginTop: 24, padding: '15px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}
                >
                    GÉNÉRER LE DEVIS OFFICIEL
                </button>
            </>
          )}
        </div>
      </div>

      {message.text && (
        <div style={{ 
            marginTop: 20, 
            padding: 15, 
            borderRadius: 8, 
            background: message.type === 'success' ? '#dcfce7' : '#fee2e2',
            color: message.type === 'success' ? '#166534' : '#991b1b',
            textAlign: 'center',
            fontWeight: 'bold'
        }}>
            {message.text}
        </div>
      )}
    </div>
  );
}
