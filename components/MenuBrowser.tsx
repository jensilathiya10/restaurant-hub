"use client";
import { useMemo, useState } from "react";
import { useCart } from "@/lib/cart";
import { money, cn } from "@/lib/utils";
import { Icons } from "./Icon";

type MenuItem = {
  id: string; categoryId: string; name: string; description: string | null; price: number;
  imageUrl?: string | null; available: number | boolean; prepMinutes?: number;
  dietaryTags?: string; spiceLevel?: number; calories?: number | null; proteinG?: number | null;
  popularity?: number; rating?: number; isChefPick?: number | boolean; isTrending?: number | boolean;
};
type Category = { id: string; name: string };

const VIEWS = [
  { key: "discover", label: "Discover", icon: "discover" as const },
  { key: "trending", label: "Trending", icon: "trend" as const },
  { key: "chef", label: "Chef's Choice", icon: "kitchen" as const },
  { key: "healthy", label: "Healthy", icon: "leaf" as const },
  { key: "favorites", label: "Favorites", icon: "heart" as const },
];

const MOODS = ["Comfort food", "Light & fresh", "Adventurous"];
const BUDGETS = [
  { label: "€", max: 8 },
  { label: "€€", max: 14 },
  { label: "€€€", max: 999 },
];

const EMOJI_BY_CATEGORY: Record<string, string> = {
  Pizza: "🍕", Pasta: "🍝", Salads: "🥗", Drinks: "🥤", Desserts: "🍰", Burgers: "🍔",
};

function tagsOf(item: MenuItem) {
  return (item.dietaryTags || "").split(",").map((t) => t.trim()).filter(Boolean);
}

function parseQuery(q: string) {
  const lower = q.toLowerCase();
  const priceMatch = lower.match(/(?:under|below|less than)\s*€?\s*(\d+(?:\.\d+)?)/);
  const dietary: string[] = [];
  for (const tag of ["vegan", "vegetarian", "halal", "gluten-free", "gluten free", "nut-free", "nut free"]) {
    if (lower.includes(tag)) dietary.push(tag.replace(" ", "-"));
  }
  return {
    maxPrice: priceMatch ? parseFloat(priceMatch[1]) : undefined,
    spicy: /\bspicy|\bhot\b/.test(lower),
    highProtein: /high[- ]protein/.test(lower),
    light: /\blight\b|low[- ]cal/.test(lower),
    dietary,
    freeText: lower
      .replace(/(?:under|below|less than)\s*€?\s*\d+(?:\.\d+)?/, "")
      .replace(/spicy|hot|high[- ]protein|light|low[- ]cal|vegan|vegetarian|halal|gluten[- ]free|nut[- ]free/g, "")
      .trim(),
  };
}

