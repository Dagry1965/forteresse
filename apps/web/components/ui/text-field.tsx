import React from "react";
interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> { label?: string; error?: string; }
export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1 w-full text-[oklch(0.22_0_0)]">
        {label && <label className="text-[10px] font-bold uppercase tracking-widest text-[oklch(0.45_0_0)] ml-1">{label}</label>}
        <input ref={ref} className={`w-full rounded-2xl border px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all ${error ? "border-red-500" : "border-[oklch(0.92_0_0)]"} ${className}`} {...props} />
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    );
});
TextField.displayName = "TextField";
