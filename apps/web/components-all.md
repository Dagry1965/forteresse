# 📦 Tous les Composants du Projet

**Dossier source :** C:\Users\Admin\forteresse\apps\web\components
**Date :** 01.07.2026 18:27

---


## 📁 components

### components\DescriptionField.tsx

```tsx
export default function DescriptionField({ value, onChange }) {
  return (
    <textarea
      className="border p-2 rounded w-full mb-4"
      rows={4}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="DÃ©crivez le problÃ¨me..."
    />
  );
}
```

---

### components\kpi-card.tsx

```tsx
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




```

---

### components\Layout.tsx

```tsx
import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";

// IcÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´nes pro (Lucide)
import {
  LayoutDashboard,
  Users,
  Car,
  Calendar,
  Wrench,
  Package,
  ShoppingCart,
  CreditCard,
} from "lucide-react";

const menu_items = [
  { icon: <LayoutDashboard size={18} />, name: "dashboard", href: "/dashboard" },
  { icon: <Users size={18} />, name: "clients", href: "/clients" },
  { icon: <Car size={18} />, name: "vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©hicules", href: "/vehicles" },
  { icon: <Calendar size={18} />, name: "rendez-vous", href: "/appointments" },
  { icon: <Wrench size={18} />, name: "atelier", href: "/workshop" },
  { icon: <Package size={18} />, name: "stock & catalogue", href: "/inventory" },
  { icon: <ShoppingCart size={18} />, name: "achats (po)", href: "/purchase-orders" },
  { icon: <CreditCard size={18} />, name: "caisse", href: "/cashier" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { logout, user } = useAuth();

  // Pas de sidebar sur la page login
  if (router.pathname === "/login") return <>{children}</>;

  return (
    <div className="flex min-h-screen bg-background text-foreground">

      {/* SIDEBAR */}
      <aside className="w-64 bg-[oklch(0.22_0_0)] text-white border-r border-[oklch(0.35_0_0)] flex flex-col sticky top-0 h-screen z-50 shadow-xl">

        {/* LOGO */}
        <div className="p-6 text-xl font-bold border-b border-[oklch(0.35_0_0)] tracking-wide">
          forteresse <span className="text-[oklch(0.65_0.15_260)]">erp</span>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 py-5 overflow-auto flex flex-col gap-1">
          {menu_items.map((item) => {
            const isActive = router.pathname === item.href;

            return (
              <Link key={item.href} href={item.href} className="no-underline">
                <div
                  className={`
                    px-6 py-3 flex items-center gap-3 transition-all cursor-pointer border-l-4 rounded-md
                    ${
                      isActive
                        ? "bg-[oklch(0.28_0_0)] text-white border-[oklch(0.65_0.15_260)] shadow-sm"
                        : "border-transparent text-[oklch(0.85_0_0)] hover:bg-[oklch(0.28_0_0)] hover:text-white"
                    }
                  `}
                >
                  {item.icon}
                  <span className="capitalize">{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* FOOTER */}
        <div className="p-5 border-t border-[oklch(0.35_0_0)] bg-[oklch(0.22_0_0)]">
          <div className="text-sm mb-3 text-[oklch(0.85_0_0)]">
            {user?.email?.toLowerCase() || "admin"}
          </div>

          <button
            onClick={logout}
            className="w-full py-2 bg-destructive text-destructive-foreground rounded-md font-bold hover:opacity-90"
          >
            dÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©connexion
          </button>
        </div>
      </aside>

      {/* CONTENU */}
      <main className="flex-1 px-6 md:px-10 py-10 bg-background text-foreground">
        <div className="max-w-7xl mx-auto w-full flex flex-col gap-12">
          {children}
        </div>
      </main>
    </div>
  );
}
```

---


## 📁 components\rendezvous

### components\rendezvous\TimeSlotPicker.tsx

```tsx
import { useEffect, useState } from "react";
import { fetchTimeSlots } from "../../lib/api";
import { CONFIG } from "../../lib/config";

export default function TimeSlotPicker({ date, companyId, onSelect }) {
  const [slots, setSlots] = useState([]);

  useEffect(() => {
    async function load() {
      if (!date) return;

      const data = await fetchTimeSlots({
        workspaceId: CONFIG.WORKSPACE_ID,
        date,
        companyId,
      });

      setSlots(data || []);
    }

    load();
  }, [date]);

  return (
    <select className="border p-2 rounded w-full mb-4" onChange={(e) => onSelect(e.target.value)}>
      <option value="">SÃ©lectionner une plage</option>
      {slots.map((s: any) => (
        <option key={s.id} value={s.id}>
          {new Date(s.startTime).toLocaleTimeString()} â†’ {new Date(s.endTime).toLocaleTimeString()}
        </option>
      ))}
    </select>
  );
}
```

