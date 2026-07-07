import type { ToolDefinition } from "@vellumai/plugin-api";
import { CARDS, CARD_IDS, loadState, windowKey, windowEnd } from "../lib/catalog.ts";

const getBenefitStatus: ToolDefinition = {
  description:
    "Returns current Amex benefit usage across every card the user holds (Platinum, Gold, Business Platinum, Delta Gold/Platinum/Reserve): each credit's window, what's used, what's remaining, days left, and urgency-ranked alerts for anything about to expire unused. Call this before sending any perk reminder; if nothing is actionable, stay silent.",
  input_schema: {
    type: "object",
    properties: {
      card: {
        type: "string",
        description: `Optional card id to check. One of: ${CARD_IDS.join(", ")}. Omit for all held cards.`,
      },
      benefit: {
        type: "string",
        description: "Optional benefit id to check (e.g. 'hotel', 'resy', 'delta_stays'). Omit for the full overview.",
      },
    },
  },
  defaultRiskLevel: "low",
  execute: async (input: { card?: string; benefit?: string }, ctx) => {
    const { state } = await loadState(ctx);
    const held = state.settings?.cards ?? [];

    if (held.length === 0) {
      return {
        content: JSON.stringify({
          setupNeeded: true,
          supportedCards: CARDS.map((c) => ({ id: c.id, label: c.label, annualFee: c.annualFee })),
          guidance: "No cards configured. Ask the user which Amex cards they hold and save them with update-benefit-settings before tracking anything.",
        }, null, 2),
      };
    }

    const muted = new Set(state.settings?.muted ?? []);
    const now = new Date();
    const dec = now.getMonth() === 11;
    const cards: Record<string, unknown>[] = [];
    const alerts: { urgency: string; message: string }[] = [];

    for (const hc of held) {
      if (input.card && hc.card !== input.card) continue;
      const def = CARDS.find((c) => c.id === hc.card);
      if (!def) continue;
      const rows: Record<string, unknown>[] = [];

      for (const b of def.benefits) {
        if (input.benefit && b.id !== input.benefit) continue;
        if (b.endedOn && now >= new Date(b.endedOn)) {
          rows.push({ id: b.id, label: b.label, status: "discontinued", note: b.note });
          continue;
        }
        const amount = dec && b.decemberAmount ? b.decemberAmount : b.amount;
        const key = windowKey(def.id, b, now, hc.anniversaryMonth);
        const used = state.usage?.[key] ?? 0;
        const remaining = Math.max(0, amount - used);
        const end = windowEnd(b, now, hc.anniversaryMonth);
        const daysLeft = Math.ceil((end.getTime() - now.getTime()) / 86400000);
        const muteKey = `${def.id}.${b.id}`;
        const isMuted = muted.has(muteKey);
        const needsAnniv = b.cadence === "anniversary_year" && !hc.anniversaryMonth;
        const unit = b.unit ?? "USD";

        rows.push({
          id: b.id, label: b.label, cadence: b.cadence, unit,
          windowAmount: amount, used, remaining, daysLeftInWindow: daysLeft,
          muted: isMuted, auto: b.auto ?? false, enrollmentRequired: b.enroll ?? false, note: b.note,
          ...(b.endedOn ? { endsOn: b.endedOn } : {}),
          ...(needsAnniv ? { warning: "anniversaryMonth not set for this card; window dates assume Jan. Set it via update-benefit-settings." } : {}),
        });

        if (isMuted || b.auto || remaining <= 0) continue;
        const urgency =
          daysLeft <= 7 ? "critical" : daysLeft <= 14 ? "closing" : daysLeft <= 31 && b.cadence !== "monthly" ? "heads_up" : null;
        if (urgency) {
          const what = unit === "cert" ? `${remaining} certificate(s)` : `$${remaining}`;
          alerts.push({ urgency, message: `${def.label} / ${b.label}: ${what} unused, ${daysLeft} days left in the ${b.cadence.replace("_", " ")} window.` });
        }
      }

      const hasAirlineFee = def.benefits.some((b) => b.id === "airline_fee");
      if (hasAirlineFee && !hc.airline) {
        alerts.push({ urgency: "heads_up", message: `${def.label}: no airline selected for the $200 Airline Fee Credit. It must be chosen on the Amex site and locks for the calendar year.` });
      }

      cards.push({ card: def.id, label: def.label, annualFee: def.annualFee, settings: hc, benefits: rows });
    }

    const order = { critical: 0, closing: 1, heads_up: 2 } as Record<string, number>;
    alerts.sort((a, z) => order[a.urgency] - order[z.urgency]);

    return {
      content: JSON.stringify({
        asOf: now.toISOString(),
        cards,
        alerts,
        guidance: alerts.length === 0
          ? "Nothing urgent. If this was a scheduled check, do not message the user."
          : "Deliver alerts via the user's best connected channel (Slack > Telegram > email). Lead with critical items and exact dollar amounts.",
      }, null, 2),
    };
  },
};

export default getBenefitStatus;
