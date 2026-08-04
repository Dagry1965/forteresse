import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

type InventoryItem = {
  name: string;
  sku: string;
  quantity: number;
  price_buy: number | string;
};

type StockMovement = {
  id: string;
  created_at: string;
  type: string;
  quantity: number;
  reference_id?: string;
};

export default function ItemDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [activeTab, setActiveTab] = useState<'details' | 'movements'>('details');
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [item, setItem] = useState<InventoryItem | null>(null);

  // 1. Charger les infos de l'article
  useEffect(() => {
    if (!id) return;
    axios.get(`http://localhost:4000/api/inventory/items/${id}`, {
      headers: { 'x-workspace-id': 'seed-workspace-1' }
    }).then((res) => setItem(res.data as InventoryItem));
  }, [id]);

  // 2. Charger les mouvements si l'onglet est actif
  useEffect(() => {
    if (id && activeTab === 'movements') {
      axios.get(`http://localhost:4000/api/inventory/movements/item/${id}`, {
        headers: { 'x-workspace-id': 'seed-workspace-1' }
      }).then((res) => setMovements(Array.isArray(res.data) ? (res.data as StockMovement[]) : []));
    }
  }, [id, activeTab]);

  if (!item) return <p>Chargement...</p>;

  return (
    <div className="p-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">{item.name}</h1>
        <p className="text-gray-500 text-sm">Référence : {item.sku}</p>
      </header>

      {/* Système d'onglets */}
      <div className="flex border-b mb-6">
        <button
          className={`py-2 px-4 ${activeTab === 'details' ? 'border-b-2 border-blue-500 font-bold' : ''}`}
          onClick={() => setActiveTab('details')}
        >
          Informations générales
        </button>
        <button
          className={`py-2 px-4 ${activeTab === 'movements' ? 'border-b-2 border-blue-500 font-bold' : ''}`}
          onClick={() => setActiveTab('movements')}
        >
          Historique des mouvements
        </button>
      </div>

      {/* Contenu de l'onglet Détails */}
      {activeTab === 'details' && (
        <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded shadow">
          <div>
            <p className="text-sm text-gray-500">Stock Actuel</p>
            <p className="text-2xl font-bold">{item.quantity}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Prix d'achat (HT)</p>
            <p className="text-2xl font-bold">{item.price_buy} €</p>
          </div>
        </div>
      )}

      {/* Contenu de l'onglet Mouvements */}
      {activeTab === 'movements' && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase italic">Date</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase italic">Type</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase italic">Qté</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase italic">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {movements.map((m: StockMovement) => (
                <tr key={m.id}>
                  <td className="px-6 py-4 text-sm">{new Date(m.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded ${m.type === 'IN_PURCHASE' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                      {m.type}
                    </span>
                  </td>
                  <td className={`px-6 py-4 font-bold ${m.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">{m.reference_id || 'N/A'}</td>
                </tr>
              ))}
              {movements.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-gray-400">Aucun mouvement pour cet article.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