---


## 📁 components

### components\section.tsx

```tsx
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




```

---

### components\sidebar.tsx

```tsx
"use client";

import {
  LayoutDashboard,
  Users,
  Car,
  Calendar,
  Wrench,
  Package,
  ShoppingCart,
  CreditCard,
  LogOut,
} from "lucide-react";

import SidebarItem from "./sidebaritem";
import { useAuth } from "@/context/AuthContext";

export default function Sidebar() {
  const { logout, user } = useAuth();

  return (
    <aside className="w-64 h-screen bg-[oklch(0.22_0_0)] text-white flex flex-col border-r border-[oklch(0.35_0_0)]">
      
      {/* HEADER */}
      <div className="px-6 py-6 border-b border-[oklch(0.35_0_0)]">
        <h1 className="text-xl font-bold tracking-wide">
          forteresse <span className="text-[oklch(0.65_0.15_260)]">erp</span>
        </h1>

        <p className="mt-2 text-sm text-[oklch(0.85_0_0)]">
          {user?.email?.toLowerCase() || "admin"}
        </p>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        <SidebarItem icon={<LayoutDashboard />} label="dashboard" href="/dashboard" />
        <SidebarItem icon={<Users />} label="clients" href="/clients" />
        <SidebarItem icon={<Car />} label="vÃ©hicules" href="/vehicules" />
        <SidebarItem icon={<Calendar />} label="rendez-vous" href="/rendezvous" />
        <SidebarItem icon={<Wrench />} label="atelier" href="/atelier" />
        <SidebarItem icon={<Package />} label="stock & catalogue" href="/stock" />
        <SidebarItem icon={<ShoppingCart />} label="achats (po)" href="/achats" />
        <SidebarItem icon={<CreditCard />} label="caisse" href="/caisse" />
      </nav>

      {/* FOOTER â€” DÃ‰CONNEXION */}
      <div className="px-3 py-4 border-t border-[oklch(0.35_0_0)]">
        <button
          onClick={() => {
            logout();
            window.location.href = "/login";
          }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-md bg-red-600 text-white font-semibold hover:bg-red-700 transition"
        >
          <LogOut size={18} />
          DÃ©connexion
        </button>
      </div>
    </aside>
  );
}
```

---

### components\sidebaritem.tsx

```tsx
import Link from "next/link";
import { useRouter } from "next/router";
import { cn } from "../lib/utils";

interface sidebaritemprops {
  icon: React.ReactNode;
  label: string;
  href: string;
}

export default function sidebaritem({ icon, label, href }: sidebaritemprops) {
  const router = useRouter();
  const active = router.pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-4 py-2 rounded-md transition-colors",
        active
          ? "bg-[oklch(0.28_0_0)] text-white border-l-4 border-[oklch(0.65_0.15_260)]"
          : "text-[oklch(0.85_0_0)] hover:bg-[oklch(0.28_0_0)] hover:text-white"
      )}
    >
      <span className="text-xl">{icon}</span>
      <span className="font-medium">{label}</span>
    </Link>
  );
}
```

---

### components\SystemHealth.tsx

