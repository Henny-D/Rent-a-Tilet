import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Check, CloudUpload, Star, X, ShieldCheck } from "lucide-react";
import {
  actions, CATEGORIES, etb, fileToDataUrl, LENDER_SHARE, NEIGHBORHOODS, PLATFORM_FEE, TILET_STYLES, uid, type Category,
} from "@/lib/store";
import { btnGhost, btnGold, Card, Field, inputCls, MonthCalendar, Pill } from "@/components/ui-kit";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/list")({
  head: () => ({
    meta: [
      { title: "List a Dress — Rent a Tilet" },
      { name: "description", content: "List your Habesha dress for free and earn 75% of every rental in Addis Ababa." },
      { property: "og:title", content: "List a Dress — Rent a Tilet" },
      { property: "og:description", content: "Turn your wardrobe into someone's next beautiful moment." },
    ],
  }),
  component: ListPage,
});

const STEPS = ["Photos", "Details", "Measurements", "Pricing", "Availability"];
const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

function ListPage() {
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [photos, setPhotos] = useState<string[]>([]);
  const [cover, setCover] = useState(0);
  const [drag, setDrag] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [f, setF] = useState({
    title: "", category: "Habesha Kemis" as Category, tilet: TILET_STYLES[0], neighborhood: "Bole", description: "",
    size: "M", bust: "", waist: "", hip: "", length: "", fee: "3000", retail: "20000", deposit: "10000",
  });
  const [blocked, setBlocked] = useState<string[]>([]);
  const [err, setErr] = useState("");
  const up = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  async function addFiles(files: FileList | null) {
    if (!files) return;
    const imgs = Array.from(files).filter((x) => x.type.startsWith("image/")).slice(0, 6 - photos.length);
    const urls = await Promise.all(imgs.map((x) => fileToDataUrl(x)));
    setPhotos((p) => [...p, ...urls].slice(0, 6));
  }

  const fee = Number(f.fee) || 0;
  function validate() {
    if (step === 0 && photos.length === 0) return "Add at least one photo.";
    if (step === 1 && f.title.trim().length < 3) return "Give your dress a title (3+ characters).";
    if (step === 1 && f.title.length > 60) return "Title must be under 60 characters.";
    if (step === 2 && (!f.bust || !f.waist || !f.length)) return "Bust, waist and length are required.";
    if (step === 3 && (fee < 300 || fee > 50000)) return "Rental fee should be between ETB 300 and 50,000.";
    if (step === 3 && Number(f.deposit) < 0) return "Deposit can't be negative.";
    return "";
  }
  function next() {
    const e = validate();
    setErr(e);
    if (e) return;
    if (step < 4) return setStep(step + 1);
    const ordered = [photos[cover]!, ...photos.filter((_, i) => i !== cover)];
    const id = uid();
    actions.addDress({
      id, title: f.title.trim(), category: f.category, tilet: f.tilet, neighborhood: f.neighborhood,
      distanceKm: NEIGHBORHOODS.find((n) => n.name === f.neighborhood)?.km ?? 2, fee, retail: Number(f.retail) || 0,
      deposit: Number(f.deposit) || 0, rating: 0, photos: ordered, size: f.size, bust: f.bust, waist: f.waist, hip: f.hip,
      length: f.length, description: f.description.trim().slice(0, 500), blocked, lender: "You", mine: true, status: "review",
    });
    nav({ to: "/dashboard" });
  }

  return (
    <main className="mx-auto max-w-4xl px-5 pb-40 pt-8">
      <div className="flex items-start justify-between">
        <div>
          <div className="eyebrow text-gold">Share your style</div>
          <h1 className="font-serif text-5xl text-primary">List a dress</h1>
          <p className="mt-2 text-muted-foreground">Turn your wardrobe into someone's next beautiful moment.</p>
        </div>
        <span className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Step {step + 1} of 5</span>
      </div>

      <ol className="mt-8 flex items-start">
        {STEPS.map((s, i) => (
          <li key={s} className="flex flex-1 flex-col items-start last:flex-none">
            <div className="flex w-full items-center">
              <button
                type="button"
                onClick={() => i < step && setStep(i)}
                className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-full border text-sm font-semibold",
                  i === step ? "border-gold bg-gold text-primary" : i < step ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground")}
              >
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </button>
              {i < 4 && <div className={cn("h-px flex-1", i < step ? "bg-primary" : "bg-border")} />}
            </div>
            <span className={cn("mt-2 hidden text-sm sm:block", i === step ? "font-medium text-primary" : "text-muted-foreground")}>{s}</span>
          </li>
        ))}
      </ol>

      <Card className="mt-8 p-8 sm:p-12">
        <div className="eyebrow text-gold">0{step + 1} / {STEPS[step]}</div>
        {step === 0 && (
          <>
            <h2 className="font-serif text-3xl text-primary">Show off every detail</h2>
            <p className="mt-2 text-muted-foreground">Add up to 6 clear photos. Tap the star to choose your cover image.</p>
            <div
              onDragOver={(e) => (e.preventDefault(), setDrag(true))}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => (e.preventDefault(), setDrag(false), addFiles(e.dataTransfer.files))}
              onClick={() => fileRef.current?.click()}
              className={cn("mt-8 flex cursor-pointer flex-col items-center rounded-[1.75rem] border-2 border-dashed border-gold px-6 py-14 text-center transition", drag && "bg-gold/10")}
            >
              <CloudUpload className="h-10 w-10 text-primary" />
              <div className="mt-3 font-medium text-primary">Drag photos here or tap to upload</div>
              <div className="text-sm text-muted-foreground">{photos.length}/6 added · JPG or PNG</div>
              <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => (addFiles(e.target.files), (e.target.value = ""))} />
            </div>
            {photos.length > 0 && (
              <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-6">
                {photos.map((p, i) => (
                  <div key={i} className={cn("relative overflow-hidden rounded-2xl border-2", i === cover ? "border-gold" : "border-transparent")}>
                    <img src={p} alt={`Photo ${i + 1}`} className="aspect-[3/4] w-full object-cover" />
                    <button aria-label="Set as cover" onClick={() => setCover(i)} className="absolute left-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-card/90">
                      <Star className={cn("h-4 w-4", i === cover ? "fill-gold text-gold" : "text-muted-foreground")} />
                    </button>
                    <button
                      aria-label="Remove photo"
                      onClick={() => { setPhotos(photos.filter((_, j) => j !== i)); setCover((c) => (i === c ? 0 : i < c ? c - 1 : c)); }}
                      className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-card/90"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    {i === cover && <span className="absolute bottom-1 left-1 rounded-full bg-primary px-2 py-0.5 text-[10px] text-primary-foreground">Cover</span>}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <h2 className="font-serif text-3xl text-primary">Tell its story</h2>
            <Field label="Title"><input className={inputCls} maxLength={60} value={f.title} onChange={up("title")} placeholder="e.g. Saba Gold Kemis" /></Field>
            <Field label="Category">
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => <Pill key={c} active={f.category === c} onClick={() => setF({ ...f, category: c })}>{c}</Pill>)}
              </div>
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Tilet embroidery style">
                <select className={inputCls} value={f.tilet} onChange={up("tilet")}>{TILET_STYLES.map((t) => <option key={t}>{t}</option>)}</select>
              </Field>
              <Field label="Addis Ababa neighborhood">
                <select className={inputCls} value={f.neighborhood} onChange={up("neighborhood")}>{NEIGHBORHOODS.map((n) => <option key={n.name}>{n.name}</option>)}</select>
              </Field>
            </div>
            <Field label="Description (optional)"><textarea className={inputCls} rows={3} maxLength={500} value={f.description} onChange={up("description")} placeholder="Fabric, occasion, condition…" /></Field>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h2 className="font-serif text-3xl text-primary">Measurements & sizing</h2>
            <Field label="Size">
              <div className="flex flex-wrap gap-2">{SIZES.map((s) => <Pill key={s} active={f.size === s} onClick={() => setF({ ...f, size: s })}>{s}</Pill>)}</div>
            </Field>
            <div className="grid grid-cols-2 gap-5">
              {(["bust", "waist", "hip", "length"] as const).map((k) => (
                <Field key={k} label={`${k.charAt(0).toUpperCase() + k.slice(1)} (cm)${k === "hip" ? " · optional" : ""}`}>
                  <input type="number" min={0} max={250} className={inputCls} value={f[k]} onChange={up(k)} />
                </Field>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <h2 className="font-serif text-3xl text-primary">Set your price</h2>
            <div className="grid gap-5 sm:grid-cols-3">
              <Field label="Rental fee / 4 days (ETB)"><input type="number" className={inputCls} value={f.fee} onChange={up("fee")} /></Field>
              <Field label="Retail purchase price (ETB)" hint={fee && Number(f.retail) ? `Renters pay ${Math.round((fee / Number(f.retail)) * 100)}% of retail` : "Shown as a comparison"}>
                <input type="number" className={inputCls} value={f.retail} onChange={up("retail")} />
              </Field>
              <Field label="Security deposit (ETB)" hint="Fully refunded after return"><input type="number" className={inputCls} value={f.deposit} onChange={up("deposit")} /></Field>
            </div>
            <div className="rounded-[1.5rem] border border-border p-5">
              <div className="flex items-center justify-between">
                <div className="eyebrow">Fee split calculator</div>
                <ShieldCheck className="h-5 w-5 text-gold" />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-background p-4"><div className="text-sm text-muted-foreground">Renter pays</div><div className="font-semibold text-primary">{etb(fee)}</div></div>
                <div className="rounded-2xl bg-background p-4"><div className="text-sm text-muted-foreground">Platform fee · {PLATFORM_FEE * 100}%</div><div className="font-semibold text-destructive">− {etb(fee * PLATFORM_FEE)}</div></div>
                <div className="rounded-2xl bg-success p-4"><div className="text-sm text-muted-foreground">Your payout · {LENDER_SHARE * 100}%</div><div className="font-semibold text-primary">{etb(fee * LENDER_SHARE)}</div></div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">The {etb(Number(f.deposit) || 0)} deposit is held separately and returned to the renter after a successful inspection.</p>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 className="font-serif text-3xl text-primary">When is it available?</h2>
            <p className="mt-2 text-muted-foreground">Tap dates you're <b>not</b> available. Everything else is open for 4-day rentals.</p>
            <div className="mx-auto mt-6 max-w-md"><MonthCalendar mode="block" blocked={blocked} onToggle={(d) => setBlocked((b) => (b.includes(d) ? b.filter((x) => x !== d) : [...b, d]))} /></div>
            <p className="mt-4 text-center text-sm text-muted-foreground">{blocked.length} date(s) blocked · Listings are reviewed within 24 hours.</p>
          </div>
        )}

        {err && <p className="mt-6 text-sm text-destructive">{err}</p>}
        <div className="mt-10 flex justify-between">
          <button className={btnGhost} disabled={step === 0} onClick={() => (setErr(""), setStep(step - 1))}>Back</button>
          <button className={btnGold} onClick={next}>{step === 4 ? "Submit listing" : "Continue"}</button>
        </div>
      </Card>
    </main>
  );
}
