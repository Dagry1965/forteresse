'use client';

import React, { useEffect, useState } from 'react';
import { API } from '@/lib/api';
import { toast } from 'sonner';

type Supplier = {
  id: string;
  name: string;
};

type StockItem = {
  id: string;
  name: string;
  price_buy?: number | null;
  last_purchase_price?: number | null;
};

type PurchaseOrderItemForm = {
  stock_item_id: string;
  quantity: number;
  unit_cost: number;
};

type PurchaseOrderFormData = {
  supplier_id: string;
  expected_date: string;
  items: PurchaseOrderItemForm[];
};

type PurchaseOrderFormProps = {
  onOrderCreated?: () => void;
};

type SuppliersResponse = Supplier[] | { data?: Supplier[] };
type StockItemsResponse = StockItem[] | { data?: StockItem[] };

export const PurchaseOrderForm = ({ onOrderCreated }: PurchaseOrderFormProps) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const [orderData, setOrderData] = useState<PurchaseOrderFormData>({
    supplier_id: '',
    expected_date: '',
    items: [
      {
        stock_item_id: '',
        quantity: 1,
        unit_cost: 0,
      },
    ],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setInitialLoading(true);

        const [suppliersRes, stockRes] = await Promise.all([
          API.get<SuppliersResponse>('/api/suppliers'),
          API.get<StockItemsResponse>('/api/inventory/products'),
        ]);

        const suppliersData = Array.isArray(suppliersRes)
          ? suppliersRes
          : suppliersRes?.data || [];

        const stockData = Array.isArray(stockRes)
          ? stockRes
          : stockRes?.data || [];

        setSuppliers(suppliersData);
        setStockItems(stockData);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddItem = () => {
    setOrderData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          stock_item_id: '',
          quantity: 1,
          unit_cost: 0,
        },
      ],
    }));
  };

  const handleRemoveItem = (index: number) => {
    setOrderData((prev) => {
      if (prev.items.length === 1) return prev;

      return {
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      };
    });
  };

  const handleItemChange = (
    index: number,
    field: keyof PurchaseOrderItemForm,
    value: string | number,
  ) => {
    setOrderData((prev) => {
      const newItems = [...prev.items];

      if (field === 'stock_item_id') {
        const selectedItem = stockItems.find((item) => item.id === value);

        newItems[index] = {
          ...newItems[index],
          stock_item_id: String(value),
          unit_cost:
            Number(
              selectedItem?.price_buy ??
                selectedItem?.last_purchase_price ??
                0,
            ) || 0,
        };
      }

      if (field === 'quantity') {
        const quantity = Number(value);

        newItems[index] = {
          ...newItems[index],
          quantity: quantity > 0 ? quantity : 1,
        };
      }

      if (field === 'unit_cost') {
        const unitCost = Number(value);

        newItems[index] = {
          ...newItems[index],
          unit_cost: unitCost >= 0 ? unitCost : 0,
        };
      }

      return {
        ...prev,
        items: newItems,
      };
    });
  };

