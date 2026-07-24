"use client";
import { money } from "@/lib/utils";
import { RevenueBarChart } from "./charts";

export default function ReportsPanel({ rows, todayRevenue, currency }: { rows: any[]; todayRevenue: number; currency: string }) {
  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const totalOrders = rows.reduce((s, r) => s + r.orders, 0);
  const estExpenses = totalRevenue * 0.62; // heuristic COGS+labor
  const profit = totalRevenue - estExpenses;

  function exportPdf() {
    import("jspdf").then(({ default: jsPDF }) => {
      import("jspdf-autotable").then((autoTable: any) => {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text("Revenue Report — Last 30 Days", 14, 16);
        (autoTable.default || autoTable)(doc, {
          startY: 22,
          head: [["Date", "Revenue", "Orders"]],
          body: rows.map((r) => [r.day, money(r.revenue, currency), String(r.orders)]),
        });
        doc.save("revenue-report.pdf");
      });
    });
  }

  return (
    <div>
      <div className="grid sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-white rounded-xl border p-4"><div className="text-xs text-neutral-500">Today</div><div className="text-xl font-bold">{money(todayRevenue, currency)}</div></div>
        <div className="bg-white rounded-xl border p-4"><div className="text-xs text-neutral-500">30-day Revenue</div><div className="text-xl font-bold">{money(totalRevenue, currency)}</div></div>
        <div className="bg-white rounded-xl border p-4"><div className="text-xs text-neutral-500">Est. Expenses</div><div className="text-xl font-bold">{money(estExpenses, currency)}</div></div>
        <div className="bg-white rounded-xl border p-4"><div className="text-xs text-neutral-500">Est. Profit</div><div className="text-xl font-bold text-emerald-600">{money(profit, currency)}</div></div>
      </div>
      <div className="bg-white rounded-xl border p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">Monthly Revenue</h3>
          <div className="flex gap-2">
            <a href="/api/reports/export?days=30" className="text-xs border rounded-md px-3 py-1.5 hover:bg-neutral-50">Export CSV</a>
            <button onClick={exportPdf} className="text-xs border rounded-md px-3 py-1.5 hover:bg-neutral-50">Export PDF</button>
          </div>
        </div>
        <RevenueBarChart data={rows} />
      </div>
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-500 text-xs"><tr><th className="text-left px-4 py-2">Date</th><th className="text-left px-4 py-2">Revenue</th><th className="text-left px-4 py-2">Orders</th></tr></thead>
          <tbody>
            {rows.slice().reverse().map((r) => (
              <tr key={r.day} className="border-t border-neutral-100"><td className="px-4 py-2">{r.day}</td><td className="px-4 py-2">{money(r.revenue, currency)}</td><td className="px-4 py-2">{r.orders}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
