import { useSyncExternalStore } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
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
export const SUB_CITIES = ["Addis Ketema", "Akaky Kaliti", "Arada", "Bole", "Gullele", "Kirkos", "Kolfe Keranio", "Lideta", "Nifas Silk-Lafto", "Yeka", "Lemi Kura"];
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
  ownerId?: string | null;
  mine?: boolean;
  status: "review" | "live" | "rejected";
};

export type Audit = {
  checklist: Record<string, "ok" | "issue">;
  notes: string;
  photo?: string | undefined;
  lenderSig?: string | undefined;
  renterSig?: string | undefined;
  outcome?: "confirmed" | "disputed";
};

export type BookingStatus = "awaiting_payment" | "paid" | "handed_over" | "completed" | "disputed";

export type Booking = {
  id: string;
  dressId: string;
  renterId: string;
  lenderId: string | null;
  startDate: string;
  fee: number;
  deposit: number;
  method: "Telebirr" | "CBE Birr";
  payRef: string;
  status: BookingStatus;
  createdAt: string;
  handover?: Audit | undefined;
  ret?: Audit | undefined;
  payVerified?: boolean;
  payoutDone?: boolean;
  refundDone?: boolean;
  resolution?: string | undefined;
};

export type Profile = { id: string; full_name: string; phone: string; telegram: string; city: string; sub_city: string; neighborhood: string };

type State = {
  ready: boolean;
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  dresses: Dress[];
  favorites: string[];
  bookings: Booking[];
  people: Record<string, Profile>;
};
const empty: State = { ready: false, user: null, profile: null, isAdmin: false, dresses: [], favorites: [], bookings: [], people: {} };
let state: State = empty;
const listeners = new Set<() => void>();
function set(patch: Partial<State>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

const ASSETS: Record<string, string> = { "asset:dress1": d1, "asset:dress2": d2, "asset:dress3": d3, "asset:dress4": d4 };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toDress = (r: any, uid?: string): Dress => ({
  id: r.id, title: r.title, category: r.category, tilet: r.tilet, neighborhood: r.neighborhood, distanceKm: Number(r.distance_km),
  fee: r.fee, retail: r.retail, deposit: r.deposit, rating: Number(r.rating), photos: (r.photos as string[]).map((p) => ASSETS[p] ?? p),
  size: r.size, bust: r.bust, waist: r.waist, hip: r.hip, length: r.length, description: r.description, blocked: r.blocked,
  // Public rows come from dresses_public and carry no owner identity.
  lender: r.lender ?? "Verified lender", ownerId: r.owner_id ?? null, mine: !!uid && r.owner_id === uid, status: r.status,
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toBooking = (r: any): Booking => ({
  id: r.id, dressId: r.dress_id, renterId: r.renter_id, lenderId: r.lender_id, startDate: r.start_date, fee: r.fee, deposit: r.deposit,
  method: r.method, payRef: r.pay_ref, status: r.status, createdAt: r.created_at, handover: r.handover ?? undefined, ret: r.ret ?? undefined,
  payVerified: r.pay_verified, payoutDone: r.payout_done, refundDone: r.refund_done, resolution: r.resolution ?? undefined,
});

let loading: Promise<void> | null = null;
export function refresh() {
  if (loading) return loading;
  loading = (async () => {
    const { data: u } = await supabase.auth.getUser();
    const user = u.user ?? null;
    const uid = user?.id;
    const [dr, own, bk, fav, prof, role] = await Promise.all([
      // Public feed: safe view, no owner identity.
      supabase.from("dresses_public").select("*").order("created_at", { ascending: false }),
      // Owner's own listings (any status) — only for the signed-in owner.
      uid ? supabase.from("dresses").select("*").eq("owner_id", uid) : Promise.resolve({ data: [] }),
      uid ? supabase.from("bookings").select("*").order("created_at", { ascending: false }) : Promise.resolve({ data: [] }),
      uid ? supabase.from("favorites").select("dress_id") : Promise.resolve({ data: [] }),
      uid ? supabase.from("profiles").select("*") : Promise.resolve({ data: [] }),
      uid ? supabase.rpc("has_role", { _user_id: uid, _role: "admin" }) : Promise.resolve({ data: false }),
    ]);
    const people = Object.fromEntries(((prof.data ?? []) as Profile[]).map((p) => [p.id, p]));
    const byId = new Map<string, Dress>();
    for (const r of dr.data ?? []) byId.set(r.id, toDress(r, uid));
    for (const r of (own.data ?? []) as never[]) byId.set((r as { id: string }).id, toDress(r, uid));
    set({
      ready: true, user, isAdmin: !!role.data, profile: uid ? people[uid] ?? null : null, people,
      dresses: [...byId.values()],
      bookings: (bk.data ?? []).map(toBooking),
      favorites: ((fav.data ?? []) as { dress_id: string }[]).map((f) => f.dress_id),
    });
  })().finally(() => { loading = null; });
  return loading;
}

let hydrated = false;
export function hydrateStore() {
  if (hydrated) return;
  hydrated = true;
  void refresh();
  supabase.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") setTimeout(() => void refresh(), 0);
  });
  supabase
    .channel("marketplace")
    .on("postgres_changes", { event: "*", schema: "public", table: "dresses" }, () => void refresh())
    .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => void refresh())
    .subscribe();
  window.addEventListener("focus", () => void refresh());
}

