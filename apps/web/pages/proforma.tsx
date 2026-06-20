import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { apiFetch } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";

export default function ProformaPage() {
  const { token, logout } = useAuth();
  const router = useRouter();
  const { interventionId } = router.query;

  const [catalog, setCatalog] = useState<any[]>([]);
  const [selectedLines, setSelectedLines] = useState<any[]>([]);
  const [proforma, setProforma] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!router.isReady) return;

    console.log("--- Diagnostic de chargement ---");
    console.log("ID Intervention:", interventionId);

    try {
      console.log("Appel API Catalogue...");
      const resCat = await apiFetch("/inventory/products");

      if (resCat.ok) {
        const dataCat = await resCat.json();
        console.log("Produits reçus:", dataCat.length);
        setCatalog(Array.isArray(dataCat) ? dataCat : []);
      } else {
        console.error("Erreur API Catalogue, Status:", resCat.status);
        if (resCat.status === 403) {
          console.error("Accès refusé : Votre rôle n'est pas suffisant.");
        }
      }

      if (interventionId) {
        console.log("Vérification d'un devis existant...");
        const resProf = await apiFetch("/finance/proformas");

        if (resProf.status === 401) {
          logout();
          return;
        }

        const allProformas = await resProf.json();
        if (Array.isArray(allProformas)) {
          const existing = allProformas.find(
            (p: any) => p.intervention_id === interventionId,
          );
          if (existing) {
            console.log("Devis trouvé ID:", existing.id);
            setProforma(existing);
            if (existing.lines && existing.lines.length > 0) {
              setSelectedLines(existing.lines);
            }
          }
        }
      }
    } catch (err) {
      console.error("Erreur critique loadData:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        console.log("Sécurité : Fin du chargement forcée");
        setLoading(false);
      }
    }, 4000);
    return () => clearTimeout(timer);
  }, [loading]);

  useEffect(() => {
    if (token && router.isReady) {
      loadData();
    }
  }, [token, router.isReady, interventionId]);

  const addLine = (product: any) => {
    const existing = selectedLines.find(
      (l: any) => l.product_id === product.id,
    );
    if (existing) {
      setSelectedLines(
        selectedLines.map((l: any) =>
          l.product_id === product.id
            ? { ...l, quantity: Number(l.quantity) + 1 }
            : l,
        ),
      );
    } else {
      setSelectedLines([
        ...selectedLines,
        {
          product_id: product.id,
          description: product.name,
          quantity: 1,
          unit_price: product.selling_price,
        },
      ]);
    }
  };

  const handleSaveProforma = async () => {
    if (!interventionId) {
      alert("ID Intervention manquant dans l'URL");
      return;
    }

    try {
      const res = await apiFetch("/finance/proforma", {
        method: "POST",
        body: JSON.stringify({ interventionId, lines: selectedLines }),
      });
      const data = await res.json();
      if (res.ok) {
        setProforma(data);
        alert("✅ Devis enregistré !");
      } else {
        alert("Erreur: " + (data.message || "Interdit"));
      }
    } catch (err) {
      alert("Erreur lors de l'enregistrement");
    }
  };

  const handleApproveAndBill = async () => {
    if (!proforma?.id) {
      alert("Veuillez d'abord enregistrer le devis");
      return;
    }

    try {
      const res = await apiFetch(
        `/finance/proforma/${proforma.id}/approve`,
        { method: "PATCH" },
      );
      if (res.ok) {
        alert("🚀 Facture générée ! Redirection vers la caisse...");
        router.push("/cashier");
      } else {
        const data = await res.json();
        alert("Erreur : " + data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!token) {
    return (
      <div className="p-12 text-slate-700">
        🔒 Veuillez vous connecter...
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-12 text-slate-700">
        ⏳ Chargement des données (ID: {interventionId || "Recherche..."})
      </div>
    );
  }

  const total = selectedLines.reduce(
    (acc, l) => acc + l.quantity * l.unit_price,
    0,
  );

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto font-sans">
      <h1 className="text-3xl font-bold text-slate-900 mb-6">
        🧾 Devis & Facturation
      </h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* CATALOGUE */}
        <section className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-3">
            📦 Catalogue Pièces
          </h3>
          {catalog.length === 0 ? (
            <p className="text-sm text-amber-600">
              Aucun produit trouvé dans le catalogue. Vérifiez vos droits
              admin ou ajoutez des produits dans /inventory.
            </p>
          ) : (
            <div className="space-y-2 max-h-[480px] overflow-y-auto">
              {catalog.map((p: any) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <span className="text-slate-800">
                    <strong>{p.name}</strong> – {p.selling_price} €
                  </span>
                  <button
                    onClick={() => addLine(p)}
                    className="inline-flex items-center rounded-md bg-sky-600 px-3 py-1 text-xs font-semibold text-white hover:bg-sky-700"
                  >
                    ➕
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* LIGNES DE DEVIS */}
        <section className="rounded-xl border border-slate-200 bg-white px-4 py-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-3">
            📝 Lignes du devis
          </h3>
          {selectedLines.length === 0 ? (
            <p className="text-slate-500 text-sm">Le devis est vide.</p>
          ) : (
            <div className="space-y-2 max-h-[420px] overflow-y-auto text-sm">
              {selectedLines.map((l, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between border-b last:border-none border-slate-100 pb-1"
                >
                  <span className="text-slate-800">
                    {l.description} x {l.quantity}
                  </span>
                  <strong className="text-slate-900">
                    {(l.quantity * l.unit_price).toFixed(2)} €
                  </strong>
                </div>
              ))}
            </div>
          )}

          <hr className="my-4 border-slate-200" />

          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-700">Total</span>
            <span className="text-lg font-bold text-slate-900">
              {total.toFixed(2)} €
            </span>
          </div>

          <div className="mt-4 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={handleSaveProforma}
              className="px-4"
            >
              💾 ENREGISTRER
            </Button>
            {proforma && (
              <Button
                variant="primary"
                onClick={handleApproveAndBill}
                className="bg-emerald-600 hover:bg-emerald-700 border-none px-4"
              >
                ✅ FACTURER
              </Button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
