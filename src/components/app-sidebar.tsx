import { Link, useLocation } from "@tanstack/react-router";
import {
  Radio,
  KeyRound,
  ShieldCheck,
  Wrench,
  Hotel,
  ShoppingCart,
  Car,
  Lock,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Painel", icon: LayoutDashboard },
  { to: "/radios", label: "Rádios", icon: Radio },
  { to: "/chaves", label: "Chaves", icon: KeyRound },
  { to: "/ccr", label: "CCR", icon: ShieldCheck },
  { to: "/mestras-manutencao", label: "Mestras • Manut.", icon: Wrench },
  { to: "/mestras-recepcao", label: "Mestras • Recep.", icon: Hotel },
  { to: "/pcp", label: "PCP", icon: ShoppingCart },
  { to: "/veiculos", label: "Veículos", icon: Car },
  { to: "/armarios", label: "Armários", icon: Lock },
  { to: "/seguranca-operacional", label: "Seg. Operacional", icon: ShieldCheck },
] as const;

export function AppSidebar() {
  const location = useLocation();
  const { session, logout } = useAuth();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="px-6 py-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-secondary to-accent flex items-center justify-center shadow-lg">
            <span className="font-display font-bold text-sidebar-primary-foreground">W</span>
          </div>
          <div className="leading-tight">
            <p className="font-display font-bold text-sm">Wellness</p>
            <p className="text-xs text-sidebar-foreground/70">Control Hub</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to || (to !== "/" && location.pathname.startsWith(to));
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-sidebar-border space-y-2">
        <div className="px-3 text-xs text-sidebar-foreground/60">
          Conectado como <span className="text-sidebar-foreground font-medium">{session?.user}</span>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </aside>
  );
}