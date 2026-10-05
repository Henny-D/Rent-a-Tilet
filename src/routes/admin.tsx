import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Camera, Sparkles, X } from "lucide-react";
import { actions, etb, fileToDataUrl, LENDER_SHARE, PLATFORM_FEE, useStore, type Booking } from "@/lib/store";
import { Card, Pill, btnPrimary, btnGhost, btnGold, inputCls, RequireAuth } from "@/components/ui-kit";
import { cn } from "@/lib/utils";
import { analyzeDispute, type DisputeAnalysis } from "@/lib/dispute-ai.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Operator Console — Rent a Tilet" },
      { name: "description", content: "Approve listings, verify transfers, release payouts and refunds, mediate disputes." },
      { property: "og:title", content: "Operator Console — Rent a Tilet" },
      { property: "og:description", content: "Marketplace operations and analytics for Rent a Tilet." },
    ],
  }),
  component: () => <RequireAuth what="open the operator console" admin><Admin /></RequireAuth>,
});

const TABS = ["Analytics", "Listing approvals", "Transfer verification", "Lender payouts", "Deposit refunds", "Disputes"] as const;

function Admin() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Analytics");
  const dresses = useStore((s) => s.dresses);
  const bookings = useStore((s) => s.bookings);
  const people = useStore((s) => s.people);
  const byId = Object.fromEntries(dresses.map((d) => [d.id, d]));
  const review = dresses.filter((d) => d.status === "review");
  const toVerify = bookings.filter((b) => b.status !== "awaiting_payment" && b.payRef && !b.payVerified);
  const payouts = bookings.filter((b) => b.status === "completed" && !b.payoutDone);
  const refunds = bookings.filter((b) => b.status === "completed" && !b.refundDone);
  const disputes = bookings.filter((b) => b.status === "disputed");
  const paidB = bookings.filter((b) => b.payVerified);
  const gmv = paidB.reduce((s, b) => s + b.fee, 0);
  const counts: Record<string, number> = { "Listing approvals": review.length, "Transfer verification": toVerify.length, "Lender payouts": payouts.length, "Deposit refunds": refunds.length, Disputes: disputes.length };

  const row = (b: Booking, right: ReactNode, extra?: ReactNode) => (
    <Card key={b.id} className="flex flex-wrap items-center gap-4">
      <img src={byId[b.dressId]?.photos[0]} alt="" className="h-16 w-12 rounded-xl object-cover" />
      <div className="min-w-0 flex-1">
        <Link to="/rental/$id" params={{ id: b.id }} className="text-primary underline-offset-2 hover:underline">{byId[b.dressId]?.title ?? "Dress"}</Link>
        <div className="text-sm text-muted-foreground">Renter {people[b.renterId]?.full_name || "—"} {people[b.renterId]?.phone} · Lender {b.lenderId ? people[b.lenderId]?.full_name || "—" : byId[b.dressId]?.lender}</div>
        <div className="text-sm text-muted-foreground">#{b.id} · {b.startDate} · {b.method} {b.payRef && `· Ref ${b.payRef}`}</div>
        {extra}
      </div>
      <div className="flex flex-wrap gap-2">{right}</div>
    </Card>
  );
  const empty = (t: string) => <Card className="py-12 text-center text-muted-foreground">{t}</Card>;

  return (
    <main className="mx-auto max-w-6xl px-5 pb-40 pt-8">
      <div className="eyebrow">Operator</div>
      <h1 className="font-serif text-5xl text-primary">Marketplace console</h1>
      <div className="-mx-5 mt-8 flex gap-3 overflow-x-auto px-5">
        {TABS.map((t) => <Pill key={t} active={tab === t} onClick={() => setTab(t)}>{t}{counts[t] ? ` (${counts[t]})` : ""}</Pill>)}
      </div>
      <div className="mt-8 space-y-3">
        {tab === "Analytics" && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Live listings" v={String(dresses.filter((d) => d.status === "live").length)} />
            <Stat label="Bookings" v={String(bookings.length)} />
            <Stat label="Verified rental volume" v={etb(gmv)} />
            <Stat label={`Platform revenue (${PLATFORM_FEE * 100}%)`} v={etb(gmv * PLATFORM_FEE)} />
            <Stat label="Deposits held" v={etb(paidB.filter((b) => !b.refundDone).reduce((s, b) => s + b.deposit, 0))} />
            <Stat label="Payouts owed" v={etb(payouts.reduce((s, b) => s + b.fee * LENDER_SHARE, 0))} />
            <Stat label="Open disputes" v={String(disputes.length)} />
            <Stat label="Dispute rate" v={bookings.length ? `${Math.round((disputes.length / bookings.length) * 100)}%` : "0%"} />
          </div>
        )}
        {tab === "Listing approvals" && (review.length ? review.map((d) => (
          <Card key={d.id} className="flex flex-wrap items-center gap-4">
            <img src={d.photos[0]} alt="" className="h-20 w-16 rounded-xl object-cover" />
            <div className="min-w-0 flex-1">
              <Link to="/dress/$id" params={{ id: d.id }} className="text-primary hover:underline">{d.title}</Link>
              <div className="text-sm text-muted-foreground">{d.category} · {d.neighborhood} · {d.photos.length} photos · {etb(d.fee)} / deposit {etb(d.deposit)}</div>
            </div>
            <button className={btnPrimary} onClick={() => actions.setDressStatus(d.id, "live")}>Approve</button>
            <button className={btnGhost} onClick={() => actions.setDressStatus(d.id, "rejected")}>Reject</button>
          </Card>
        )) : empty("No listings waiting for review."))}
        {tab === "Transfer verification" && (toVerify.length ? toVerify.map((b) => row(b, <>
          <span className="self-center text-sm font-medium text-primary">{etb(b.fee + b.deposit)}</span>
          <button className={btnPrimary} onClick={() => actions.updateBooking(b.id, { payVerified: true })}>Mark received</button>
          <button className={btnGhost} onClick={() => confirm("Reject this payment reference?") && actions.updateBooking(b.id, { status: "awaiting_payment", payRef: "" })}>Reject</button>
        </>)) : empty("No transfers to verify."))}
        {tab === "Lender payouts" && (payouts.length ? payouts.map((b) => row(b, <>
          <span className="self-center text-sm font-medium text-primary">{etb(b.fee * LENDER_SHARE)} to {byId[b.dressId]?.lender}</span>
          <button className={btnPrimary} onClick={() => actions.updateBooking(b.id, { payoutDone: true })}>Mark paid out</button>
        </>)) : empty("No payouts due."))}
        {tab === "Deposit refunds" && (refunds.length ? refunds.map((b) => row(b, <>
          <span className="self-center text-sm font-medium text-primary">{etb(b.deposit)}</span>
          <button className={btnPrimary} onClick={() => actions.updateBooking(b.id, { refundDone: true })}>Mark refunded</button>
        </>)) : empty("No deposits to refund."))}
        {tab === "Disputes" && (disputes.length ? disputes.map((b) => <Dispute key={b.id} b={b} row={row} />) : empty("No open disputes."))}
      </div>
    </main>
  );
}

