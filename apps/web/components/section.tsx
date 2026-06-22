export default function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-bold tracking-tight text-[oklch(0.22_0_0)] lowercase">
        {title}
      </h2>
      <div className="rounded-[2rem] border border-[oklch(0.92_0_0)] bg-white p-6 md:p-8 shadow-sm">
        {children}
      </div>
    </div>
  );
}




