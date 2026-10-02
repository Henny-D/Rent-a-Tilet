import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, Camera, Check, Lock } from "lucide-react";
import { actions, etb, fileToDataUrl, LENDER_SHARE, useStore, type Audit, type Booking } from "@/lib/store";
import { btnGhost, btnGold, btnPrimary, Card, Field, inputCls, SignaturePad } from "@/components/ui-kit";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/rental/$id")({
  head: () => ({
    meta: [
      { title: "Rental Handover & Return — Rent a Tilet" },
      { name: "description", content: "Track escrow, complete the handover checklist and return audit with digital signatures." },
      { property: "og:title", content: "Rental Handover & Return — Rent a Tilet" },
      { property: "og:description", content: "Condition checklist, meetup photos and dual signatures protect lenders and renters." },
    ],
  }),
  component: RentalPage,
});

const STAGES: { key: Booking["status"]; label: string }[] = [
  { key: "awaiting_payment", label: "Payment" },
  { key: "paid", label: "In escrow" },
  { key: "handed_over", label: "Handed over" },
  { key: "completed", label: "Returned & paid out" },
];
const CHECKS = [["hem", "Hem intact"], ["tilet", "Tilet embroidery intact"], ["stains", "Free of stains"], ["zipper", "Zipper & closures work"]] as const;