```tsx
'use client';

import React, { useEffect, useState } from 'react';
import { API } from '@/lib/api';

interface HealthStatus {
  endpoint: string;
  status: 'loading' | 'ok' | 'error';
  message?: string;
  responseTime?: number;
}

const endpointsToCheck = [
  { name: 'Clients', url: 'http://localhost:4000/api/clients' },
  { name: 'Appointments Pending', url: 'http://localhost:4000/api/appointments/pending' },
  { name: 'Interventions', url: 'http://localhost:4000/api/interventions' },
  { name: 'Unpaid Invoices', url: 'http://localhost:4000/api/invoices/unpaid' },
];

export default function SystemHealth() {
  const [statuses, setStatuses] = useState<HealthStatus[]>(
    endpointsToCheck.map(ep => ({
      endpoint: ep.name,
      status: 'loading',
    }))
  );

  const checkEndpoint = async (name: string, url: string, index: number) => {
    const startTime = Date.now();

    try {
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'x-workspace-id': localStorage.getItem('current_workspace_id') || '',
        },
      });

      const responseTime = Date.now() - startTime;

      setStatuses(prev => {
        const newStatuses = [...prev];
        newStatuses[index] = {
          endpoint: name,
          status: res.ok ? 'ok' : 'error',
          message: res.ok ? 'OK' : `Erreur ${res.status}`,
          responseTime,
        };
        return newStatuses;
      });
    } catch (error) {
      setStatuses(prev => {
        const newStatuses = [...prev];
        newStatuses[index] = {
          endpoint: name,
          status: 'error',
          message: 'Impossible de joindre le serveur',
        };
        return newStatuses;
      });
    }
  };

  useEffect(() => {
    endpointsToCheck.forEach((ep, index) => {
      checkEndpoint(ep.name, ep.url, index);
    });
  }, []);

  return (
    <div className="bg-white rounded-3xl border p-6">
      <h3 className="text-lg font-bold mb-4">Ã‰tat de santÃ© du systÃ¨me</h3>
      
      <div className="space-y-3">
        {statuses.map((item, index) => (
          <div key={index} className="flex items-center justify-between border rounded-2xl px-4 py-3">
            <div className="font-medium">{item.endpoint}</div>
            
            <div className="flex items-center gap-3">
              {item.status === 'loading' && (
                <span className="text-yellow-600">VÃ©rification...</span>
              )}
              
              {item.status === 'ok' && (
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                  OK {item.responseTime && `(${item.responseTime}ms)`}
                </span>
              )}
              
              {item.status === 'error' && (
                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                  {item.message}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <button 
        onClick={() => window.location.reload()} 
        className="mt-4 text-sm text-blue-600 hover:underline"
      >
        RafraÃ®chir les statuts
      </button>
    </div>
  );
}
```

---


## 📁 components\ui

### components\ui\alert.tsx

```tsx
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
```

---

### components\ui\badge.tsx

```tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        destructive: "bg-destructive/10 text-destructive",
        outline: "border-border text-foreground",
        ghost: "hover:bg-muted hover:text-muted-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // NOUVELLES VARIANTES B2B
        company: "bg-amber-100 text-amber-700 border-amber-200",
        individual: "bg-sky-100 text-sky-700 border-sky-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.ComponentProps<"span">,
    VariantProps<typeof badgeVariants> {
  asChild?: boolean
}

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: BadgeProps) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }



```

---

### components\ui\button.tsx

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

### components\ui\card.tsx

```tsx
import * as React from "react"

import { cn } from "@/lib/utils"

function Card({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"div"> & { size?: "default" | "sm" }) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        "group/card flex flex-col gap-(--card-spacing) overflow-hidden rounded-xl bg-card py-(--card-spacing) text-sm text-card-foreground ring-1 ring-foreground/10 [--card-spacing:--spacing(4)] has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(3)] data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-t-xl px-(--card-spacing) has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-(--card-spacing)",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "font-heading text-base leading-snug font-medium group-data-[size=sm]/card:text-sm",
        className
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-(--card-spacing)", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center rounded-b-xl border-t bg-muted/50 p-(--card-spacing)",
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
```

---

### components\ui\data-table.tsx

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

### components\ui\date-field.tsx

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

### components\ui\empty-state.tsx

```tsx
import React from "react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="mb-4 text-[oklch(0.6_0_0)]">{icon}</div>}
      <h3 className="text-lg font-bold text-[oklch(0.22_0_0)] mb-2">{title}</h3>
      {description && <p className="text-[oklch(0.45_0_0)] max-w-sm">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
};
```

---

### components\ui\input.tsx

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

### components\ui\kpi.tsx

```tsx
import React from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface KPIProps {
  label: string
  icon?: React.ReactNode
  value: React.ReactNode
  className?: string
}

export function KPI({ label, icon, value, className }: KPIProps) {
  return (
    <Card
      className={cn(
        "rounded-2xl border border-border bg-card text-card-foreground shadow-sm transition hover:shadow-md",
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>

        {icon && (
          <div className="text-xl opacity-70 flex items-center justify-center">
            {icon}
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div className="text-3xl font-bold text-foreground leading-tight">
          {value}
        </div>
      </CardContent>
    </Card>
  )
}
```

---

### components\ui\modal.tsx

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

### components\ui\responsive-grid.tsx

```tsx
import React from "react";

interface ResponsiveGridProps {
  children: React.ReactNode;
  cols?: number;
  gap?: number;
  className?: string;
}

export const ResponsiveGrid = ({
  children,
  cols = 4,
  gap = 6,
  className = "",
}: ResponsiveGridProps) => {
  const gridClasses = \grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-\ gap-\ \\;

  return <div className={gridClasses}>{children}</div>;
};
```

