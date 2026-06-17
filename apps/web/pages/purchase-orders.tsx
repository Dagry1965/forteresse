import React, { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const WORKSPACE_ID = "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971";

export default function PurchaseOrdersPage() {
  const { token } = useAuth();
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Formulaire de création de Bon de Commande
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [poLines, setPoLines] = useState<any[]>([]); // { productId, quantity, unit_price }

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Charger les fournisseurs
      const resSuppliers = await apiFetch('/inventory/supplier');
      const dataSuppliers = resSuppliers.ok ? await safeJson(resSuppliers) : [];
      setSuppliers(Array.isArray(dataSuppliers) ? dataSuppliers : []);

  // Charger les produits du catalogue
  const resProducts = await apiFetch(`/inventory/products?workspaceId=${WORKSPACE_ID}`);
  const dataProducts = resProducts.ok ? await safeJson(resProducts) : [];
  setProducts(Array.isArray(dataProducts) ? dataProducts : []);

  // Charger les Bons de Commande existants
  const resPOs = await apiFetch(`/api/purchase-orders?workspaceId=${WORKSPACE_ID}`);
  const dataPOs = resPOs.ok ? await safeJson(resPOs) : [];
  setPurchaseOrders(Array.isArray(dataPOs) ? dataPOs : []);
} catch (err: any) {
  console.error("Erreur chargement POs", err);
  setError(err?.message || 'Erreur de chargement');
} finally {
  setLoading(false);
}
  };

  useEffect(() => {
    if (token) loadData();
  }, [token]);

  function safeJson(res: Response) {
    return res.text().then(txt => {
      try {
        return txt ? JSON.parse(txt) : null;
      } catch {
        return null;
      }
    });
  }

  const handleAddProductToPo = (product: any) => {
    const existing = poLines.find((line: any) => line.productId === product.id);
    if (existing) {
      setPoLines(poLines.map((line: any) =>
        line.productId === product.id ? { ...line, quantity: Number(line.quantity || 0) + 1 } : line
      ));
    } else {
      setPoLines([...poLines, {
        productId: product.id,
        name: product.name, // Pour l'affichage
        quantity: 1,
        unit_price: Number(product.purchase_price || 0)
      }]);
    }
  };

  const handleCreatePo = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);


if (!selectedSupplier) {
  setError("Veuillez choisir un fournisseur.");
  return;
}
if (poLines.length === 0) {
  setError("Veuillez ajouter au moins un produit.");
  return;
}

const normalizedLines = poLines.map(l => ({
  productId: l.productId,
  quantity: Number(l.quantity || 0),
  unit_price: Number(l.unit_price || 0)
}));

const totalAmount = normalizedLines.reduce((sum, line) => sum + (line.quantity * line.unit_price), 0);

try {
  const res = await apiFetch('/api/purchase-orders', {
    method: 'POST',
    body: JSON.stringify({
      workspaceId: WORKSPACE_ID,
      supplierId: selectedSupplier,
      reference: `PO-${Date.now()}`, // Référence unique
      status: 'draft',
      totalAmount,
      lines: normalizedLines
    })
  });

  const body = res.ok ? await safeJson(res) : await safeJson(res);
  if (res.ok) {
    alert("✅ Bon de Commande créé !");
    setSelectedSupplier('');
    setPoLines([]);
    loadData();
  } else {
    setError(body?.message || res.statusText || 'Erreur création Bon de Commande');
  }
} catch (err: any) {
  console.error('create PO error', err);
  setError(err?.message || 'Erreur création Bon de Commande');
}
  };

  const handleConfirmPo = async (poId: string) => {
    setError(null);
    try {
      const res = await apiFetch(/api/purchase-orders/${poId}/confirm, { method: 'POST' });
      const body = res.ok ? await safeJson(res) : await safeJson(res);
      if (res.ok) {
        alert("✅ Bon de Commande confirmé !");
        loadData();
      } else {
        setError(body?.message || res.statusText || 'Erreur confirmation');
      }
    } catch (err: any) {
      setError(err?.message || 'Erreur confirmation');
    }
  };

  const handleReceivePo = async (poId: string) => {
    setError(null);
    const po = purchaseOrders.find(p => p.id === poId);
    if (!po) {
      setError("Bon de Commande introuvable.");
      return;
    }

const receptionRef = prompt("Entrez la référence de la réception (ex: BL-XXXX) :");
if (!receptionRef) {
  setError("Réception annulée : Référence manquante.");
  return;
}

const receptionLines = po.lines.map((line: any) => ({
  productId: line.productId,
  quantity: Number(line.quantity || 0),
  unit_price: Number(line.unit_price || 0)
}));

try {
  const res = await apiFetch('/api/purchase-receipts', {
    method: 'POST',
    body: JSON.stringify({
      purchaseOrderId: po.id,
      workspaceId: WORKSPACE_ID,
      reference: receptionRef,
      status: 'pending',
      lines: receptionLines
    })
  });

  if (!res.ok) {
    const errBody = await safeJson(res);
    throw new Error(errBody?.message || res.statusText);
  }

  const newReceipt = await safeJson(res);
  const resComplete = await apiFetch(`/api/purchase-receipts/${newReceipt.id}/complete`, { method: 'POST' });

  if (!resComplete.ok) {
    const errBody = await safeJson(resComplete);
    throw new Error(errBody?.message || resComplete.statusText);
  }

  alert(`✅ Réception "${receptionRef}" complétée et stock mis à jour !`);
  loadData();
} catch (err: any) {
  console.error('receive PO error', err);
  setError(err?.message || 'Erreur lors de la réception');
}
  };

  if (!token) return <p style={{ padding: 24 }}>Connexion requise...

