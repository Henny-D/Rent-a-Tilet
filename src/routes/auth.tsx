import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { NEIGHBORHOODS, SUB_CITIES, useStore } from "@/lib/store";
import { btnGold, Card, Field, inputCls, Pill } from "@/components/ui-kit";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign In or Join — Rent a Tilet" },
      { name: "description", content: "Create your Rent a Tilet account to list dresses, book rentals and track payouts on any device." },
      { property: "og:title", content: "Sign In or Join — Rent a Tilet" },
      { property: "og:description", content: "One account to lend and rent Habesha dresses in Addis Ababa." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const user = useStore((s) => s.user);
  const [mode, setMode] = useState<"in" | "up">("in");
  const [f, setF] = useState({ email: "", password: "", full_name: "", phone: "", telegram: "", city: "Addis Ababa", sub_city: "Bole", neighborhood: "Bole" });
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (user) void nav({ to: "/dashboard" }); }, [user, nav]);
  const up = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr(""); setMsg("");
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return setErr("Enter a valid email.");
    if (f.password.length < 8) return setErr("Password must be at least 8 characters.");
    if (mode === "up") {
      if (f.full_name.trim().length < 2) return setErr("Enter your name.");
      if (!/^\+?[0-9 ]{9,15}$/.test(f.phone.trim())) return setErr("Enter a valid phone number, e.g. 0911 234 567.");
    }
    setBusy(true);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email: f.email.trim(), password: f.password });
      if (error) setErr(error.message);
    } else {
      const { email, password, ...meta } = f;
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(), password,
        options: { emailRedirectTo: window.location.origin, data: Object.fromEntries(Object.entries(meta).map(([k, v]) => [k, v.trim()])) },
      });
      if (error) setErr(error.message);
      else if (!data.session) setMsg("Check your email and tap the confirmation link to finish creating your account.");
    }
    setBusy(false);
  }

  return (
    <main className="mx-auto max-w-lg px-5 pb-40 pt-10">
      <div className="eyebrow text-gold">Rent a Tilet</div>
      <h1 className="font-serif text-5xl text-primary">{mode === "in" ? "Welcome back" : "Join the closet"}</h1>
      <p className="mt-2 text-muted-foreground">One account to lend your dresses and rent others'.</p>
      <div className="mt-6 flex gap-3">
        <Pill active={mode === "in"} onClick={() => setMode("in")}>Sign in</Pill>
        <Pill active={mode === "up"} onClick={() => setMode("up")}>Create account</Pill>
      </div>
      <Card className="mt-6">
        <form onSubmit={submit} className="space-y-4">
          {mode === "up" && (
            <>
              <Field label="Full name"><input className={inputCls} maxLength={80} value={f.full_name} onChange={up("full_name")} /></Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Phone"><input className={inputCls} maxLength={20} placeholder="0911 234 567" value={f.phone} onChange={up("phone")} /></Field>
                <Field label="Telegram (optional)"><input className={inputCls} maxLength={40} placeholder="@username" value={f.telegram} onChange={up("telegram")} /></Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="City"><input className={inputCls} maxLength={60} value={f.city} onChange={up("city")} /></Field>
                <Field label="Sub city"><select className={inputCls} value={f.sub_city} onChange={up("sub_city")}>{SUB_CITIES.map((s) => <option key={s}>{s}</option>)}</select></Field>
                <Field label="Neighborhood"><select className={inputCls} value={f.neighborhood} onChange={up("neighborhood")}>{NEIGHBORHOODS.map((n) => <option key={n.name}>{n.name}</option>)}</select></Field>
              </div>
            </>
          )}
          <Field label="Email"><input className={inputCls} type="email" autoComplete="email" maxLength={255} value={f.email} onChange={up("email")} /></Field>
          <Field label="Password"><input className={inputCls} type="password" autoComplete={mode === "in" ? "current-password" : "new-password"} value={f.password} onChange={up("password")} /></Field>
          {err && <p className="text-sm text-destructive">{err}</p>}
          {msg && <p className="text-sm text-primary">{msg}</p>}
          <button className={cn(btnGold, "w-full")} disabled={busy}>{busy ? "Please wait…" : mode === "in" ? "Sign in" : "Create account"}</button>
        </form>
      </Card>
    </main>
  );
}