export default function MenuBrowser({ categories, items }: { categories: Category[]; items: MenuItem[] }) {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<string>("discover");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [quickView, setQuickView] = useState<MenuItem | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [mood, setMood] = useState<string | null>(null);
  const [budget, setBudget] = useState<number>(999);
  const { add, remove, lines, count, total, restaurantSlug } = useCart();

  const q = useMemo(() => parseQuery(search), [search]);

  const filtered = useMemo(() => {
    let list = items.filter((i) => {
      if (q.freeText && !i.name.toLowerCase().includes(q.freeText) && !(i.description || "").toLowerCase().includes(q.freeText)) return false;
      if (q.maxPrice !== undefined && i.price > q.maxPrice) return false;
      if (q.spicy && (i.spiceLevel || 0) < 2) return false;
      if (q.highProtein && (i.proteinG || 0) < 20) return false;
      if (q.light && (i.calories || 0) > 500) return false;
      if (q.dietary.length && !q.dietary.every((d) => tagsOf(i).includes(d))) return false;
      return true;
    });

    if (view === "trending") list = list.filter((i) => i.isTrending);
    if (view === "chef") list = list.filter((i) => i.isChefPick);
    if (view === "healthy") list = list.filter((i) => tagsOf(i).some((t) => ["vegan", "vegetarian", "gluten-free"].includes(t)) || (i.calories || 0) <= 400);
    if (view === "favorites") list = list.filter((i) => favorites.has(i.id));

    if (mood === "Comfort food") list = [...list].sort((a, b) => (b.calories || 0) - (a.calories || 0));
    if (mood === "Light & fresh") list = list.filter((i) => (i.calories || 0) <= 500);
    if (mood === "Adventurous") list = [...list].sort((a, b) => (b.spiceLevel || 0) - (a.spiceLevel || 0));
    if (budget < 999) list = list.filter((i) => i.price <= budget);

    return list;
  }, [items, q, view, favorites, mood, budget]);

  function toggleFav(id: string) {
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function qtyFor(id: string) {
    return lines.find((l) => l.menuItemId === id)?.quantity || 0;
  }

  function applyWizard() {
    setWizardOpen(false);
    setView("discover");
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 pb-28">
      {/* Smart search */}
      <div className="relative mb-3">
        <Icons.search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Try “spicy under €15” or “high protein vegetarian”…"
          className="w-full bg-[var(--surface-card)] border border-[var(--border-warm)] rounded-full pl-9 pr-3 py-2.5 text-sm shadow-sm shadow-black/[0.02] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
        />
      </div>

      {/* AI concierge trigger */}
      <button
        onClick={() => setWizardOpen(true)}
        className="w-full mb-4 flex items-center gap-2.5 rounded-2xl p-3 bg-gradient-to-r from-[var(--brand)]/10 to-[var(--brand-light)]/10 border border-[var(--brand)]/20 text-left hover:border-[var(--brand)]/40 transition-colors"
      >
        <span className="shrink-0 rounded-full bg-gradient-to-br from-[var(--brand)] to-[var(--brand-light)] text-white p-2">
          <Icons.wand size={16} />
        </span>
        <span>
          <span className="block text-sm font-semibold text-[var(--ink)]">✨ What should I eat?</span>
          <span className="block text-xs text-neutral-500">Tell us your mood and budget — we'll pick for you</span>
        </span>
      </button>

      {/* Discovery nav */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-4 px-4">
        {VIEWS.map((v) => {
          const Icon = Icons[v.icon];
          const active = view === v.key;
          return (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap px-3.5 py-2 rounded-full text-xs font-medium border transition-colors",
                active
                  ? "bg-gradient-to-r from-[var(--brand)] to-[var(--brand-light)] text-white border-transparent shadow-md"
                  : "bg-[var(--surface-card)] border-[var(--border-warm)] text-neutral-600 hover:border-[var(--brand)]/40"
              )}
            >
              <Icon size={13} /> {v.label}
            </button>
          );
        })}
      </div>

      {/* Category pills (secondary refinement) */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-4 -mx-4 px-4">
        {categories.map((c) => (
          <span key={c.id} className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-full text-neutral-400 border border-[var(--border-warm)]">
            {EMOJI_BY_CATEGORY[c.name] || "🍽"} {c.name}
          </span>
        ))}
      </div>

      {/* Dish grid */}
      <div className="grid grid-cols-2 gap-3">
        {filtered.map((item) => {
          const available = item.available === 1 || item.available === true;
          const emoji = EMOJI_BY_CATEGORY[categories.find((c) => c.id === item.categoryId)?.name || ""] || "🍽";
          const isFav = favorites.has(item.id);
          const qty = qtyFor(item.id);
          return (
            <div
              key={item.id}
              className={cn(
                "group relative flex flex-col bg-[var(--surface-card)] rounded-2xl border border-[var(--border-warm)] overflow-hidden shadow-sm shadow-black/[0.03] transition-all hover:shadow-lg hover:-translate-y-0.5",
                !available && "opacity-60"
              )}
            >
              <button
                onClick={() => setQuickView(item)}
                className="relative aspect-[4/3] w-full flex items-center justify-center text-5xl bg-gradient-to-br from-[var(--brand)]/15 to-[var(--brand-light)]/5"
              >
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt={item.name} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <span>{emoji}</span>
                )}
                <span className="absolute top-1.5 left-1.5 flex flex-col gap-1 items-start">
                  {!!item.isChefPick && (
                    <span className="flex items-center gap-1 bg-[var(--ink)]/90 text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full backdrop-blur-sm">
                      <Icons.kitchen size={10} /> Chef's Pick
                    </span>
                  )}
                  {!!item.isTrending && (
                    <span className="flex items-center gap-1 bg-white/85 text-[var(--brand-dark)] text-[10px] font-medium px-1.5 py-0.5 rounded-full backdrop-blur-sm">
                      <Icons.trend size={10} /> Trending
                    </span>
                  )}
                </span>
                <span
                  onClick={(e) => { e.stopPropagation(); toggleFav(item.id); }}
                  className="absolute top-1.5 right-1.5 bg-white/85 backdrop-blur-sm rounded-full p-1.5 hover:scale-110 transition-transform"
                >
                  <Icons.heart size={13} className={isFav ? "fill-[var(--brand)] text-[var(--brand)]" : "text-neutral-400"} />
                </span>
                {!available && (
                  <span className="absolute inset-x-0 bottom-0 bg-black/70 text-white text-[10px] text-center py-1">Sold out</span>
                )}
              </button>

              <div className="flex-1 flex flex-col p-2.5">
                <div className="flex items-start justify-between gap-1">
                  <span className="font-display font-semibold text-sm leading-tight text-[var(--ink)]">{item.name}</span>
                  <button onClick={() => setQuickView(item)} className="shrink-0 text-neutral-300 hover:text-[var(--brand)]">
                    <Icons.eye size={14} />
                  </button>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-neutral-500 mt-0.5">
                  <Icons.star size={11} className="fill-amber-400 text-amber-400" /> {(item.rating ?? 4.5).toFixed(1)}
                  <span className="text-neutral-300">·</span>
                  <Icons.clock size={11} /> {item.prepMinutes ?? 10}m
                  {!!(item.popularity && item.popularity >= 85) && (
                    <>
                      <span className="text-neutral-300">·</span>
                      <span className="text-[var(--brand)]">🔥 Popular</span>
                    </>
                  )}
                </div>
                {(item.calories || item.proteinG) && (
                  <div className="text-[11px] text-neutral-400 mt-0.5">
                    {item.calories ? `${item.calories} kcal` : ""}{item.calories && item.proteinG ? " · " : ""}{item.proteinG ? `${item.proteinG}g protein` : ""}
                  </div>
                )}
                {!!item.spiceLevel && (
                  <div className="flex items-center gap-0.5 mt-1">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Icons.spice key={i} size={11} className={i < (item.spiceLevel || 0) ? "fill-orange-500 text-orange-500" : "text-neutral-200"} />
                    ))}
                  </div>
                )}

                <div className="mt-auto flex items-center justify-between pt-2">
                  <span className="text-sm font-semibold text-[var(--brand)]">{money(item.price)}</span>
                  <button
                    onClick={() => add({ id: item.id, name: item.name, price: item.price })}
                    disabled={!available}
                    className="relative bg-gradient-to-r from-[var(--brand)] to-[var(--brand-light)] disabled:opacity-40 text-white text-xs font-medium rounded-full px-3 py-1.5 flex items-center gap-1 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <Icons.plus size={12} /> Add
                    {qty > 0 && <span className="absolute -top-1.5 -right-1.5 bg-white text-[var(--brand)] text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow">{qty}</span>}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="col-span-2 text-sm text-neutral-400 text-center py-14">No dishes match — try a different search or view.</p>
        )}
      </div>

      {/* Quick view modal */}
      {quickView && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4" onClick={() => setQuickView(null)}>
          <div
            className="w-full sm:max-w-md bg-[var(--surface-card)] rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl animate-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-[16/9] flex items-center justify-center text-7xl bg-gradient-to-br from-[var(--brand)]/15 to-[var(--brand-light)]/5">
              {quickView.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={quickView.imageUrl} alt={quickView.name} className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <span>{EMOJI_BY_CATEGORY[categories.find((c) => c.id === quickView.categoryId)?.name || ""] || "🍽"}</span>
              )}
              <button onClick={() => setQuickView(null)} className="absolute top-3 right-3 bg-white/90 rounded-full p-1.5">
                <Icons.close size={16} />
              </button>
            </div>
            <div className="p-5">
              <h3 className="font-display font-semibold text-xl text-[var(--ink)] mb-1">{quickView.name}</h3>
              <p className="text-sm text-neutral-500 mb-3">{quickView.description}</p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {tagsOf(quickView).map((t) => (
                  <span key={t} className="text-[11px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Icons.leaf size={10} /> {t}
                  </span>
                ))}
                {!!quickView.isChefPick && <span className="text-[11px] bg-[var(--ink)] text-white px-2 py-0.5 rounded-full">Chef's Pick</span>}
                {!!quickView.isTrending && <span className="text-[11px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">Trending</span>}
              </div>
              <div className="grid grid-cols-4 gap-2 text-center mb-4">
                <div className="rounded-xl bg-neutral-50 p-2">
                  <div className="text-sm font-semibold">{(quickView.rating ?? 4.5).toFixed(1)}</div>
                  <div className="text-[10px] text-neutral-400">Rating</div>
                </div>
                <div className="rounded-xl bg-neutral-50 p-2">
                  <div className="text-sm font-semibold">{quickView.prepMinutes ?? 10}m</div>
                  <div className="text-[10px] text-neutral-400">Prep</div>
                </div>
                <div className="rounded-xl bg-neutral-50 p-2">
                  <div className="text-sm font-semibold">{quickView.calories ?? "—"}</div>
                  <div className="text-[10px] text-neutral-400">kcal</div>
                </div>
                <div className="rounded-xl bg-neutral-50 p-2">
                  <div className="text-sm font-semibold">{quickView.proteinG ?? "—"}g</div>
                  <div className="text-[10px] text-neutral-400">Protein</div>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-lg font-semibold text-[var(--brand)]">{money(quickView.price)}</span>
                <div className="flex items-center gap-2">
                  {qtyFor(quickView.id) > 0 && (
                    <>
                      <button onClick={() => remove(quickView.id)} className="w-8 h-8 rounded-full border border-[var(--border-warm)] flex items-center justify-center"><Icons.minus size={14} /></button>
                      <span className="w-5 text-center text-sm font-medium">{qtyFor(quickView.id)}</span>
                    </>
                  )}
                  <button
                    onClick={() => add({ id: quickView.id, name: quickView.name, price: quickView.price })}
                    className="bg-gradient-to-r from-[var(--brand)] to-[var(--brand-light)] text-white text-sm font-medium rounded-full px-5 py-2 shadow-md"
                  >
                    Add to order
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI concierge wizard */}
      {wizardOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4" onClick={() => setWizardOpen(false)}>
          <div className="w-full sm:max-w-sm bg-[var(--surface-card)] rounded-t-3xl sm:rounded-3xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-lg text-[var(--ink)]">What should I eat?</h3>
              <button onClick={() => setWizardOpen(false)}><Icons.close size={18} /></button>
            </div>
            <p className="text-xs font-medium text-neutral-500 mb-2">Mood</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {MOODS.map((m) => (
                <button
                  key={m}
                  onClick={() => setMood(m)}
                  className={cn(
                    "text-xs px-3 py-1.5 rounded-full border",
                    mood === m ? "bg-gradient-to-r from-[var(--brand)] to-[var(--brand-light)] text-white border-transparent" : "border-[var(--border-warm)] text-neutral-600"
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
            <p className="text-xs font-medium text-neutral-500 mb-2">Budget</p>
            <div className="flex gap-2 mb-5">
              {BUDGETS.map((b) => (
                <button
                  key={b.label}
                  onClick={() => setBudget(b.max)}
                  className={cn(
                    "flex-1 text-sm py-2 rounded-xl border font-medium",
                    budget === b.max ? "bg-gradient-to-r from-[var(--brand)] to-[var(--brand-light)] text-white border-transparent" : "border-[var(--border-warm)] text-neutral-600"
                  )}
                >
                  {b.label}
                </button>
              ))}
            </div>
            <button onClick={applyWizard} className="w-full bg-[var(--ink)] text-white rounded-full py-2.5 text-sm font-medium">
              Show me dishes ✨
            </button>
          </div>
        </div>
      )}

      {/* Floating sticky cart bar */}
      {count > 0 && (
        <div className="fixed bottom-4 left-0 right-0 z-40 px-4">
          <a
            href={`/cart?r=${restaurantSlug}`}
            className="max-w-3xl mx-auto flex items-center justify-between bg-[var(--ink)] text-white rounded-full px-5 py-3.5 shadow-2xl hover:opacity-95 transition-opacity"
          >
            <span className="flex items-center gap-2 text-sm font-medium">
              <span className="bg-white/15 rounded-full w-6 h-6 flex items-center justify-center text-xs">{count}</span>
              View order
            </span>
            <span className="text-sm font-semibold">{money(total)}</span>
          </a>
        </div>
      )}
    </div>
  );
}
