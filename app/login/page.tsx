"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const DEMO_ACCOUNTS = [
  { role: "Super Admin", email: "super@rhub.dev" },
  { role: "Owner", email: "owner@rhub.dev" },
  { role: "Manager", email: "manager@rhub.dev" },
  { role: "Cashier", email: "cashier@rhub.dev" },
  { role: "Waiter", email: "waiter@rhub.dev" },
  { role: "Chef", email: "chef@rhub.dev" },
  { role: "Customer", email: "john@customer.dev" },
];

export default function LoginPage() {
  const [email, setEmail] = useState("owner@rhub.dev");
  const [password, setPassword] = useState("password");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Login failed");
      return;
    }
    router.push(data.redirect);
    router.refresh();
  }

  return (
    <div className="flex-1 grid md:grid-cols-2">
      <div className="hidden md:flex flex-col justify-between bg-gradient-to-br from-[var(--brand)] via-[var(--brand-light)] to-[var(--brand-dark)] text-white p-10">
        <div className="font-display font-semibold text-xl tracking-tight">RestaurantHub</div>
        <div>
          <h1 className="font-display italic text-4xl font-medium leading-tight mb-4">
            Run your whole restaurant from one platform.
          </h1>
          <p className="text-white/80 max-w-md">
            Orders, kitchen display, inventory, staff scheduling, reservations and
            analytics — for every role, in real time.
          </p>
        </div>
        <p className="text-sm text-white/60">Multi-tenant SaaS demo · Bella Vista Trattoria</p>
      </div>
      <div className="flex items-center justify-center p-8 bg-[var(--surface)]">
        <div className="w-full max-w-sm bg-[var(--surface-card)] rounded-2xl border border-[var(--border-warm)] shadow-sm shadow-black/[0.02] p-6">
          <h2 className="font-display text-2xl font-semibold mb-1 text-[var(--ink)]">Sign in</h2>
          <p className="text-neutral-500 text-sm mb-6">Use a demo account below or your own.</p>
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="text-sm font-medium text-neutral-700">Email</label>
              <input
                className="mt-1 w-full rounded-lg border border-[var(--border-warm)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-700">Password</label>
              <input
                className="mt-1 w-full rounded-lg border border-[var(--border-warm)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              disabled={loading}
              className="w-full bg-gradient-to-r from-[var(--brand)] to-[var(--brand-light)] hover:opacity-90 text-white font-medium rounded-lg py-2 text-sm transition disabled:opacity-60 shadow-md"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="mt-6 border-t border-[var(--border-warm)] pt-4">
            <p className="text-xs font-medium text-neutral-500 mb-2">Demo accounts (password: password)</p>
            <div className="grid grid-cols-2 gap-1.5">
              {DEMO_ACCOUNTS.map((a) => (
                <button
                  key={a.email}
                  onClick={() => {
                    setEmail(a.email);
                    setPassword("password");
                  }}
                  className="text-left text-xs rounded-md border border-[var(--border-warm)] px-2 py-1.5 hover:border-[var(--brand)] hover:bg-neutral-50"
                  type="button"
                >
                  <span className="font-medium block">{a.role}</span>
                  <span className="text-neutral-400">{a.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
