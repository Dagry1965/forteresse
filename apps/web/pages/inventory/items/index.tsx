// Une version simple pour naviguer vers vos fiches articles
import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';

export default function ItemsListPage() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:4000/api/inventory/items', {
      headers: { 'x-workspace-id': 'seed-workspace-1' }
    }).then(res => setItems(res.data));
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Stock / Catalogue Pièces</h1>
      <div className="grid gap-4">
        {items.map((item: any) => (
          <Link key={item.id} href={`/inventory/items/${item.id}`}>
            <div className="p-4 border rounded hover:bg-gray-50 cursor-pointer flex justify-between">
              <span>{item.name} (SKU: {item.sku})</span>
              <span className="font-bold">{item.quantity} en stock</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
