import type { ToolDefinition } from "@vellumai/plugin-api";
import { CARDS, CARD_IDS, loadState, saveState, windowKey } from "../lib/catalog.ts";

interface LogInput {
  card?: string;
  benefit: string;
  amount: number;
  note?: string;
}

const logBenefitUse: ToolDefinition = {
  description:
    "Record usage of an Amex credit so reminders stop nagging about it. Call whenever the user says they used a benefit (booked the FHR hotel, ate at a Resy spot, used the companion certificate, streaming charge posted). Amount is dollars used in the current window (1 for companion certificates); it accumulates. Card id is only needed when the benefit exists on more than one of the user's cards.",
  input_schema: {
    type: "object",
    properties: {
      card: {
        type: "string",
        description: `Card the benefit belongs to. One of: ${CARD_IDS.join(", ")}. Optional when unambiguous.`,
      },
      benefit: {
        type: "string",
        description: "Benefit id, e.g. 'hotel', 'resy', 'uber_cash', 'delta_stays', 'companion_cert'.",
      },
      amount: {
        type: "number",
        description: "Dollar amount used (adds to the current window's total). Use 1 for a companion certificate.",
      },
      note: {
        type: "string",
        description: "Optional context, e.g. 'FHR booking via Amex Travel'.",
      },
    },
    required: ["benefit", "amount"],
  },
  defaultRiskLevel: "low",
  execute: async (input: LogInput, ctx) => {
    const { state, statePath } = await loadState(ctx);
    const held = state.settings?.cards ?? [];
    if (held.length === 0) {
      return { content: JSON.stringify({ error: "No cards configured. Run setup with update-benefit-settings first." }) };
    }

    const amount = Number(input.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return { content: JSON.stringify({ error: "amount must be a positive number" }) };
    }

    // Resolve which held card this benefit belongs to.
    const candidates = held.filter((hc) => {
      if (input.card && hc.card !== input.card) return false;
      const def = CARDS.find((c) => c.id === hc.card);
      return def?.benefits.some((b) => b.id === input.benefit) ?? false;
    });
    if (candidates.length === 0) {
      const valid = held.flatMap((hc) => {
        const def = CARDS.find((c) => c.id === hc.card);
        return def ? def.benefits.map((b) => `${def.id}.${b.id}`) : [];
      });
      return { content: JSON.stringify({ error: `Benefit '${input.benefit}'${input.card ? ` on card '${input.card}'` : ""} not found on the user's cards. Valid: ${valid.join(", ")}` }) };
    }
    if (candidates.length > 1) {
      return { content: JSON.stringify({ error: `Benefit '${input.benefit}' exists on multiple held cards (${candidates.map((c) => c.card).join(", ")}). Pass the card id.` }) };
    }

    const hc = candidates[0];
    const def = CARDS.find((c) => c.id === hc.card)!;
    const b = def.benefits.find((x) => x.id === input.benefit)!;
    const key = windowKey(def.id, b, new Date(), hc.anniversaryMonth);

    state.usage = state.usage ?? {};
    state.usage[key] = (state.usage[key] ?? 0) + amount;
    state.log = state.log ?? [];
    state.log.push({ at: new Date().toISOString(), card: def.id, benefit: b.id, amount, note: input.note ?? null });
    await saveState(statePath, state);

    return {
      content: JSON.stringify({
        ok: true,
        card: def.id,
        benefit: b.id,
        window: key,
        totalUsedThisWindow: state.usage[key],
        windowAmount: b.amount,
      }),
    };
  },
};

export default logBenefitUse;
