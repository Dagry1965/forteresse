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

import sidebaritem from "./sidebaritem";

export default function sidebar() {
  return (
    <aside className="w-64 h-screen bg-[oklch(0.22_0_0)] text-white flex flex-col border-r border-[oklch(0.35_0_0)]">
      
      {/* header */}
      <div className="px-6 py-6 border-b border-[oklch(0.35_0_0)]">
        <h1 className="text-xl font-bold tracking-wide">
          forteresse <span className="text-[oklch(0.65_0.15_260)]">erp</span>
        </h1>
      </div>

      {/* navigation */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        <sidebaritem icon={<LayoutDashboard />} label="dashboard" href="/dashboard" />
        <sidebaritem icon={<Users />} label="clients" href="/clients" />
        <sidebaritem icon={<Car />} label="vÃƒÆ’Ã‚Â©hicules" href="/vehicules" />
        <sidebaritem icon={<Calendar />} label="rendez-vous" href="/rendezvous" />
        <sidebaritem icon={<Wrench />} label="atelier" href="/atelier" />
        <sidebaritem icon={<Package />} label="stock & catalogue" href="/stock" />
        <sidebaritem icon={<ShoppingCart />} label="achats (po)" href="/achats" />
        <sidebaritem icon={<CreditCard />} label="caisse" href="/caisse" />
      </nav>

      {/* footer */}
      <div className="px-3 py-4 border-t border-[oklch(0.35_0_0)]">
        <sidebaritem icon={<LogOut />} label="dÃƒÆ’Ã‚Â©connexion" href="/logout" />
      </div>
    </aside>
  );
}