function RentalPage() {
  const { id } = Route.useParams();
  const b = useStore((s) => s.bookings.find((x) => x.id === id));
  const d = useStore((s) => s.dresses.find((x) => x.id === b?.dressId));
  const [ref, setRef] = useState("");
  if (!b || !d) return <div className="p-10 text-center text-muted-foreground">Rental not found. <Link to="/dashboard" className="underline">Dashboard</Link></div>;
  const idx = STAGES.findIndex((s) => s.key === b.status);
  const end = new Date(b.startDate + "T00:00");
  end.setDate(end.getDate() + 3);

  return (
    <main className="mx-auto max-w-3xl px-5 pb-40 pt-8">
      <div className="flex gap-4">
        <img src={d.photos[0]} alt="" className="h-28 w-20 rounded-2xl object-cover" />
        <div>
          <div className="eyebrow">Rental #{b.id}</div>
          <h1 className="font-serif text-3xl text-primary">{d.title}</h1>
          <p className="text-sm text-muted-foreground">{b.startDate} → {end.toISOString().slice(0, 10)} · {etb(b.fee + b.deposit)} via {b.method}</p>
        </div>
      </div>

      {b.status === "disputed" ? (
        <div className="mt-6 flex gap-3 rounded-[1.5rem] border border-destructive/40 bg-destructive/10 p-5 text-destructive">
          <Lock className="h-5 w-5 shrink-0" />
          <div><div className="font-semibold">Escrow frozen — in mediation</div><p className="text-sm">A party chose "Do Not Confirm". Funds are held until our team reviews the checklist, photos and signatures. We'll contact both parties on Telegram within 24 hours.</p></div>
        </div>
      ) : (
        <ol className="mt-8 grid grid-cols-4 gap-2">
          {STAGES.map((s, i) => (
            <li key={s.key} className="text-center">
              <div className={cn("mx-auto grid h-10 w-10 place-items-center rounded-full", i < idx || b.status === "completed" ? "bg-primary text-primary-foreground" : i === idx ? "bg-gold text-primary" : "border border-border bg-card text-muted-foreground")}>
                {i < idx || b.status === "completed" ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <div className="mt-2 text-xs">{s.label}</div>
            </li>
          ))}
        </ol>
      )}

      {b.status === "awaiting_payment" && (
        <Card className="mt-8">
          <h2 className="font-serif text-2xl text-primary">Complete your payment</h2>
          <p className="mt-2 text-sm text-muted-foreground">Send {etb(b.fee + b.deposit)} via {b.method} to {b.method === "Telebirr" ? "0911 000 000" : "account 1000 0000 00000"}, then enter the reference.</p>
          <div className="mt-4 flex gap-2">
            <input className={inputCls} value={ref} maxLength={30} onChange={(e) => setRef(e.target.value)} placeholder="Transaction reference" />
            <button className={btnPrimary} disabled={!/^[A-Za-z0-9-]{4,30}$/.test(ref.trim())} onClick={() => actions.updateBooking(b.id, { payRef: ref.trim(), status: "paid" })}>Confirm</button>
          </div>
        </Card>
      )}

      {b.status === "paid" && (
        <AuditForm
          title="Handover audit"
          subtitle="At the meetup, inspect the dress together. Both sign to confirm the exchange."
          onDone={(a) => actions.updateBooking(b.id, a.outcome === "confirmed" ? { handover: a, status: "handed_over" } : { handover: a, status: "disputed" })}
        />
      )}
      {b.status === "handed_over" && (
        <AuditForm
          title="Return audit"
          subtitle="Lender inspects the returned dress. Confirming releases the payout and refunds the deposit within 24 hours."
          onDone={(a) => actions.updateBooking(b.id, a.outcome === "confirmed" ? { ret: a, status: "completed" } : { ret: a, status: "disputed" })}
        />
      )}
      {b.status === "completed" && (
        <Card className="mt-8">
          <h2 className="font-serif text-2xl text-primary">All done 🎉</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><dt>Lender payout ({LENDER_SHARE * 100}%)</dt><dd className="font-semibold text-primary">{etb(b.fee * LENDER_SHARE)}</dd></div>
            <div className="flex justify-between"><dt>Deposit refunded to renter</dt><dd className="font-semibold text-primary">{etb(b.deposit)}</dd></div>
          </dl>
        </Card>
      )}
      {(b.handover || b.ret) && <AuditSummary b={b} />}
    </main>
  );
}

function AuditForm({ title, subtitle, onDone }: { title: string; subtitle: string; onDone: (a: Audit) => void }) {
  const [a, setA] = useState<Audit>({ checklist: {}, notes: "" });
  const [err, setErr] = useState("");
  const allChecked = CHECKS.every(([k]) => a.checklist[k]);
  const anyIssue = CHECKS.some(([k]) => a.checklist[k] === "issue");
  const ready = allChecked && a.photo && a.lenderSig && a.renterSig;

  return (
    <Card className="mt-8 space-y-6">
      <div><h2 className="font-serif text-2xl text-primary">{title}</h2><p className="text-sm text-muted-foreground">{subtitle}</p></div>
      <div className="space-y-2">
        {CHECKS.map(([k, label]) => (
          <div key={k} className="flex items-center justify-between rounded-2xl border border-border p-3">
            <span>{label}</span>
            <div className="flex gap-2">
              {(["ok", "issue"] as const).map((v) => (
                <button key={v} onClick={() => setA({ ...a, checklist: { ...a.checklist, [k]: v } })}
                  className={cn("rounded-full border px-4 py-1.5 text-sm", a.checklist[k] === v ? (v === "ok" ? "border-primary bg-primary text-primary-foreground" : "border-destructive bg-destructive text-destructive-foreground") : "border-border")}>
                  {v === "ok" ? "Good" : "Issue"}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <Field label="Notes"><textarea className={inputCls} rows={2} maxLength={500} value={a.notes} onChange={(e) => setA({ ...a, notes: e.target.value })} placeholder="Any marks, loose threads…" /></Field>
      <div>
        <div className="mb-2 text-sm font-medium text-primary">Meetup photo</div>
        <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-gold p-4">
          {a.photo ? <img src={a.photo} alt="Meetup" className="h-20 w-16 rounded-xl object-cover" /> : <Camera className="h-6 w-6 text-primary" />}
          <span className="text-sm">{a.photo ? "Replace photo" : "Upload a photo of the dress at handover"}</span>
          <input type="file" accept="image/*" capture="environment" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) setA({ ...a, photo: await fileToDataUrl(f) }); }} />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <SignaturePad label="Lender signature" value={a.lenderSig} onChange={(v) => setA((x) => ({ ...x, lenderSig: v }))} />
        <SignaturePad label="Renter signature" value={a.renterSig} onChange={(v) => setA((x) => ({ ...x, renterSig: v }))} />
      </div>
      {anyIssue && <p className="flex items-center gap-2 text-sm text-destructive"><AlertTriangle className="h-4 w-4" />Issues flagged — consider "Do Not Confirm" to open mediation.</p>}
      {err && <p className="text-sm text-destructive">{err}</p>}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button className={cn(btnGold, "flex-1")} onClick={() => (ready ? onDone({ ...a, outcome: "confirmed" }) : setErr("Complete every checklist item, add a photo, and collect both signatures."))}>Confirm & sign</button>
        <button className={cn(btnGhost, "flex-1 border-destructive text-destructive")} onClick={() => onDone({ ...a, outcome: "disputed" })}>Do Not Confirm</button>
      </div>
    </Card>
  );
}

function AuditSummary({ b }: { b: Booking }) {
  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2">
      {([["Handover", b.handover], ["Return", b.ret]] as const).map(([k, a]) => a && (
        <Card key={k} className="p-5">
          <div className="eyebrow">{k} record · {a.outcome}</div>
          <ul className="mt-2 text-sm">{CHECKS.map(([c, l]) => <li key={c}>{a.checklist[c] === "ok" ? "✓" : a.checklist[c] === "issue" ? "✗" : "–"} {l}</li>)}</ul>
          <div className="mt-3 flex gap-2">
            {a.photo && <img src={a.photo} alt="" className="h-16 w-12 rounded-lg object-cover" />}
            {a.lenderSig && <img src={a.lenderSig} alt="Lender signature" className="h-16 flex-1 rounded-lg bg-background object-contain" />}
            {a.renterSig && <img src={a.renterSig} alt="Renter signature" className="h-16 flex-1 rounded-lg bg-background object-contain" />}
          </div>
        </Card>
      ))}
    </div>
  );
}
