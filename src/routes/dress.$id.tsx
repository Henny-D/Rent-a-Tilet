import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Heart, MapPin, ShieldCheck, Star } from "lucide-react";
import { actions, etb, RENTAL_DAYS, useStore } from "@/lib/store";
import { btnGold, Card, Field, inputCls, MonthCalendar } from "@/components/ui-kit";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dress/$id")({
  head: () => ({
    meta: [
      { title: "Dress Details & Booking — Rent a Tilet" },
      { name: "description", content: "See photos, measurements, rental fee and refundable deposit, then book with escrow protection." },
      { property: "og:title", content: "Dress Details & Booking — Rent a Tilet" },
      { property: "og:description", content: "Book a 4-day dress rental with manual escrow via Telebirr or CBE Birr." },
    ],
  }),
  component: DressPage,
  notFoundComponent: () => <div className="p-10 text-center">Dress not found. <Link to="/browse" className="underline">Browse</Link></div>,
});

function DressPage() {
  const { id } = Route.useParams();
  const d = useStore((s) => s.dresses.find((x) => x.id === id));
  const fav = useStore((s) => s.favorites.includes(id));
  const ready = useStore((s) => s.ready);
  const user = useStore((s) => s.user);
  const nav = useNavigate();
  const [img, setImg] = useState(0);
  const [start, setStart] = useState<string>();
  const [method, setMethod] = useState<"Telebirr" | "CBE Birr">("Telebirr");
  const [ref, setRef] = useState("");
  const [err, setErr] = useState("");
  if (!d) {
    if (!ready) return <div className="p-10 text-center text-muted-foreground">Loading…</div>;
    return <div className="p-10 text-center text-muted-foreground">Dress not found. <Link to="/browse" className="underline">Browse dresses</Link></div>;
  }
  const total = d.fee + d.deposit;

  async function book() {
    if (!user) return nav({ to: "/auth" });
    if (!start) return setErr("Pick a start date.");
    if (ref && !/^[A-Za-z0-9-]{4,30}$/.test(ref.trim())) return setErr("Transaction reference should be 4–30 letters/numbers.");
    const bid = await actions.addBooking({ dressId: d!.id, startDate: start, method, payRef: ref.trim() });
    nav({ to: "/rental/$id", params: { id: bid } });
  }

  return (
    <main className="mx-auto max-w-6xl px-5 pb-40 pt-6">
      <Link to="/browse" className="inline-flex items-center gap-2 text-sm text-primary"><ArrowLeft className="h-4 w-4" /> Back to browse</Link>
      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div>
          <div className="relative overflow-hidden rounded-[1.75rem]">
            <img src={d.photos[img]} alt={d.title} className="aspect-[3/4] w-full object-cover" />
            <button onClick={() => actions.toggleFav(d.id)} aria-label="Save" className="absolute right-4 top-4 grid h-12 w-12 place-items-center rounded-full bg-card">
              <Heart className={cn("h-5 w-5 text-primary", fav && "fill-destructive text-destructive")} />
            </button>
          </div>
          {d.photos.length > 1 && (
            <div className="mt-3 flex gap-2">
              {d.photos.map((p, i) => (
                <button key={i} onClick={() => setImg(i)} className={cn("w-16 overflow-hidden rounded-xl border-2", i === img ? "border-gold" : "border-transparent")}>
                  <img src={p} alt="" className="aspect-[3/4] object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <div className="eyebrow">{d.category} · {d.tilet} tilet</div>
            <h1 className="font-serif text-4xl text-primary">{d.title}</h1>
            <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="h-4 w-4 text-gold" />{d.neighborhood} · {d.distanceKm} km</span>
              <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-gold text-gold" />{d.rating ? d.rating.toFixed(1) : "New"}</span>
              <span className="flex items-center gap-1"><ShieldCheck className="h-4 w-4 text-gold" />Verified lender · contact shared after booking</span>
            </div>
            {d.description && <p className="mt-4 text-foreground/80">{d.description}</p>}
          </div>

          <div className="grid grid-cols-5 gap-2 text-center">
            {[["Size", d.size], ["Bust", d.bust], ["Waist", d.waist], ["Hip", d.hip || "—"], ["Length", d.length]].map(([k, v]) => (
              <div key={k} className="rounded-2xl border border-border bg-card p-3"><div className="text-xs text-muted-foreground">{k}</div><div className="font-semibold text-primary">{v}{k !== "Size" && v !== "—" ? "cm" : ""}</div></div>
            ))}
          </div>

          <Card>
            <div className="eyebrow">Choose your {RENTAL_DAYS} days</div>
            <div className="mt-3"><MonthCalendar mode="pick" blocked={d.blocked} selected={start} onPick={setStart} /></div>
          </Card>

          <Card>
            <div className="flex items-center justify-between"><div className="eyebrow">Price breakdown</div><ShieldCheck className="h-5 w-5 text-gold" /></div>
            <dl className="mt-4 space-y-2">
              <div className="flex justify-between"><dt>Rental fee · {RENTAL_DAYS} days</dt><dd className="font-medium">{etb(d.fee)}</dd></div>
              <div className="flex justify-between"><dt>Refundable security deposit</dt><dd className="font-medium">{etb(d.deposit)}</dd></div>
              <div className="flex justify-between border-t border-border pt-2 text-lg"><dt className="font-serif text-primary">Total to escrow</dt><dd className="font-semibold text-primary">{etb(total)}</dd></div>
            </dl>
            {d.retail > 0 && <p className="mt-2 text-sm text-muted-foreground">Retail price {etb(d.retail)} — you save {etb(d.retail - d.fee)}.</p>}

            <div className="mt-6 eyebrow">Manual escrow payment</div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {(["Telebirr", "CBE Birr"] as const).map((m) => (
                <button key={m} onClick={() => setMethod(m)} className={cn("rounded-2xl border p-3 text-left", method === m ? "border-primary bg-success" : "border-border")}>
                  <div className="font-medium text-primary">{m}</div>
                </button>
              ))}
            </div>
            <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm text-foreground/80">
              {method === "Telebirr" ? (
                <><li>Open Telebirr → Send Money.</li><li>Send <b>{etb(total)}</b> to <b>0911 036 221</b> (Henok).</li></>
              ) : (
                <><li>Open CBE Birr → Transfer.</li><li>Send <b>{etb(total)}</b> to account <b>1000 4363 87869</b> (Henok).</li></>
              )}
              <li>Paste the transaction reference below. Funds stay in escrow until the dress is returned.</li>
            </ol>
            <div className="mt-4"><Field label="Transaction reference (optional now)"><input className={inputCls} value={ref} maxLength={30} onChange={(e) => setRef(e.target.value)} placeholder="e.g. TBR8X2K91" /></Field></div>
            {err && <p className="mt-3 text-sm text-destructive">{err}</p>}
            <button className={cn(btnGold, "mt-5 w-full")} onClick={book} disabled={d.mine}>{d.mine ? "This is your listing" : !user ? "Sign in to book" : "Submit booking request"}</button>
          </Card>
        </div>
      </div>
    </main>
  );
}
