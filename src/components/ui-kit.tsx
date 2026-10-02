import { Link, useRouterState } from "@tanstack/react-router";
import { Heart, Home, LayoutGrid, ListPlus, Search, Star, Bell, ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState, useEffect, type ReactNode } from "react";
import { actions, etb, useStore, ymd, type Dress, RENTAL_DAYS } from "@/lib/store";
import { cn } from "@/lib/utils";

export function Header() {
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between px-5 pt-6">
      <Link to="/" className="leading-tight">
        <div className="font-serif text-2xl font-semibold text-primary">Rent a Tilet</div>
        <div className="eyebrow">Addis Ababa</div>
      </Link>
      <button aria-label="Notifications" className="relative rounded-full p-2 text-primary">
        <Bell className="h-5 w-5" />
        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-gold" />
      </button>
    </header>
  );
}

export function BottomNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const items = [
    { to: "/", label: "Home", icon: Home },
    { to: "/browse", label: "Browse", icon: Search },
    { to: "/list", label: "List", icon: ListPlus },
    { to: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  ] as const;
  return (
    <nav className="fixed inset-x-0 bottom-4 z-40 mx-auto w-[min(92%,640px)] rounded-[2rem] border border-border bg-card/95 px-3 py-2 shadow-soft backdrop-blur">
      <ul className="grid grid-cols-4">
        {items.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? path === "/" : path.startsWith(to);
          const isList = to === "/list";
          return (
            <li key={to}>
              <Link to={to} className="flex flex-col items-center gap-1 py-1 text-xs">
                <span
                  className={cn(
                    "grid h-11 w-11 place-items-center rounded-full transition",
                    isList ? "bg-gold text-primary shadow-gold" : active ? "bg-muted text-primary" : "text-muted-foreground",
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className={active ? "font-medium text-primary" : "text-muted-foreground"}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function Pill({ active, children, onClick }: { active?: boolean; children: ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "whitespace-nowrap rounded-full border px-5 py-2.5 text-sm transition",
        active ? "border-primary bg-primary text-primary-foreground shadow-gold-ring" : "border-border bg-card text-foreground hover:border-primary/40",
      )}
    >
      {children}
    </button>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-[1.75rem] border border-border bg-card p-6 shadow-soft", className)}>{children}</div>;
}

export function DressCard({ d }: { d: Dress }) {
  const fav = useStore((s) => s.favorites.includes(d.id));
  return (
    <div className="group">
      <div className="relative overflow-hidden rounded-[1.5rem] bg-muted">
        <Link to="/dress/$id" params={{ id: d.id }}>
          <img src={d.photos[0]} alt={d.title} loading="lazy" className="aspect-[3/4] w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
        </Link>
        <button
          aria-label={fav ? "Remove from saved" : "Save dress"}
          onClick={() => actions.toggleFav(d.id)}
          className="absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-full bg-card/95 text-primary shadow-soft"
        >
          <Heart className={cn("h-5 w-5", fav && "fill-destructive text-destructive")} />
        </button>
        <span className="absolute bottom-3 left-3 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
          {d.distanceKm} km
        </span>
        {d.status === "review" && (
          <span className="absolute left-3 top-3 rounded-full bg-gold px-3 py-1 text-xs font-semibold text-primary">In review</span>
        )}
      </div>
      <Link to="/dress/$id" params={{ id: d.id }} className="mt-3 block px-1">
        <div className="text-lg text-primary">{d.title}</div>
        <div className="flex items-center justify-between text-sm">
          <span>
            <span className="font-medium text-primary">{etb(d.fee)}</span>
            <span className="text-muted-foreground"> / {RENTAL_DAYS} days</span>
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <Star className="h-4 w-4 fill-gold text-gold" />
            {d.rating ? d.rating.toFixed(1) : "New"}
          </span>
        </div>
      </Link>
    </div>
  );
}

export function SignaturePad({ label, value, onChange }: { label: string; value?: string | undefined; onChange: (v?: string) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext("2d")!;
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.strokeStyle = getComputedStyle(c).color;
    if (value) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const pos = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * ref.current!.width, ((e.clientY - r.top) / r.height) * ref.current!.height];
  };
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-primary">{label}</span>
        <button
          type="button"
          className="text-muted-foreground underline"
          onClick={() => {
            const c = ref.current!;
            c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
            onChange(undefined);
          }}
        >
          Clear
        </button>
      </div>
      <canvas
        ref={ref}
        width={500}
        height={160}
        className="h-32 w-full touch-none rounded-2xl border border-dashed border-gold bg-background text-primary"
        onPointerDown={(e) => {
          drawing.current = true;
          const ctx = ref.current!.getContext("2d")!;
          const [x, y] = pos(e);
          ctx.beginPath();
          ctx.moveTo(x, y);
        }}
        onPointerMove={(e) => {
          if (!drawing.current) return;
          const ctx = ref.current!.getContext("2d")!;
          const [x, y] = pos(e);
          ctx.lineTo(x, y);
          ctx.stroke();
        }}
        onPointerUp={() => {
          drawing.current = false;
          onChange(ref.current!.toDataURL());
        }}
        onPointerLeave={() => {
          if (drawing.current) onChange(ref.current!.toDataURL());
          drawing.current = false;
        }}
      />
      {value && <div className="mt-1 text-xs text-primary">Signed ✓</div>}
    </div>
  );
}

/** Month calendar. mode "block" toggles dates; mode "pick" selects a start date and highlights the rental span. */
export function MonthCalendar({
  blocked,
  onToggle,
  selected,
  onPick,
  mode,
}: {
  blocked: string[];
  onToggle?: (d: string) => void;
  selected?: string;
  onPick?: (d: string) => void;
  mode: "block" | "pick";
}) {
  const [cursor, setCursor] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });
  const today = ymd(new Date());
  const first = cursor.getDay();
  const days = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const span = new Set<string>();
  if (selected) {
    const s = new Date(selected + "T00:00");
    for (let i = 0; i < RENTAL_DAYS; i++) span.add(ymd(new Date(s.getFullYear(), s.getMonth(), s.getDate() + i)));
  }
  const spanFree = (d: string) => {
    const s = new Date(d + "T00:00");
    for (let i = 0; i < RENTAL_DAYS; i++) if (blocked.includes(ymd(new Date(s.getFullYear(), s.getMonth(), s.getDate() + i)))) return false;
    return true;
  };
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button type="button" aria-label="Previous month" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} className="rounded-full p-2 hover:bg-muted">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="font-serif text-lg text-primary">{cursor.toLocaleString("en-US", { month: "long", year: "numeric" })}</div>
        <button type="button" aria-label="Next month" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} className="rounded-full p-2 hover:bg-muted">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="py-1">{d}</div>
        ))}
        {Array.from({ length: first }).map((_, i) => <div key={"e" + i} />)}
        {Array.from({ length: days }).map((_, i) => {
          const d = ymd(new Date(cursor.getFullYear(), cursor.getMonth(), i + 1));
          const past = d < today;
          const isBlocked = blocked.includes(d);
          const inSpan = span.has(d);
          const disabled = past || (mode === "pick" && (isBlocked || !spanFree(d)));
          return (
            <button
              type="button"
              key={d}
              disabled={disabled}
              onClick={() => (mode === "block" ? onToggle?.(d) : onPick?.(d))}
              className={cn(
                "aspect-square rounded-full text-sm transition",
                disabled && "cursor-not-allowed opacity-35",
                isBlocked && "bg-destructive/15 text-destructive line-through",
                inSpan && "bg-primary text-primary-foreground",
                !isBlocked && !inSpan && !disabled && "text-foreground hover:bg-muted",
              )}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-primary">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}
export const inputCls =
  "w-full rounded-2xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-gold/40";
export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-40";
export const btnGold =
  "inline-flex items-center justify-center gap-2 rounded-full bg-gold px-6 py-3 font-semibold text-primary shadow-gold transition hover:opacity-90 disabled:opacity-40";
export const btnGhost =
  "inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-6 py-3 font-medium text-primary transition hover:border-primary/40";
