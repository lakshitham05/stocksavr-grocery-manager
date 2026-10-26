import { Link } from "@tanstack/react-router";
import { LayoutDashboard, Package, ShoppingCart, Bell, BarChart3, HeartHandshake } from "lucide-react";
import type { ReactNode } from "react";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/products", label: "Products", icon: Package },
  { to: "/sale", label: "Record Sale", icon: ShoppingCart },
  { to: "/alerts", label: "Alerts", icon: Bell },
  { to: "/food-rescue", label: "Food Rescue", icon: HeartHandshake },
  { to: "/reports", label: "Reports", icon: BarChart3 },
] as const;

export function Layout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <header className="sticky top-0 z-20 border-b bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="text-xl font-bold tracking-tight">
            Stock<span className="text-accent">Savr</span>
          </Link>
          <nav className="hidden gap-1 md:flex">
            {nav.map((n) => (
              <Link key={n.to} to={n.to} activeOptions={{ exact: true }}
                className="rounded-md px-3 py-2 text-sm font-medium opacity-85 hover:opacity-100 data-[status=active]:bg-primary-foreground/15 data-[status=active]:opacity-100">
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="mb-5 text-2xl font-bold">{title}</h1>
        {children}
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-6 border-t bg-card md:hidden">
        {nav.map((n) => (
          <Link key={n.to} to={n.to} activeOptions={{ exact: true }}
            className="flex min-w-0 flex-col items-center gap-0.5 px-1 py-2 text-center text-[11px] text-muted-foreground data-[status=active]:text-primary">
            <n.icon className="h-5 w-5" />
            {n.label.replace("Record ", "")}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border bg-card p-4 shadow-sm ${className}`}>{children}</div>;
}

export const btn = "inline-flex items-center justify-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50";
export const btnAccent = "inline-flex items-center justify-center gap-1 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:opacity-90";
export const btnGhost = "inline-flex items-center justify-center gap-1 rounded-md border px-3 py-1.5 text-sm hover:bg-muted";
export const input = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";