---

### components\ui\scroll-area.tsx

```tsx
"use client"

import * as React from "react"
import { ScrollArea as ScrollAreaPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function ScrollArea({
  className,
  children,
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.Root>) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className={cn("relative", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        className="size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1"
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
}

function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>) {
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      data-slot="scroll-area-scrollbar"
      data-orientation={orientation}
      orientation={orientation}
      className={cn(
        "flex touch-none p-px transition-colors select-none data-horizontal:h-2.5 data-horizontal:flex-col data-horizontal:border-t data-horizontal:border-t-transparent data-vertical:h-full data-vertical:w-2.5 data-vertical:border-l data-vertical:border-l-transparent",
        className
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb
        data-slot="scroll-area-thumb"
        className="relative flex-1 rounded-full bg-border"
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  )
}

export { ScrollArea, ScrollBar }
```

---

### components\ui\select-field.tsx

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

### components\ui\separator.tsx

```tsx
"use client"

import * as React from "react"
import { Separator as SeparatorPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border data-horizontal:h-px data-horizontal:w-full data-vertical:w-px data-vertical:self-stretch",
        className
      )}
      {...props}
    />
  )
}

export { Separator }
```

---

### components\ui\StatusBadge.tsx

```tsx
import React from 'react';

type StatusType = 'draft' | 'confirmed' | 'received' | 'paid' | 'unpaid' | 'partially_paid' | 'in_progress' | 'completed';

const STATUS_MAP: Record<StatusType, { label: string, bg: string, color: string }> = {
  draft: { label: 'Brouillon', bg: '#f1f5f9', color: '#475569' },
  confirmed: { label: 'ConfirmÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©', bg: '#ecfdf5', color: '#059669' },
  received: { label: 'RÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©ceptionnÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©', bg: '#dcfce7', color: '#166534' },
  partially_paid: { label: 'Partiel', bg: '#fef3c7', color: '#d97706' },
  paid: { label: 'PayÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©', bg: '#dcfce7', color: '#166534' },
  unpaid: { label: 'ImpayÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©', bg: '#fee2e2', color: '#dc2626' },
  in_progress: { label: 'En cours', bg: '#eff6ff', color: '#2563eb' },
  completed: { label: 'TerminÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©', bg: '#f5f3ff', color: '#7c3aed' },
};

export const StatusBadge = ({ status }: { status: string }) => {
  const config = STATUS_MAP[status as StatusType] || { label: status, bg: '#eee', color: '#333' };

  return (
    <span style={{
      backgroundColor: config.bg,
      color: config.color,
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: 'bold',
      textTransform: 'uppercase',
      display: 'inline-block'
    }}>
      {config.label}
    </span>
  );
};
```

---

### components\ui\table.tsx

```tsx
"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b", className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b transition-colors hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted",
        className
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
```

---

### components\ui\tabs.tsx

```tsx
import React, { useState } from "react";

interface Tab {
  label: string;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultIndex?: number;
}

export const Tabs = ({ tabs, defaultIndex = 0 }: TabsProps) => {
  const [activeIndex, setActiveIndex] = useState(defaultIndex);

  return (
    <div>
      <div className="flex border-b border-[oklch(0.92_0_0)] mb-6">
        {tabs.map((tab, index) => (
          <button
            key={index}
            onClick={() => setActiveIndex(index)}
            className={\px-6 py-3 text-sm font-semibold transition-all \\}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div>{tabs[activeIndex]?.content}</div>
    </div>
  );
};
```

---

### components\ui\textarea-field.tsx

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

### components\ui\text-field.tsx

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


## 📁 components

### components\VehicleSelector.tsx

```tsx
import { useEffect, useState } from "react";
import { fetchVehicles, fetchEnterpriseVehicles } from "../../lib/api";
import { CONFIG } from "../../lib/config";

export default function VehicleSelector({ companyId, onSelect }) {
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    async function load() {
      const data = companyId
        ? await fetchEnterpriseVehicles(companyId)
        : await fetchVehicles(CONFIG.WORKSPACE_ID);

      setVehicles(data || []);
    }

    load();
  }, []);

  return (
    <select className="border p-2 rounded w-full mb-4" onChange={(e) => onSelect(e.target.value)}>
      <option value="">SÃ©lectionner un vÃ©hicule</option>
      {vehicles.map((v: any) => (
        <option key={v.id} value={v.id}>
          {v.make} {v.model} ({v.plateNumber})
        </option>
      ))}
    </select>
  );
}
```

---

