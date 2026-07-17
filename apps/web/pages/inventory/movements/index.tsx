import { useEffect, useState } from 'react';
import axios from 'axios';

export default function StockMovementsPage() {
  const [movements, setMovements] = useState([]);

  useEffect(() => {
    const fetchMovements = async () => {
      const { data } = await axios.get('http://localhost:4000/api/inventory/movements', {
        headers: { 'x-workspace-id': 'seed-workspace-1' }
      });
      setMovements(data);
    };
    fetchMovements();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Historique des mouvements de stock</h1>
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Article</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantité</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Référence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {movements.map((m: any) => (
              <tr key={m.id}>
                <td className="px-6 py-4">{new Date(m.created_at).toLocaleString()}</td>
                <td className="px-6 py-4 font-medium">{m.item?.name}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs ${m.type === 'IN_PURCHASE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {m.type}
                  </span>
                </td>
                <td className={`px-6 py-4 font-bold ${m.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{m.reference_id || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
