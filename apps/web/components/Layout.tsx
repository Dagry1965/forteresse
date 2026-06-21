import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';

const MENU_ITEMS = [
  { name: '📊 Dashboard', href: '/dashboard' },
  { name: '👥 Clients', href: '/clients' },
  { name: '🚗 Véhicules', href: '/vehicles' },
  { name: '📅 Rendez-vous', href: '/appointments' },
  { name: '🛠️ Atelier', href: '/workshop' },
  { name: '📦 Stock & Catalogue', href: '/inventory' },
  { name: '🛒 Achats (PO)', href: '/purchase-orders' },
  { name: '💸 Caisse', href: '/cashier' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { logout, user } = useAuth();

  if (router.pathname === '/login') return <>{children}</>;

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      
      {/* SIDEBAR SHADCN */}
      <aside className="w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col sticky top-0 h-screen z-50">
        
        <div className="p-6 text-xl font-bold border-b border-sidebar-border">
          🏰 Forteresse <span className="text-primary">ERP</span>
        </div>

        <nav className="flex-1 py-5 overflow-auto">
          {MENU_ITEMS.map((item) => {
            const isActive = router.pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className="no-underline">
                <div
                  className={`px-6 py-3 flex items-center gap-3 transition-colors cursor-pointer border-l-4
                    ${
                      isActive
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground border-primary'
                        : 'border-transparent hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    }`}
                >
                  {item.name}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-5 border-t border-sidebar-border bg-sidebar">
          <div className="text-sm mb-3">👤 {user?.email || 'Admin'}</div>
          <button
            onClick={logout}
            className="w-full py-2 bg-destructive text-destructive-foreground rounded-md font-bold hover:opacity-90"
          >
            Déconnexion
          </button>
        </div>
      </aside>

      {/* CONTENU PRINCIPAL */}
      <main className="flex-1 p-10 bg-background text-foreground">
        {children}
      </main>
    </div>
  );
}
