import type { ToolDefinition } from "@vellumai/plugin-api";

// 2026 US Amex Platinum benefit catalog (post-2025 refresh, $895 AF).
// Verified May 2026 against Amex official terms via CardStack / Roaming Cactus.
interface Benefit {
  id: string;
  label: string;
  amount: number; // per window
  cadence: "monthly" | "quarterly" | "semiannual" | "calendar_year" | "anniversary_year";
  auto?: boolean; // credit applies automatically when the merchant charges the card
  note: string;
  decemberAmount?: number; // Uber Cash bumps in December
  endedOn?: string; // ISO date the benefit was discontinued
}

const CATALOG: Benefit[] = [
  { id: "hotel", label: "Hotel Credit (FHR / THC)", amount: 300, cadence: "semiannual",
    note: "Prepaid Fine Hotels + Resorts or The Hotel Collection (2+ nights) via Amex Travel. $600/yr total. The big one: book early in the half, availability thins out near the deadline." },
  { id: "resy", label: "Resy Dining Credit", amount: 100, cadence: "quarterly",
    note: "Any U.S. Resy-affiliated restaurant, pay with the Platinum. No app booking needed. Cannot bank unused credit across quarters." },
  { id: "lululemon", label: "lululemon Credit", amount: 75, cadence: "quarterly",
    note: "U.S. lululemon stores (not outlets) or lululemon.com. Enrollment required." },
  { id: "digital_entertainment", label: "Digital Entertainment", amount: 25, cadence: "monthly",
    note: "Disney+, Hulu, YouTube TV/Premium, Peacock, Paramount+, ESPN+, NYT, WSJ. Enrollment required, then automatic." },
  { id: "uber_cash", label: "Uber Cash", amount: 15, decemberAmount: 20, cadence: "monthly",
    note: "Rides or Uber Eats. $20 in December. Link the card in the Uber app." },
  { id: "airline_fee", label: "Airline Fee Credit", amount: 200, cadence: "calendar_year",
    note: "Incidentals (bags, seats, in-flight, lounge passes) on ONE selected airline. Pick the airline in January: it locks for the year." },
  { id: "equinox", label: "Equinox Credit", amount: 300, cadence: "calendar_year",
    note: "Equinox club or Equinox+ digital, enrollment required. Worth $0 if you don't already pay for Equinox: mute it if so." },
  { id: "clear", label: "CLEAR Plus", amount: 209, cadence: "calendar_year", auto: true,
    note: "Covers CLEAR Plus membership, applies automatically as CLEAR charges the card monthly. Verify it's billing the Platinum." },
  { id: "walmart_plus", label: "Walmart+", amount: 155, cadence: "calendar_year", auto: true,
    note: "Covers monthly Walmart+ membership (includes Paramount+ or Peacock). Automatic once membership bills the Platinum." },
  { id: "uber_one", label: "Uber One", amount: 120, cadence: "anniversary_year", auto: true,
    note: "Covers the Uber One membership fee (separate from monthly Uber Cash). Auto-renews on the card." },
  { id: "oura", label: "Oura Ring Credit", amount: 200, cadence: "anniversary_year",
    note: "One-time credit per cardmember year toward an Oura Ring or subscription." },
  { id: "saks", label: "Saks Fifth Avenue", amount: 50, cadence: "semiannual", endedOn: "2026-07-01",
    note: "DISCONTINUED July 1, 2026. Amex has said replacement retail offers are coming: watch announcements." },
];

interface State {
  settings?: { anniversaryMonth?: number; airline?: string; muted?: string[] };
  usage?: Record<string, number>; // e.g. "resy:2026Q3": 100
  lastUpdated?: string;
}

function windowKey(b: Benefit, now: Date, annivMonth?: number): string {
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  switch (b.cadence) {
    case "monthly": return `${b.id}:${y}-${String(m).padStart(2, "0")}`;
    case "quarterly": return `${b.id}:${y}Q${Math.ceil(m / 3)}`;
    case "semiannual": return `${b.id}:${y}H${m <= 6 ? 1 : 2}`;
    case "calendar_year": return `${b.id}:${y}`;
    case "anniversary_year": {
      const am = annivMonth ?? 1;
      const startYear = m >= am ? y : y - 1;
      return `${b.id}:${startYear}A`;
    }
  }
}

