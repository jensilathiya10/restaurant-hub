"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Icons } from "./Icon";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: keyof typeof Icons };

const ALL_NAV: { section: string; items: NavItem[] }[] = [
  { section: "Overview", items: [{ href: "/admin/dashboard", label: "Dashboard", icon: "dashboard" }] },
  {
    section: "Operations",
    items: [
      { href: "/admin/orders", label: "Orders", icon: "orders" },
      { href: "/admin/tables", label: "Table Floor Plan", icon: "tables" },
      { href: "/admin/reservations", label: "Reservations", icon: "reservations" },
      { href: "/admin/customers", label: "Customers", icon: "customers" },
    ],
  },
  {
    section: "Restaurant",
    items: [
      { href: "/admin/menu", label: "Menu Management", icon: "menu" },
      { href: "/admin/inventory", label: "Inventory", icon: "inventory" },
      { href: "/admin/recipe-cost", label: "Recipe Cost Calculator", icon: "money" },
      { href: "/admin/waste", label: "Food Waste Analytics", icon: "trash" },
    ],
  },
  {
    section: "People",
    items: [
      { href: "/admin/employees", label: "Employees", icon: "employees" },
      { href: "/admin/scheduling", label: "Scheduling", icon: "scheduling" },
    ],
  },
  {
    section: "Insights",
    items: [
      { href: "/admin/reports", label: "Reports", icon: "reports" },
      { href: "/admin/analytics", label: "Sales Analytics", icon: "analytics" },
      { href: "/admin/ai-insights", label: "AI Insights", icon: "ai" },
      { href: "/admin/reviews", label: "Customer Feedback", icon: "star" },
    ],
  },
  { section: "System", items: [{ href: "/admin/settings", label: "Settings", icon: "settings" }] },
];

const ROLE_VISIBLE: Record<string, string[]> = {
  SUPER_ADMIN: ["*"],
  OWNER: ["*"],
  MANAGER: ["/admin/dashboard","/admin/orders","/admin/tables","/admin/reservations","/admin/customers","/admin/menu","/admin/inventory","/admin/recipe-cost","/admin/waste","/admin/employees","/admin/scheduling","/admin/reports","/admin/analytics","/admin/ai-insights","/admin/reviews"],
  CASHIER: ["/admin/orders","/admin/tables","/admin/reservations","/admin/customers"],
  WAITER: ["/admin/orders","/admin/tables","/admin/reservations","/admin/customers"],
};

export default function AdminSidebar({ role, restaurantName, userName }: { role: string; restaurantName: string; userName: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const visible = ROLE_VISIBLE[role] || [];
  const canSee = (href: string) => visible.includes("*") || visible.includes(href);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const nav = ALL_NAV.map((s) => ({ ...s, items: s.items.filter((i) => canSee(i.href)) })).filter((s) => s.items.length);

  return (
    <>
      <button
        className="md:hidden fixed top-3 left-3 z-40 bg-[var(--surface-card)] border border-[var(--border-warm)] rounded-xl p-2 shadow-md"
        onClick={() => setOpen(true)}
      >
        <Icons.menuBtn size={18} />
      </button>
      {open && <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setOpen(false)} />}
      <aside
        className={cn(
          "fixed md:sticky top-0 z-40 md:z-0 h-screen w-64 bg-[var(--ink)] text-white flex flex-col transition-transform",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <div className="font-display font-semibold text-base tracking-tight">RestaurantHub</div>
            <div className="text-xs text-white/50 truncate max-w-[180px]">{restaurantName}</div>
          </div>
          <button className="md:hidden" onClick={() => setOpen(false)}>
            <Icons.close size={18} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-3">
          {nav.map((s) => (
            <div key={s.section} className="mb-3">
              <div className="px-4 text-[10px] uppercase tracking-wider text-white/40 mb-1">{s.section}</div>
              {s.items.map((item) => {
                const Icon = Icons[item.icon];
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "mx-2 flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors",
                      active && "bg-gradient-to-r from-[var(--brand)] to-[var(--brand-light)] text-white shadow-md hover:from-[var(--brand)] hover:to-[var(--brand-light)]"
                    )}
                  >
                    <Icon size={16} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <div className="text-xs text-white/50 mb-2">
            <span className="block font-medium text-white">{userName}</span>
            <span>{role.replace("_", " ")}</span>
          </div>
          <button onClick={logout} className="flex items-center gap-2 text-sm text-white/70 hover:text-white">
            <Icons.logout size={15} /> Log out
          </button>
        </div>
      </aside>
    </>
  );
}
