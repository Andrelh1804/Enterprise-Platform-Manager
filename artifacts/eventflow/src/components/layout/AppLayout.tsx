import React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  CalendarDays, 
  Users, 
  Building2, 
  FileText, 
  BadgeDollarSign, 
  UserSquare2,
  Ticket
} from "lucide-react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navigation = [
    { name: "Painel", href: "/", icon: LayoutDashboard },
    { name: "Eventos", href: "/events", icon: CalendarDays },
    { name: "Patrocinadores", href: "/sponsors", icon: Building2 },
    { name: "Fornecedores", href: "/suppliers", icon: Users },
    { name: "Contratos", href: "/contracts", icon: FileText },
    { name: "Equipe", href: "/staff", icon: UserSquare2 },
    { name: "Financeiro", href: "/finance", icon: BadgeDollarSign },
    { name: "Inscrições", href: "/registrations", icon: Ticket },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar border-r border-sidebar-border hidden md:flex flex-col flex-shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl">
              E
            </div>
            <span className="text-sidebar-foreground font-bold text-lg tracking-tight">
              EventFlow
            </span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          {navigation.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium",
                  isActive 
                    ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
              >
                <item.icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-sidebar-foreground/50")} />
                {item.name}
              </Link>
            );
          })}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 border-b bg-card flex items-center justify-between px-6 flex-shrink-0 md:hidden">
          <div className="font-bold">EventFlow</div>
        </header>
        <div className="flex-1 overflow-y-auto bg-muted/30 p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