const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  const supplierId = orderData.supplier_id?.trim();

  const validItems = orderData.items
    .filter((item) => item.stock_item_id && Number(item.quantity) > 0)
    .map((item) => ({
      stock_item_id: item.stock_item_id,
      quantity: Number(item.quantity),
      unit_cost: Number(item.unit_cost) || 0,
    }));

  if (!supplierId) {
    alert('Veuillez sélectionner un fournisseur.');
    return;
  }

  if (validItems.length === 0) {
    alert('Veuillez sélectionner au moins un article valide.');
    return;
  }

  const payload = {
    supplier_id: supplierId,
    expected_date: orderData.expected_date || undefined,
    items: validItems,
  };

  try {
    setLoading(true);

    const response = await API.post<{ id?: string }>('/api/purchase-orders', payload);

    toast.success("Bon de commande généré avec succès !");

    // Redirection vers la vue du bon de commande
    if (response?.id) {
      window.open(`/purchase-orders/${response.id}`, '_blank'); // Ouvre dans un nouvel onglet
      // ou : router.push(`/purchase-orders/${response.id}`); // dans le même onglet
    }

    // Reset du formulaire
    setOrderData({
      supplier_id: '',
      expected_date: '',
      items: [{ stock_item_id: '', quantity: 1, unit_cost: 0 }],
    });

    onOrderCreated?.();
  } catch (error: unknown) {
    console.error('Erreur complete :', error);

    const message =
      error instanceof Error
        ? error.message
        : typeof error === 'object' &&
            error !== null &&
            'data' in error &&
            typeof error.data === 'object' &&
            error.data !== null &&
            'message' in error.data &&
            typeof error.data.message === 'string'
          ? error.data.message
          : 'Erreur inconnue';

    alert(`Erreur : ${message}`);
  } finally {
    setLoading(false);
  }
};

  if (initialLoading) {
    return (
      <div className="p-10 text-center text-sm text-slate-500 animate-pulse flex flex-col items-center gap-2">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        Chargement du catalogue...
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 bg-white p-4 rounded-lg shadow-sm"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1 tracking-wider">
            Fournisseur
          </label>

          <select
            required
            value={orderData.supplier_id}
            onChange={(e) =>
              setOrderData((prev) => ({
                ...prev,
                supplier_id: e.target.value,
              }))
            }
            className="w-full border border-slate-200 p-2.5 rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-white transition-all"
          >
            <option value="">Sélectionner un fournisseur</option>

            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1 tracking-wider">
            Date prévue
          </label>

          <input
            type="date"
            value={orderData.expected_date}
            onChange={(e) =>
              setOrderData((prev) => ({
                ...prev,
                expected_date: e.target.value,
              }))
            }
            className="w-full border border-slate-200 p-2.5 rounded-md focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-black text-slate-700 border-b pb-2 uppercase tracking-tight">
          Articles à commander
        </h3>

        {orderData.items.map((item, index) => (
          <div
            key={index}
            className="flex flex-wrap md:flex-nowrap gap-3 items-end bg-slate-50 p-4 rounded-lg border border-slate-100 transition-all hover:border-slate-300"
          >
            <div className="flex-1 min-w-[200px]">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                Désignation article
              </label>

              <select
                required
                className="w-full border border-slate-200 p-2 rounded bg-white outline-none focus:ring-1 focus:ring-blue-400"
                value={item.stock_item_id}
                onChange={(e) =>
                  handleItemChange(index, 'stock_item_id', e.target.value)
                }
              >
                <option value="">Choisir un article...</option>

                {stockItems.map((stockItem) => (
                  <option key={stockItem.id} value={stockItem.id}>
                    {stockItem.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-24">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                Quantité
              </label>

              <input
                type="number"
                min={1}
                className="w-full border border-slate-200 p-2 rounded bg-white outline-none focus:ring-1 focus:ring-blue-400"
                value={item.quantity}
                onChange={(e) =>
                  handleItemChange(index, 'quantity', e.target.value)
                }
              />
            </div>

            <div className="w-32">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                Prix Unit. Achat
              </label>

              <input
                type="number"
                min={0}
                step="0.01"
                className="w-full border border-slate-200 p-2 rounded bg-white outline-none focus:ring-1 focus:ring-blue-400 font-medium text-blue-700"
                value={item.unit_cost}
                onChange={(e) =>
                  handleItemChange(index, 'unit_cost', e.target.value)
                }
              />
            </div>

            <button
              type="button"
              onClick={() => handleRemoveItem(index)}
              disabled={orderData.items.length === 1}
              className="p-2 text-red-500 hover:bg-red-100 rounded-full disabled:opacity-30 transition-colors mb-0.5"
              title="Supprimer la ligne"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center pt-6 border-t border-slate-100">
        <button
          type="button"
          onClick={handleAddItem}
          className="text-blue-600 text-sm font-bold hover:text-blue-800 transition-colors flex items-center gap-1"
        >
          <span className="text-lg">+</span> Ajouter une ligne
        </button>

        <button
          type="submit"
          disabled={loading}
          className="bg-slate-900 text-white px-8 py-3 rounded-md font-bold hover:bg-slate-800 disabled:opacity-50 transition-all shadow-md active:scale-95"
        >
          {loading ? 'Envoi...' : 'Générer le Bon de Commande'}
        </button>
      </div>
    </form>
  );
};