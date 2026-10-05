import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Clock, CreditCard, PackageCheck, ShieldCheck, Trash2 } from "lucide-react";
import { actions, etb, LENDER_SHARE, PLATFORM_FEE, useStore } from "@/lib/store";
import { Card, DressCard, Pill, btnGold, RequireAuth } from "@/components/ui-kit";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard & Payouts — Rent a Tilet" },
      { name: "description", content: "Track your listings, rentals, earnings, pending payouts and deposit refunds." },
      { property: "og:title", content: "Dashboard & Payouts — Rent a Tilet" },
      { property: "og:description", content: "Your lender earnings and rental activity in one place." },
    ],
  }),
  component: () => <RequireAuth what="see your dashboard"><Dashboard /></RequireAuth>,
});

const TABS = ["My Listings", "My Rentals", "Saved Dresses", "Transaction History"] as const;
const LABEL: Record<string, string> = { awaiting_payment: "Awaiting payment", paid: "In escrow", handed_over: "With renter", completed: "Completed", disputed: "In mediation" };

function Dashboard() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("My Listings");
  const dresses = useStore((s) => s.dresses);
  const all = useStore((s) => s.bookings);
  const favorites = useStore((s) => s.favorites);
  const uid = useStore((s) => s.user?.id);
  const isAdmin = useStore((s) => s.isAdmin);
  const bookings = all.filter((b) => b.renterId === uid);
  const lent = all.filter((b) => b.lenderId === uid);
  const mine = dresses.filter((d) => d.mine);
  const byId = Object.fromEntries(dresses.map((d) => [d.id, d]));
  const done = lent.filter((b) => b.status === "completed");
  const active = lent.filter((b) => b.status === "paid" || b.status === "handed_over");
  const earned = done.reduce((s, b) => s + b.fee * LENDER_SHARE, 0);
  const pending = active.reduce((s, b) => s + b.fee * LENDER_SHARE, 0);
  const latest = bookings[0];
  const refundStage = !latest ? -1 : latest.status === "completed" ? 2 : latest.status === "awaiting_payment" ? 0 : 1;
  const hour = new Date().getHours();

  return (
    <main className="mx-auto max-w-6xl px-5 pb-40 pt-8">
      <h1 className="font-serif text-5xl text-primary">Good {hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening"}</h1>
      <p className="mt-2 text-muted-foreground">Keep track of your rentals, listings, and earnings. {isAdmin && <Link to="/admin" className="font-medium text-primary underline">Operator console</Link>}</p>

      <div className="-mx-5 mt-8 flex gap-3 overflow-x-auto px-5">{TABS.map((t) => <Pill key={t} active={tab === t} onClick={() => setTab(t)}>{t}</Pill>)}</div>

      <div className="mt-8">
        {tab === "My Listings" && (mine.length ? (
          <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            {mine.map((d) => (
              <div key={d.id} className="relative">
                <DressCard d={d} />
                <button onClick={() => confirm("Remove this listing?") && actions.removeDress(d.id)} className="mt-2 inline-flex items-center gap-1 px-1 text-sm text-destructive"><Trash2 className="h-4 w-4" />Remove</button>
              </div>
            ))}
          </div>
        ) : <Empty title="My Listings" cta />)}
        {tab === "My Rentals" && (bookings.length ? (
          <div className="space-y-3">
            {bookings.map((b) => (
              <Link key={b.id} to="/rental/$id" params={{ id: b.id }} className="flex items-center gap-4 rounded-[1.5rem] border border-border bg-card p-4 shadow-soft">
                <img src={byId[b.dressId]?.photos[0]} alt="" className="h-16 w-12 rounded-xl object-cover" />
                <div className="flex-1"><div className="text-primary">{byId[b.dressId]?.title ?? "Dress"}</div><div className="text-sm text-muted-foreground">{b.startDate} · {etb(b.fee + b.deposit)}</div></div>
                <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", b.status === "disputed" ? "bg-destructive/15 text-destructive" : b.status === "completed" ? "bg-success text-primary" : "bg-gold/20 text-primary")}>{LABEL[b.status]}</span>
              </Link>
            ))}
          </div>
        ) : <Empty title="My Rentals" />)}
        {tab === "Saved Dresses" && (favorites.length ? (
          <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">{favorites.map((f) => byId[f] && <DressCard key={f} d={byId[f]} />)}</div>
        ) : <Empty title="Saved Dresses" />)}
        {tab === "Transaction History" && (bookings.length ? (
          <Card className="p-0">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground"><tr><th className="p-4">Date</th><th>Dress</th><th>Method</th><th>Ref</th><th className="pr-4 text-right">Amount</th></tr></thead>
              <tbody>{bookings.map((b) => (
                <tr key={b.id} className="border-t border-border"><td className="p-4">{b.createdAt.slice(0, 10)}</td><td>{byId[b.dressId]?.title}</td><td>{b.method}</td><td>{b.payRef || "—"}</td><td className="pr-4 text-right font-medium">{etb(b.fee + b.deposit)}</td></tr>
              ))}</tbody>
            </table>
          </Card>
        ) : <Empty title="Transaction History" />)}
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        <Card><div className="flex justify-between"><div className="eyebrow">Total earned</div><CreditCard className="h-6 w-6 text-gold" /></div><div className="mt-4 font-serif text-4xl text-primary">{etb(earned)}</div><p className="text-sm text-muted-foreground">Your {LENDER_SHARE * 100}% share after platform fees</p></Card>
        <Card><div className="flex justify-between"><div className="eyebrow">Pending payouts</div><Clock className="h-6 w-6 text-gold" /></div><div className="mt-4 font-serif text-4xl text-primary">{etb(pending)}</div><p className="text-sm text-muted-foreground">Releases after return</p></Card>
        <Card>
          <div className="eyebrow">Refund status</div>
          <div className="mt-4 flex items-center">
            <Dot on={refundStage >= 1} done={refundStage >= 1} />
            <div className="h-px flex-1 bg-gold" />
            <Dot on={refundStage >= 1} done={refundStage >= 2} />
          </div>
          <div className="mt-2 flex justify-between text-sm text-muted-foreground"><span>Paid</span><span>{refundStage >= 2 ? "Refunded" : "Processing"}</span></div>
          <div className="mt-3 font-medium text-primary">{refundStage < 0 ? "No deposits yet" : refundStage === 0 ? "Awaiting payment" : refundStage === 1 ? "Deposit refund in progress" : "Deposit refunded"}</div>
        </Card>
      </div>

      <Card className="mt-5">
        <div className="flex justify-between"><div className="eyebrow">Lender payout example</div><ShieldCheck className="h-6 w-6 text-gold" /></div>
        <h2 className="mt-2 font-serif text-3xl text-primary">Know your split</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-background p-4"><div className="text-sm text-muted-foreground">Renter pays</div><div className="font-semibold text-primary">ETB 3,000</div></div>
          <div className="rounded-2xl bg-background p-4"><div className="text-sm text-muted-foreground">Platform fee · {PLATFORM_FEE * 100}%</div><div className="font-semibold text-destructive">− {etb(3000 * PLATFORM_FEE)}</div></div>
          <div className="rounded-2xl bg-success p-4"><div className="text-sm text-muted-foreground">Your payout · {LENDER_SHARE * 100}%</div><div className="font-semibold text-primary">{etb(3000 * LENDER_SHARE)}</div></div>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">The ETB 10,000 security deposit is held separately and returned to the renter after a successful inspection. It is not part of your rental earnings.</p>
      </Card>
    </main>
  );
}

function Dot({ on, done }: { on: boolean; done: boolean }) {
  return <span className={cn("grid h-11 w-11 place-items-center rounded-full", done ? "bg-primary text-primary-foreground" : on ? "bg-gold text-primary" : "border border-border")}>{done ? <Check className="h-5 w-5" /> : <Clock className="h-5 w-5" />}</span>;
}

function Empty({ title, cta }: { title: string; cta?: boolean }) {
  return (
    <Card className="py-14 text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-muted"><PackageCheck className="h-7 w-7 text-primary" /></div>
      <h3 className="mt-5 font-serif text-3xl text-primary">{title}</h3>
      <p className="mt-2 text-muted-foreground">Your {title.toLowerCase()} will appear here as you start using Rent a Tilet.</p>
      {cta && <Link to="/list" className={cn(btnGold, "mt-6")}>List your first dress</Link>}
    </Card>
  );
}
