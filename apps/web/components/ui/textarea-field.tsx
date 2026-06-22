import React from "react";

interface TextareaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const TextareaField = React.forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  ({ label, error, helperText, className = "", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1 w-full">
        {label && (
          <label className="text-xs font-semibold text-[oklch(0.45_0_0)] tracking-wide uppercase">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={\w-full rounded-2xl border px-4 py-3 text-sm bg-white placeholder:text-[oklch(0.6_0_0)] focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all \ \\}
          {...props}
        />
        {error && <span className="text-xs text-red-600">{error}</span>}
        {helperText && !error && (
          <span className="text-xs text-[oklch(0.5_0_0)]">{helperText}</span>
        )}
      </div>
    );
  }
);

TextareaField.displayName = "TextareaField";
