export default function KpiCard({ label, value, icon }: { label: string; value: React.ReactNode; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 rounded-[2rem] border border-[oklch(0.92_0_0)] bg-white p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between text-[oklch(0.45_0_0)]">
        <span className="text-sm font-medium tracking-wide lowercase">{label}</span>
        <div className="w-5 h-5">{icon}</div>
      </div>
      <div className="text-3xl font-bold tracking-tight text-[oklch(0.22_0_0)]">
        {value}
      </div>
    </div>
  );
}