export function useStore<T>(sel: (s: State) => T): T {
  return useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => sel(state),
    () => sel(empty),
  );
}

async function run(p: PromiseLike<{ error: { message: string } | null }>) {
  const { error } = await p;
  if (error) {
    alert(error.message);
    throw new Error(error.message);
  }
  await refresh();
}

const needUser = () => {
  const u = state.user;
  if (!u) throw new Error("Please sign in first.");
  return u.id;
};

export const actions = {
  toggleFav: async (id: string) => {
    if (!state.user) return void (window.location.href = "/auth");
    const uid = state.user.id;
    await run(state.favorites.includes(id)
      ? supabase.from("favorites").delete().eq("user_id", uid).eq("dress_id", id)
      : supabase.from("favorites").insert({ user_id: uid, dress_id: id }));
  },
  addDress: async (d: Omit<Dress, "id" | "status" | "rating" | "lender">) => {
    const uid = needUser();
    const { data, error } = await supabase.from("dresses").insert({
      owner_id: uid, title: d.title, category: d.category, tilet: d.tilet, neighborhood: d.neighborhood, distance_km: d.distanceKm,
      fee: d.fee, retail: d.retail, deposit: d.deposit, photos: d.photos, size: d.size, bust: d.bust, waist: d.waist, hip: d.hip,
      length: d.length, description: d.description, blocked: d.blocked, lender: "Verified lender", status: "review",
    }).select("id").single();
    if (error) { alert(error.message); throw error; }
    await refresh();
    return data.id as string;
  },
  removeDress: (id: string) => run(supabase.from("dresses").delete().eq("id", id)),
  setDressStatus: (id: string, status: Dress["status"]) => run(supabase.from("dresses").update({ status }).eq("id", id)),
  addBooking: async (b: { dressId: string; startDate: string; method: Booking["method"]; payRef: string }) => {
    const uid = needUser();
    const { data, error } = await supabase.from("bookings").insert({
      dress_id: b.dressId, renter_id: uid, start_date: b.startDate, method: b.method, pay_ref: b.payRef, fee: 0, deposit: 0,
    }).select("id").single();
    if (error) { alert(error.message); throw error; }
    await refresh();
    return data.id as string;
  },
  updateBooking: (id: string, patch: Partial<Booking>) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row: Record<string, any> = {};
    if (patch.status !== undefined) row["status"] = patch.status;
    if (patch.payRef !== undefined) row["pay_ref"] = patch.payRef;
    if (patch.handover !== undefined) row["handover"] = patch.handover;
    if (patch.ret !== undefined) row["ret"] = patch.ret;
    if (patch.payVerified !== undefined) row["pay_verified"] = patch.payVerified;
    if (patch.payoutDone !== undefined) row["payout_done"] = patch.payoutDone;
    if (patch.refundDone !== undefined) row["refund_done"] = patch.refundDone;
    if (patch.resolution !== undefined) row["resolution"] = patch.resolution;
    return run(supabase.from("bookings").update(row as never).eq("id", id));
  },
  signOut: async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  },
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
