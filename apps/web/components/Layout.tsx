import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";

// IcÃ´nes pro (Lucide)
import {
  LayoutDashboard,
  Users,
  Car,
  Calendar,
  Wrench,
  Package,
  ShoppingCart,
  CreditCard,
  Receipt,
  DatabaseBackup,
} from "lucide-react";

// Import Sonner
import { Toaster } from "sonner";

const menu_items = [
  { icon: <LayoutDashboard size={18} />, name: "dashboard", href: "/dashboard" },
  { icon: <Users size={18} />, name: "clients", href: "/clients" },
  { icon: <Users size={18} />, name: "utilisateurs", href: "/utilisateurs", adminOnly: true },
  { icon: <DatabaseBackup size={18} />, name: "sauvegardes", href: "/sauvegardes", adminOnly: true },
  { icon: <Car size={18} />, name: "vÃ©hicules", href: "/vehicles" },
  { icon: <Calendar size={18} />, name: "rendez-vous", href: "/appointments" },
  { icon: <Wrench size={18} />, name: "atelier", href: "/workshop" },
  { icon: <Package size={18} />, name: "stock & catalogue", href: "/inventory" },
  { icon: <ShoppingCart size={18} />, name: "achats (po)", href: "/purchase-orders" },
  { icon: <CreditCard size={18} />, name: "caisse", href: "/cashier" },
  { icon: <Receipt size={18} />, name: "facturation", href: "/billing" },   // â† Nouvel Ã©lÃ©ment
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
          {menu_items
            .filter((item) => !item.adminOnly || user?.role === "ADMIN")
            .map((item) => {
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
            DÃ©connexion
          </button>
        </div>
      </aside>

      {/* CONTENU */}
      <main className="flex-1 px-6 md:px-10 py-10 bg-background text-foreground">
        <div className="max-w-7xl mx-auto w-full flex flex-col gap-12">
          {children}
        </div>
      </main>

      {/* === TOASTER SONNER === */}
      <Toaster 
        position="top-center" 
        richColors 
        closeButton 
      />
    </div>
  );
}

