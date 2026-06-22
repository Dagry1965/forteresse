import React from "react";
interface AlertProps { type?: "success" | "error"; title?: string; children: React.ReactNode; }
export const Alert = ({ type = "success", title, children }: AlertProps) => {
  const colors = type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-700";
  return (
    <div className={`flex flex-col gap-1 rounded-2xl border p-6 ${colors}`}>
      {title && <div className="font-bold lowercase text-sm tracking-tight">{title}</div>}
      <div className="text-xs opacity-90">{children}</div>
    </div>
  );
};
