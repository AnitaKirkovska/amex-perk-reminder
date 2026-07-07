import type { ToolDefinition } from "@vellumai/plugin-api";
import { CARDS, CARD_IDS, loadState, saveState, type CardSetting } from "../lib/catalog.ts";

interface SettingsInput {
  addCards?: { card: string; anniversaryMonth?: number; airline?: string }[];
  removeCards?: string[];
  mute?: string[];
  unmute?: string[];
}

const updateBenefitSettings: ToolDefinition = {
  description:
    `Configure Amex benefit tracking. Add or remove the cards the user holds (${CARD_IDS.join(", ")}), set per-card anniversary month (drives cardmember-year windows like Oura, Uber One, companion certificates) and selected airline (fee credit), and mute benefits the user doesn't care about (mute keys are 'card.benefit', e.g. 'platinum.equinox'). Call during setup and whenever the user mentions a new card, their anniversary, their airline, or a credit they never use.`,
  input_schema: {
    type: "object",
    properties: {
      addCards: {
        type: "array",
        description: "Cards to add or update (merged by card id).",
        items: {
          type: "object",
          properties: {
            card: { type: "string", description: `One of: ${CARD_IDS.join(", ")}` },
            anniversaryMonth: { type: "number", description: "Cardmember anniversary month, 1-12." },
            airline: { type: "string", description: "Airline selected for this card's fee credit (if the card has one)." },
          },
          required: ["card"],
        },
      },
      removeCards: {
        type: "array",
        items: { type: "string" },
        description: "Card ids to stop tracking.",
      },
      mute: {
        type: "array",
        items: { type: "string" },
        description: "Benefit keys to stop reminding about, format 'card.benefit' (e.g. 'platinum.lululemon').",
      },
      unmute: {
        type: "array",
        items: { type: "string" },
        description: "Benefit keys to resume reminding about.",
      },
    },
  },
  defaultRiskLevel: "low",
  execute: async (input: SettingsInput, ctx) => {
    const { state, statePath } = await loadState(ctx);
    state.settings = state.settings ?? {};
    const cards: CardSetting[] = state.settings.cards ?? [];

    for (const add of input.addCards ?? []) {
      if (!CARD_IDS.includes(add.card)) {
        return { content: JSON.stringify({ error: `Unknown card '${add.card}'. Valid: ${CARD_IDS.join(", ")}` }) };
      }
      if (add.anniversaryMonth !== undefined) {
        const m = Number(add.anniversaryMonth);
        if (!Number.isInteger(m) || m < 1 || m > 12) {
          return { content: JSON.stringify({ error: "anniversaryMonth must be an integer 1-12" }) };
        }
      }
      const existing = cards.find((c) => c.card === add.card);
      if (existing) {
        if (add.anniversaryMonth !== undefined) existing.anniversaryMonth = add.anniversaryMonth;
        if (add.airline !== undefined) existing.airline = String(add.airline).slice(0, 80);
      } else {
        const entry: CardSetting = { card: add.card };
        if (add.anniversaryMonth !== undefined) entry.anniversaryMonth = add.anniversaryMonth;
        if (add.airline !== undefined) entry.airline = String(add.airline).slice(0, 80);
        cards.push(entry);
      }
    }

    const removals = new Set(input.removeCards ?? []);
    state.settings.cards = cards.filter((c) => !removals.has(c.card));

    const validMutes = new Set(
      CARDS.flatMap((c) => c.benefits.map((b) => `${c.id}.${b.id}`)),
    );
    const muted = new Set(state.settings.muted ?? []);
    for (const key of input.mute ?? []) {
      if (validMutes.has(key)) muted.add(key);
    }
    for (const key of input.unmute ?? []) {
      muted.delete(key);
    }
    state.settings.muted = [...muted];
    delete state.settings.anniversaryMonth;
    delete state.settings.airline;

    await saveState(statePath, state);
    return { content: JSON.stringify({ ok: true, settings: state.settings }) };
  },
};

export default updateBenefitSettings;
