import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [
    { title: "Reset password · Rent a Tilet" },
    { name: "description", content: "Choose a new password for your Rent a Tilet account." },
    { property: "og:title", content: "Reset password · Rent a Tilet" },
    { property: "og:description", content: "Choose a new password for your Rent a Tilet account." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Reset,
});

function Reset() {
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const nav = useNavigate();
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) return setMsg(error.message);
    nav({ to: "/admin" });
  };
  return (
    <main className="mx-auto max-w-md px-5 pb-40 pt-16">
      <h1 className="font-serif text-4xl text-primary">Set a new password</h1>
      <form onSubmit={save} className="mt-6 space-y-3">
        <input type="password" required minLength={8} placeholder="New password" value={pw} onChange={(e) => setPw(e.target.value)} className="w-full rounded-xl border border-border bg-card px-4 py-3" />
        <button className="w-full rounded-full bg-primary px-5 py-3 font-medium text-primary-foreground">Save password</button>
      </form>
      {msg && <p className="mt-3 text-sm text-destructive">{msg}</p>}
    </main>
  );
}