const CHECKS = [["hem", "Hem intact"], ["tilet", "Tilet embroidery intact"], ["stains", "Free of stains"], ["zipper", "Zipper & closures work"]] as const;

function Dispute({ b, row }: { b: Booking; row: (b: Booking, r: ReactNode, e?: ReactNode) => ReactNode }) {
  const dress = useStore((s) => s.dresses.find((d) => d.id === b.dressId));
  const analyze = useServerFn(analyzeDispute);
  const [note, setNote] = useState("");
  const [keep, setKeep] = useState("0");
  const [opCheck, setOpCheck] = useState<Record<string, "ok" | "issue">>({});
  const [opNotes, setOpNotes] = useState("");
  const [opPhotos, setOpPhotos] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [aiErr, setAiErr] = useState("");
  const [ai, setAi] = useState<DisputeAnalysis | null>(null);
  const audit = b.ret ?? b.handover;
  const issues = audit ? Object.entries(audit.checklist).filter(([, v]) => v === "issue").map(([k]) => k) : [];
  const amt = Math.max(0, Math.min(b.deposit, Number(keep) || 0));
  const resolve = () => actions.updateBooking(b.id, {
    status: "completed", refundDone: amt >= b.deposit, resolution: `${note.trim().slice(0, 300)} (lender kept ${etb(amt)} of deposit)`,
  });
  const run = async () => {
    setBusy(true); setAiErr("");
    const audits = [
      b.handover && { stage: "Handover record (signed by both parties)", checklist: b.handover.checklist, notes: b.handover.notes, photos: b.handover.photo ? [b.handover.photo] : [] },
      b.ret && { stage: "Return record", checklist: b.ret.checklist, notes: b.ret.notes, photos: b.ret.photo ? [b.ret.photo] : [] },
      { stage: "Operator findings", checklist: opCheck, notes: opNotes, photos: opPhotos },
    ].filter(Boolean) as { stage: string; checklist: Record<string, string>; notes: string; photos: string[] }[];
    try {
      const r = await analyze({ data: { dress: dress?.title ?? "Dress", fee: b.fee, deposit: b.deposit, audits } });
      if (r.ok) setAi(r.result); else setAiErr(r.error);
    } catch { setAiErr("Couldn't reach the AI. Please try again."); }
    setBusy(false);
  };
  return row(b, <button className={btnPrimary} disabled={!note.trim()} onClick={resolve}>Resolve & release</button>, (
    <div className="mt-3 space-y-3">
      <div className="text-sm">Flagged at {b.ret ? "return" : "handover"}: {issues.join(", ") || "no checklist issues"}{audit?.notes && ` — “${audit.notes}”`}</div>
      {audit?.photo && <img src={audit.photo} alt="Meetup" className="h-24 rounded-xl object-cover" />}

      <div className="space-y-2 rounded-2xl border border-border p-4">
        <div className="eyebrow">Operator evidence</div>
        {CHECKS.map(([k, label]) => (
          <div key={k} className="flex items-center justify-between text-sm">
            <span>{label}</span>
            <div className="flex gap-2">
              {(["ok", "issue"] as const).map((v) => (
                <button key={v} onClick={() => setOpCheck({ ...opCheck, [k]: v })}
                  className={cn("rounded-full border px-3 py-1 text-xs", opCheck[k] === v ? (v === "ok" ? "border-primary bg-primary text-primary-foreground" : "border-destructive bg-destructive text-destructive-foreground") : "border-border")}>
                  {v === "ok" ? "Good" : "Issue"}
                </button>
              ))}
            </div>
          </div>
        ))}
        <textarea className={inputCls} rows={2} maxLength={1000} placeholder="Operator notes (calls with both parties, observations…)" value={opNotes} onChange={(e) => setOpNotes(e.target.value)} />
        <div className="flex flex-wrap items-center gap-2">
          {opPhotos.map((p, i) => (
            <button key={i} onClick={() => setOpPhotos(opPhotos.filter((_, j) => j !== i))} className="relative" aria-label="Remove photo">
              <img src={p} alt="" className="h-16 w-12 rounded-lg object-cover" /><X className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-card" />
            </button>
          ))}
          {opPhotos.length < 4 && (
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-gold px-3 py-2 text-sm">
              <Camera className="h-4 w-4" />Add meetup photo
              <input type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) setOpPhotos([...opPhotos, await fileToDataUrl(f)]); e.target.value = ""; }} />
            </label>
          )}
        </div>
        <button className={btnGold} disabled={busy} onClick={run}>
          <Sparkles className="mr-1 inline h-4 w-4" />{busy ? "Reviewing evidence…" : "Summarize & suggest split"}
        </button>
        {aiErr && <p className="text-sm text-destructive">{aiErr}</p>}
        {ai && (
          <div className="space-y-2 rounded-xl bg-secondary/40 p-3 text-sm">
            <p>{ai.summary}</p>
            <p className="font-medium text-primary">Suggested: lender keeps {etb(ai.lenderKeeps)}, renter gets {etb(b.deposit - ai.lenderKeeps)} back.</p>
            <p className="text-muted-foreground">{ai.rationale}</p>
            <button className={btnGhost} onClick={() => { setKeep(String(ai.lenderKeeps)); if (!note.trim()) setNote(ai.rationale.slice(0, 300)); }}>Use suggestion</button>
            <p className="text-xs text-muted-foreground">AI suggestion only — the operator makes the final decision.</p>
          </div>
        )}
      </div>

      <input className={inputCls} placeholder="Mediation decision" value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} />
      <input className={inputCls} type="number" min={0} max={b.deposit} placeholder="Deposit amount awarded to lender" value={keep} onChange={(e) => setKeep(e.target.value)} />
    </div>
  ));
}

function Stat({ label, v }: { label: string; v: string }) {
  return <Card><div className="eyebrow">{label}</div><div className="mt-3 font-serif text-3xl text-primary">{v}</div></Card>;
}
