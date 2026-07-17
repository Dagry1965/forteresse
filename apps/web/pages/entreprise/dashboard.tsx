import { useEffect, useState } from "react";
import { API } from "../../lib/api";
import { CONFIG } from "../../lib/config";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
} from "chart.js";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement);

export default function DashboardEntreprise() {
  const [data, setData] = useState<any>(null);
  const companyId = typeof window !== "undefined" ? localStorage.getItem("companyId") : null;

  async function load() {
    if (!companyId) return;

    const res = await API.get(
      `${CONFIG.API_BASE}/api/enterprise/${companyId}/dashboard`
    );

    setData(res);
  }

  useEffect(() => {
    load();
  }, []);

  if (!data) return <p className="p-10">Chargement...</p>;

  const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Août", "Sep", "Oct", "Nov", "Déc"];

  return (
    <div className="p-10 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Dashboard Entreprise</h1>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-10">
        <KPI label="CA total" value={`${data.kpis.totalRevenue} CHF`} />
        <KPI label="Interventions" value={data.kpis.totalInterventions} />
        <KPI label="Flotte" value={data.kpis.fleetSize} />
        <KPI
          label="CA moyen / intervention"
          value={`${data.kpis.avgRevenuePerIntervention.toFixed(2)} CHF`}
        />
      </div>

      {/* Graphique CA mensuel */}
      <div className="bg-white p-6 rounded shadow mb-10">
        <h2 className="text-xl font-semibold mb-4">CA mensuel</h2>
        <Line
          data={{
            labels: months,
            datasets: [
              {
                label: "CA (CHF)",
                data: data.charts.monthlyRevenue,
                borderColor: "#2563eb",
                backgroundColor: "rgba(37, 99, 235, 0.2)",
              },
            ],
          }}
        />
      </div>

      {/* Graphique interventions */}
      <div className="bg-white p-6 rounded shadow mb-10">
        <h2 className="text-xl font-semibold mb-4">Interventions mensuelles</h2>
        <Line
          data={{
            labels: months,
            datasets: [
              {
                label: "Interventions",
                data: data.charts.monthlyInterventions,
                borderColor: "#16a34a",
                backgroundColor: "rgba(22, 163, 74, 0.2)",
              },
            ],
          }}
        />
      </div>

      {/* Flotte */}
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Flotte</h2>

        <ul className="space-y-2">
          {data.vehicles.map((v: any) => (
            <li key={v.id} className="border p-3 rounded">
              {v.make} {v.model} — {v.plateNumber}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function KPI({ label, value }: any) {
  return (
    <div className="bg-white p-4 rounded shadow text-center">
      <p className="text-gray-500">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
