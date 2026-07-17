# 📋 Revue des Composants UI - Formulaires & Tableaux

**Date :** 02.07.2026 09:20
**Objectif :** Analyser si les composants doivent être améliorés

---

## 📄 text-field.tsx

```tsx
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
```

---

## 📄 select-field.tsx

```tsx
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
```

---

## 📄 textarea-field.tsx

```tsx
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
```

---

## 📄 date-field.tsx

```tsx
import React from "react";
interface DateFieldProps extends React.InputHTMLAttributes<HTMLInputElement> { label?: string; error?: string; }
export const DateField = React.forwardRef<HTMLInputElement, DateFieldProps>(({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1 w-full text-[oklch(0.22_0_0)]">
        {label && <label className="text-[10px] font-bold uppercase tracking-widest text-[oklch(0.45_0_0)] ml-1">{label}</label>}
        <input ref={ref} type="date" className={`w-full rounded-2xl border px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all ${error ? "border-red-500" : "border-[oklch(0.92_0_0)]"} ${className}`} {...props} />
      </div>
    );
});
DateField.displayName = "DateField";
```

---

## 📄 input.tsx

```tsx
import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
```

---

## 📄 data-table.tsx

```tsx
import React from "react";
interface Column<T> { key: string; header: string; render?: (row: T) => React.ReactNode; className?: string; }
interface DataTableProps<T> { columns: Column<T>[]; data: T[]; emptyMessage?: string; }
export function DataTable<T extends { id?: string | number }>({ columns, data, emptyMessage = "aucune donnÃ©e" }: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse text-[oklch(0.22_0_0)]">
        <thead><tr className="text-left border-b border-[oklch(0.92_0_0)]">
          {columns.map((col, i) => (<th key={i} className={`pb-4 font-bold text-[oklch(0.45_0_0)] lowercase ${col.className || ""}`}>{col.header}</th>))}
        </tr></thead>
        <tbody className="divide-y divide-[oklch(0.96_0_0)]">
          {data.length === 0 ? (<tr><td colSpan={columns.length} className="py-10 text-center text-[oklch(0.45_0_0)] lowercase">{emptyMessage}</td></tr>) : 
          (data.map((row, i) => (<tr key={i} className="hover:bg-[oklch(0.99_0_0)] transition-colors">
            {columns.map((col, j) => (<td key={j} className={`py-4 ${col.className || ""}`}>{col.render ? col.render(row) : (row as any)[col.key]}</td>))}
          </tr>)))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## 📄 modal.tsx

```tsx
import React from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 p-4 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg mx-4 overflow-hidden border border-[oklch(0.92_0_0)]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[oklch(0.96_0_0)]">
          <h3 className="text-lg font-bold text-[oklch(0.22_0_0)] lowercase">{title}</h3>
          <button
            onClick={onClose}
            className="text-[oklch(0.45_0_0)] hover:text-[oklch(0.22_0_0)] text-2xl leading-none transition-colors"
          >
            ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex justify-end gap-3 p-6 border-t border-[oklch(0.96_0_0)] bg-[oklch(0.98_0_0)]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};


```

---

## 📄 button.tsx

```tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center w-full md:w-auto w-full md:w-auto w-full md:w-auto w-full md:w-auto rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 w-full md:w-auto",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }




```

---