; if (loading) return <p style={{ padding: 24 }}>Chargement des Bons de Commande...
;
  return (
    <div style={{ padding: 24, fontFamily: "sans-serif", maxWidth: '1200px', margin: '0 auto' }}>
      

🛒 Bons de Commande
  {error && <div style={{ marginBottom: 12, color: 'red' }}>{error}</div>}

  <section style={{ background: '#f4f4f4', padding: 20, borderRadius: 8, marginBottom: 30 }}>
    <h3>➕ Nouveau Bon de Commande</h3>
    <form onSubmit={handleCreatePo} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
      <div>
        <label style={{ display: 'block', marginBottom: 5 }}>Fournisseur :</label>
        <select value={selectedSupplier} onChange={e => setSelectedSupplier(e.target.value)} style={{ width: '100%', padding: 8 }} required>
          <option value="">-- Choisir un fournisseur --</option>
          {suppliers.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <h4 style={{ marginTop: 20 }}>Produits à commander :</h4>
        <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #ccc', padding: 10 }}>
          {products.length === 0 ? (
            <p>Aucun produit disponible. Ajoutez-en via le menu Stock & Catalogue.</p>
          ) : (
            products.map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, background: 'white', padding: 8, borderRadius: 4 }}>
                <span>{p.name} ({Number(p.purchase_price || 0)}€)</span>
                <button type="button" onClick={() => handleAddProductToPo(p)} style={{ background: '#0070f3', color: 'white', border: 'none', padding: '5px 10px', borderRadius: 3, cursor: 'pointer' }}>Ajouter</button>
              </div>
            ))
          )}
        </div>
      </div>
      <div>
        <h4>Lignes du Bon de Commande :</h4>
        {poLines.length === 0 ? (
          <p>Aucune ligne ajoutée.</p>
        ) : (
          poLines.map((line: any, index: number) => (
            <div key={index} style={{ marginBottom: 5, background: 'white', padding: 8, borderRadius: 4 }}>
              {line.name} x
              <input type="number" min={0} value={line.quantity} onChange={e => {
                const newQty = Number(e.target.value || 0);
                setPoLines(poLines.map((l, i) => i === index ? { ...l, quantity: newQty } : l));
              }} style={{ width: 50, padding: 5, margin: '0 8px' }} />
              @ {Number(line.unit_price).toFixed(2)}€
            </div>
          ))
        )}
        <h4 style={{ marginTop: 10 }}>Total : {poLines.reduce((sum, line) => sum + (Number(line.quantity || 0) * Number(line.unit_price || 0)), 0).toFixed(2)}€</h4>
        <button type="submit" style={{ background: '#0070f3', color: 'white', padding: 10, border: 'none', borderRadius: 4, cursor: 'pointer', marginTop: 10 }}>Créer Bon de Commande</button>
      </div>
    </form>
  </section>

  <h3>📋 Liste des Bons de Commande</h3>
  <table border={1} cellPadding={10} style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
    <thead style={{ background: '#eee' }}>
      <tr>
        <th>Référence</th>
        <th>Fournisseur</th>
        <th>Total</th>
        <th>Statut</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {purchaseOrders.length === 0 ? (
        <tr><td colSpan={5} style={{textAlign: 'center'}}>Aucun Bon de Commande trouvé.</td></tr>
      ) : (
        purchaseOrders.map(po => (
          <tr key={po.id}>
            <td>{po.reference}</td>
            <td>{po.supplier?.name}</td>
            <td>{Number(po.totalAmount || 0).toFixed(2)}€</td>
            <td>{po.status}</td>
            <td>
              {po.status === 'draft' && (
                <button onClick={() => handleConfirmPo(po.id)} style={{ background: 'orange', color: 'white', border: 'none', padding: 5, borderRadius: 3, cursor: 'pointer' }}>Confirmer</button>
              )}
              {po.status === 'confirmed' && (
                <button onClick={() => handleReceivePo(po.id)} style={{ background: 'green', color: 'white', border: 'none', padding: 5, borderRadius: 3, cursor: 'pointer' }}>Réceptionner</button>
              )}
              {['received', 'completed'].includes(po.status) && (
                <span style={{ color: 'blue', fontWeight: 'bold' }}>Réceptionné</span>
              )}
            </td>
          </tr>
        ))
      )}
    </tbody>
  </table>
</div>
  );
}