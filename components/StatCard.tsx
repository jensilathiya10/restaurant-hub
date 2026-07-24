import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function StatCard({
  label, value, icon: Icon, tone = "default", sub,
}: {
  label: string; value: string; icon: LucideIcon; tone?: "default" | "warn" | "good"; sub?: string;
}) {
  return (
    <div className="bg-[var(--surface-card)] rounded-2xl border border-[var(--border-warm)] p-4 flex items-start justify-between shadow-sm shadow-black/[0.02]">
      <div>
        <div className="text-xs text-neutral-500 mb-1">{label}</div>
        <div className="text-2xl font-display font-semibold text-[var(--ink)]">{value}</div>
        {sub && <div className="text-xs text-neutral-400 mt-1">{sub}</div>}
      </div>
      <div
        className={cn(
          "rounded-xl p-2",
          tone === "warn" && "bg-amber-100 text-amber-700",
          tone === "good" && "bg-emerald-100 text-emerald-700",
          tone === "default" && "bg-[var(--brand)]/10 text-[var(--brand)]"
        )}
      >
        <Icon size={20} />
      </div>
    </div>
  );
}
