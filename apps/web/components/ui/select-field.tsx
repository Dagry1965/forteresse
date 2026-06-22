import React from "react";

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: { value: string; label: string }[];
}

export const SelectField = React.forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, error, helperText, className = "", options, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1 w-full">
        {label && (
          <label className="text-xs font-semibold text-[oklch(0.45_0_0)] tracking-wide uppercase">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={\w-full rounded-2xl border px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all \ \\}
          {...props}
        >
          {options.map((opt, index) => (
            <option key={index} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <span className="text-xs text-red-600">{error}</span>}
        {helperText && !error && (
          <span className="text-xs text-[oklch(0.5_0_0)]">{helperText}</span>
        )}
      </div>
    );
  }
);

SelectField.displayName = "SelectField";
