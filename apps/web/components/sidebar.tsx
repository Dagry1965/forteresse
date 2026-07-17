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
        <SidebarItem icon={<Car />} label="véhicules" href="/vehicules" />
        <SidebarItem icon={<Calendar />} label="rendez-vous" href="/rendezvous" />
        <SidebarItem icon={<Wrench />} label="atelier" href="/atelier" />
        <SidebarItem icon={<Package />} label="stock & catalogue" href="/stock" />
        <SidebarItem icon={<ShoppingCart />} label="achats (po)" href="/achats" />
        <SidebarItem icon={<CreditCard />} label="caisse" href="/caisse" />
      </nav>

      {/* FOOTER — DÉCONNEXION */}
      <div className="px-3 py-4 border-t border-[oklch(0.35_0_0)]">
        <button
          onClick={() => {
            logout();
            window.location.href = "/login";
          }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-md bg-red-600 text-white font-semibold hover:bg-red-700 transition"
        >
          <LogOut size={18} />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
