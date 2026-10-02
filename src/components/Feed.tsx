import { useMemo, useState } from "react";
import { MapPin, Search, SlidersHorizontal } from "lucide-react";
import { CATEGORIES, NEIGHBORHOODS, useStore } from "@/lib/store";
import { DressCard, Pill } from "./ui-kit";

export function Feed({ title, eyebrow, limit }: { title: string; eyebrow: string; limit?: number }) {
  const dresses = useStore((s) => s.dresses);
  const [cat, setCat] = useState<string>("All");
  const [hood, setHood] = useState(NEIGHBORHOODS[0]);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"distance" | "price" | "rating">("distance");
  const [showSort, setShowSort] = useState(false);

  const list = useMemo(() => {
    const r = dresses
      .filter((d) => cat === "All" || d.category === cat)
      .filter((d) => !q || `${d.title} ${d.tilet} ${d.category} ${d.neighborhood}`.toLowerCase().includes(q.toLowerCase()))
      .map((d) => ({ ...d, distanceKm: d.neighborhood === hood.name ? Math.min(d.distanceKm, 1.5) : +(Math.abs(d.distanceKm + hood.km - 2.3) + 0.4).toFixed(1) }));
    r.sort((a, b) => (sort === "price" ? a.fee - b.fee : sort === "rating" ? b.rating - a.rating : a.distanceKm - b.distanceKm));
    return limit ? r.slice(0, limit) : r;
  }, [dresses, cat, q, hood, sort, limit]);

  return (
    <div>
      <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-1">
        {["All", ...CATEGORIES].map((c) => (
          <Pill key={c} active={cat === c} onClick={() => setCat(c)}>{c}</Pill>
        ))}
      </div>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <label className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 shadow-soft">
          <MapPin className="h-5 w-5 text-gold" />
          <select
            aria-label="Neighborhood"
            value={hood.name}
            onChange={(e) => setHood(NEIGHBORHOODS.find((n) => n.name === e.target.value)!)}
            className="bg-transparent font-medium text-primary outline-none"
          >
            {NEIGHBORHOODS.map((n) => (
              <option key={n.name} value={n.name}>{n.name}</option>
            ))}
          </select>
          <span className="text-muted-foreground">• {hood.km}km away</span>
        </label>
        <div className="relative flex flex-1 items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 shadow-soft">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search dresses, styles…" className="flex-1 bg-transparent outline-none" />
          <button aria-label="Sort" onClick={() => setShowSort(!showSort)} className="text-primary">
            <SlidersHorizontal className="h-5 w-5" />
          </button>
          {showSort && (
            <div className="absolute right-2 top-14 z-20 w-48 rounded-2xl border border-border bg-card p-2 shadow-soft">
              {(["distance", "price", "rating"] as const).map((s) => (
                <button key={s} onClick={() => (setSort(s), setShowSort(false))} className={`block w-full rounded-xl px-3 py-2 text-left text-sm capitalize hover:bg-muted ${sort === s ? "font-semibold text-primary" : ""}`}>
                  Sort by {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="mt-10">
        <div className="eyebrow">{eyebrow}</div>
        <h2 className="font-serif text-3xl text-primary">{title}</h2>
      </div>
      {list.length === 0 ? (
        <p className="mt-8 text-muted-foreground">No dresses match yet — try another category or search.</p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-5 lg:grid-cols-4">
          {list.map((d) => <DressCard key={d.id} d={d} />)}
        </div>
      )}
    </div>
  );
}