function windowEnd(b: Benefit, now: Date, annivMonth?: number): Date {
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  switch (b.cadence) {
    case "monthly": return new Date(y, m, 0, 23, 59, 59);
    case "quarterly": return new Date(y, Math.ceil(m / 3) * 3, 0, 23, 59, 59);
    case "semiannual": return new Date(y, m <= 6 ? 6 : 12, 0, 23, 59, 59);
    case "calendar_year": return new Date(y, 12, 0, 23, 59, 59);
    case "anniversary_year": {
      const am = annivMonth ?? 1;
      const startYear = m >= am ? y : y - 1;
      return new Date(startYear + 1, am - 1, 0, 23, 59, 59);
    }
  }
}

const getBenefitStatus: ToolDefinition = {
  description:
    "Returns current Amex Platinum benefit usage: every 2026 credit, its window, what's used, what's remaining, days left, and urgency-ranked alerts for anything about to expire unused. Call this before sending any perk reminder: if nothing is actionable, stay silent.",
  input_schema: {
    type: "object",
    properties: {
      benefit: {
        type: "string",
        description: "Optional benefit id to check (e.g. 'hotel', 'resy'). Omit for the full overview.",
      },
    },
  },
  defaultRiskLevel: "low",
  execute: async (input: { benefit?: string }, ctx) => {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const workspaceDir =
      process.env.VELLUM_WORKSPACE_DIR ?? (ctx as { workingDir?: string }).workingDir ?? process.cwd();
    const storageDir =
      (ctx as { pluginStorageDir?: string }).pluginStorageDir ??
      path.join(workspaceDir, "plugins", "amex-perk-reminder", "data");
    await fs.mkdir(storageDir, { recursive: true });
    const statePath = path.join(storageDir, "benefit-state.json");

    let state: State = {};
    try {
      state = JSON.parse(await fs.readFile(statePath, "utf8"));
    } catch {
      // first run
    }
    const muted = new Set(state.settings?.muted ?? []);
    const annivMonth = state.settings?.anniversaryMonth;
    const now = new Date();
    const dec = now.getMonth() === 11;

    const benefits = CATALOG.filter((b) => !input.benefit || b.id === input.benefit);
    const rows: Record<string, unknown>[] = [];
    const alerts: { urgency: string; message: string }[] = [];

    for (const b of benefits) {
      if (b.endedOn && now >= new Date(b.endedOn)) {
        rows.push({ id: b.id, label: b.label, status: "discontinued", note: b.note });
        continue;
      }
      const amount = dec && b.decemberAmount ? b.decemberAmount : b.amount;
      const key = windowKey(b, now, annivMonth);
      const used = state.usage?.[key] ?? 0;
      const remaining = Math.max(0, amount - used);
      const end = windowEnd(b, now, annivMonth);
      const daysLeft = Math.ceil((end.getTime() - now.getTime()) / 86400000);
      const isMuted = muted.has(b.id);
      const needsAnniv = b.cadence === "anniversary_year" && !annivMonth;

      rows.push({
        id: b.id, label: b.label, cadence: b.cadence,
        windowAmount: amount, used, remaining, daysLeftInWindow: daysLeft,
        muted: isMuted, auto: b.auto ?? false, note: b.note,
        ...(needsAnniv ? { warning: "anniversaryMonth not set: window dates are assumed Jan; set it via update-benefit-settings" } : {}),
      });

      if (isMuted || b.auto || remaining <= 0) continue;
      const urgency =
        daysLeft <= 7 ? "critical" : daysLeft <= 14 ? "closing" : daysLeft <= 31 && b.cadence !== "monthly" ? "heads_up" : null;
      if (urgency) {
        alerts.push({ urgency, message: `${b.label}: $${remaining} unused, ${daysLeft} days left in the ${b.cadence.replace("_", " ")} window.` });
      }
    }

    if (state.settings && !state.settings.airline) {
      alerts.push({ urgency: "heads_up", message: "No airline selected for the $200 Airline Fee Credit. It must be chosen on the Amex site and locks for the calendar year." });
    }

    const order = { critical: 0, closing: 1, heads_up: 2 } as Record<string, number>;
    alerts.sort((a, z) => order[a.urgency] - order[z.urgency]);

    return {
      content: JSON.stringify({
        asOf: now.toISOString(),
        annualFee: 895,
        settings: state.settings ?? {},
        benefits: rows,
        alerts,
        guidance: alerts.length === 0
          ? "Nothing urgent. If this was a scheduled check, do not message the user."
          : "Deliver alerts via the user's best connected channel (Slack > Telegram > email). Lead with critical items and exact dollar amounts.",
      }, null, 2),
    };
  },
};

export default getBenefitStatus;
