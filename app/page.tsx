import Link from "next/link";

export default function Home() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-[var(--brand)] via-[var(--brand-light)] to-[var(--brand-dark)] text-white p-8 text-center">
      <div className="text-sm uppercase tracking-[0.2em] text-white/70 mb-3">RestaurantHub</div>
      <h1 className="font-display italic text-4xl md:text-6xl font-medium max-w-2xl leading-tight mb-4">
        The full-stack platform restaurants actually run on.
      </h1>
      <p className="text-white/80 max-w-lg mb-8">
        Orders, kitchen display, inventory, staff, reservations, and analytics —
        three panels, one system.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link
          href="/menu"
          className="bg-white text-[var(--brand-dark)] font-semibold rounded-full px-6 py-2.5 text-sm shadow-lg hover:opacity-90 transition-opacity"
        >
          View Customer Menu (QR)
        </Link>
        <Link
          href="/login"
          className="bg-white/10 border border-white/40 font-semibold rounded-full px-6 py-2.5 text-sm hover:bg-white/20 transition-colors backdrop-blur-sm"
        >
          Staff / Admin Login
        </Link>
      </div>
    </div>
  );
}
