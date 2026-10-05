import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const audit = z.object({
  stage: z.string(),
  checklist: z.record(z.string()),
  notes: z.string().max(1000),
  photos: z.array(z.string()).max(8),
});

const input = z.object({
  dress: z.string().max(200),
  fee: z.number(),
  deposit: z.number(),
  audits: z.array(audit).max(3),
});

export type DisputeAnalysis = { summary: string; lenderKeeps: number; rationale: string };

export const analyzeDispute = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => input.parse(d))
  .handler(async ({ data, context }): Promise<{ ok: true; result: DisputeAnalysis } | { ok: false; error: string }> => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) return { ok: false, error: "Only operators can use dispute review." };
    const { runDisputeModel } = await import("./dispute-ai.server");
    const content: Array<{ type: "text"; text: string } | { type: "image"; image: string }> = [{
      type: "text",
      text: `Rented dress: ${data.dress}. Rental fee ${data.fee} ETB. Refundable deposit ${data.deposit} ETB.\n\n` +
        data.audits.map((a) => `## ${a.stage}\nChecklist: ${Object.entries(a.checklist).map(([k, v]) => `${k}=${v}`).join(", ") || "none"}\nNotes: ${a.notes || "none"}\nPhotos attached: ${a.photos.length}`).join("\n\n"),
    }];
    for (const a of data.audits) for (const p of a.photos) if (p.startsWith("data:image/")) content.push({ type: "image", image: p });
    try {
      const text = await runDisputeModel("You are a neutral mediator for an Ethiopian traditional-dress (habesha kemis / tilet) rental marketplace. Compare the handover record, return record and operator findings, including photos. Damage present at handover is not the renter's fault. Normal wear is not chargeable. Suggest how much of the deposit the lender should keep (0 to the full deposit, whole ETB). Reply with ONLY JSON: {\"summary\": string (3-5 sentences of evidence), \"lenderKeeps\": number, \"rationale\": string (2-3 sentences)}.",
        [{ role: "user", content }]);
      const m = text.match(/\{[\s\S]*\}/);
      const j = JSON.parse(m ? m[0] : text);
      const keep = Math.round(Math.max(0, Math.min(data.deposit, Number(j.lenderKeeps) || 0)));
      return { ok: true, result: { summary: String(j.summary ?? ""), lenderKeeps: keep, rationale: String(j.rationale ?? "") } };
    } catch (e) {
      return { ok: false, error: e instanceof SyntaxError ? "The AI answer couldn't be read. Try again." : (e as Error).message };
    }
  });
