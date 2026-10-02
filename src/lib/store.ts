import { useSyncExternalStore } from "react";
import d1 from "@/assets/dress1.jpg";
import d2 from "@/assets/dress2.jpg";
import d3 from "@/assets/dress3.jpg";
import d4 from "@/assets/dress4.jpg";

export const CATEGORIES = ["Habesha Kemis", "Cocktail", "Wedding Guest", "Formal", "Party"] as const;
export type Category = (typeof CATEGORIES)[number];
export const TILET_STYLES = ["Gold Menen", "Shema Classic", "Tibeb Geometric", "Axum Cross", "Floral Tilet", "None"];
export const NEIGHBORHOODS = [
  { name: "Bole", km: 2.3 },
  { name: "Kazanchis", km: 3.1 },
  { name: "Piassa", km: 5.4 },
  { name: "CMC", km: 6.8 },
  { name: "Sarbet", km: 4.2 },
  { name: "Megenagna", km: 3.7 },
  { name: "Old Airport", km: 4.9 },
];
export const LENDER_SHARE = 0.75;
export const PLATFORM_FEE = 0.25;
export const RENTAL_DAYS = 4;

export type Dress = {
  id: string;
  title: string;
  category: Category;
  tilet: string;
  neighborhood: string;
  distanceKm: number;
  fee: number;
  retail: number;
  deposit: number;
  rating: number;
  photos: string[];
  size: string;
  bust: string;
  waist: string;
  hip: string;
  length: string;
  description: string;
  blocked: string[];
  lender: string;
  mine?: boolean;
  status: "review" | "live";
};

export type Audit = {
  checklist: Record<string, "ok" | "issue">;
  notes: string;
  photo?: string;
  lenderSig?: string;
  renterSig?: string;
  outcome?: "confirmed" | "disputed";
};

export type BookingStatus =
  | "awaiting_payment"
  | "paid"
  | "handed_over"
  | "completed"
  | "disputed";

export type Booking = {
  id: string;
  dressId: string;
  startDate: string;
  fee: number;
  deposit: number;
  method: "Telebirr" | "CBE Birr";
  payRef: string;
  status: BookingStatus;
  createdAt: string;
  handover?: Audit;
  ret?: Audit;
};

const seed: Dress[] = [
  { id: "saba", title: "Saba Gold Kemis", category: "Habesha Kemis", tilet: "Gold Menen", neighborhood: "Bole", distanceKm: 0.8, fee: 3000, retail: 22000, deposit: 10000, rating: 4.9, photos: [d1], size: "M", bust: "88", waist: "70", hip: "96", length: "150", description: "Hand-woven shemma cotton with gold menen tilet. Worn once for a melse.", blocked: [], lender: "Meron T.", status: "live" },
  { id: "zahra", title: "Zahra Emerald Set", category: "Wedding Guest", tilet: "Tibeb Geometric", neighborhood: "Kazanchis", distanceKm: 1.2, fee: 2500, retail: 18000, deposit: 8000, rating: 4.8, photos: [d2], size: "S", bust: "84", waist: "66", hip: "92", length: "148", description: "Emerald green with geometric gold tibeb, includes netela.", blocked: [], lender: "Liya A.", status: "live" },
  { id: "liya", title: "Liya Evening Dress", category: "Cocktail", tilet: "None", neighborhood: "Bole", distanceKm: 1.7, fee: 2200, retail: 14000, deposit: 6000, rating: 5.0, photos: [d3], size: "M", bust: "90", waist: "72", hip: "98", length: "110", description: "Burgundy pleated chiffon, knee length. Perfect for evening parties.", blocked: [], lender: "Hiwot G.", status: "live" },
  { id: "selam", title: "Selam Formal Teal", category: "Formal", tilet: "Axum Cross", neighborhood: "Sarbet", distanceKm: 2.1, fee: 3500, retail: 26000, deposit: 12000, rating: 4.7, photos: [d4], size: "L", bust: "96", waist: "78", hip: "104", length: "152", description: "Teal silk-cotton blend with Axum cross tilet panel.", blocked: [], lender: "Selam K.", status: "live" },
];

type State = { dresses: Dress[]; favorites: string[]; bookings: Booking[] };
let state: State = { dresses: seed, favorites: [], bookings: [] };
const listeners = new Set<() => void>();
const KEY = "rent-a-tilet-v1";
let hydrated = false;

function persist() {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({ mine: state.dresses.filter((d) => d.mine), favorites: state.favorites, bookings: state.bookings }),
    );
  } catch (e) {
    console.warn("Could not save", e);
  }
}
function set(fn: (s: State) => State) {
  state = fn(state);
  persist();
  listeners.forEach((l) => l());
}
export function hydrateStore() {
  if (hydrated) return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw);
      state = { dresses: [...(p.mine ?? []), ...seed], favorites: p.favorites ?? [], bookings: p.bookings ?? [] };
      listeners.forEach((l) => l());
    }
  } catch {
    /* ignore */
  }
}
const serverState = state;
export function useStore<T>(sel: (s: State) => T): T {
  return useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => sel(state),
    () => sel(serverState),
  );
}
export const uid = () => Math.random().toString(36).slice(2, 9);
export const actions = {
  toggleFav: (id: string) =>
    set((s) => ({ ...s, favorites: s.favorites.includes(id) ? s.favorites.filter((f) => f !== id) : [...s.favorites, id] })),
  addDress: (d: Dress) => set((s) => ({ ...s, dresses: [d, ...s.dresses] })),
  removeDress: (id: string) => set((s) => ({ ...s, dresses: s.dresses.filter((d) => d.id !== id) })),
  addBooking: (b: Booking) => set((s) => ({ ...s, bookings: [b, ...s.bookings] })),
  updateBooking: (id: string, patch: Partial<Booking>) =>
    set((s) => ({ ...s, bookings: s.bookings.map((b) => (b.id === id ? { ...b, ...patch } : b)) })),
};

export const etb = (n: number) => `ETB ${Math.round(n).toLocaleString("en-US")}`;

export async function fileToDataUrl(file: File, max = 900): Promise<string> {
  const url = URL.createObjectURL(file);
  const img = new Image();
  await new Promise((r, j) => ((img.onload = r), (img.onerror = j), (img.src = url)));
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = img.width * scale;
  c.height = img.height * scale;
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  URL.revokeObjectURL(url);
  return c.toDataURL("image/jpeg", 0.8);
}

export const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
