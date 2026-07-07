import type { ToolDefinition } from "@vellumai/plugin-api";

const BENEFIT_IDS = [
  "hotel", "resy", "lululemon", "digital_entertainment", "uber_cash",
  "airline_fee", "equinox", "clear", "walmart_plus", "uber_one", "oura", "saks",
] as const;

type Cadence = "monthly" | "quarterly" | "semiannual" | "calendar_year" | "anniversary_year";
const CADENCE: Record<string, Cadence> = {
  hotel: "semiannual", resy: "quarterly", lululemon: "quarterly",
  digital_entertainment: "monthly", uber_cash: "monthly",
  airline_fee: "calendar_year", equinox: "calendar_year", clear: "calendar_year",
  walmart_plus: "calendar_year", uber_one: "anniversary_year", oura: "anniversary_year",
  saks: "semiannual",
};

function windowKey(id: string, now: Date, annivMonth?: number): string {
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  switch (CADENCE[id]) {
    case "monthly": return `${id}:${y}-${String(m).padStart(2, "0")}`;
    case "quarterly": return `${id}:${y}Q${Math.ceil(m / 3)}`;
    case "semiannual": return `${id}:${y}H${m <= 6 ? 1 : 2}`;
    case "calendar_year": return `${id}:${y}`;
    case "anniversary_year": {
      const am = annivMonth ?? 1;
      return `${id}:${m >= am ? y : y - 1}A`;
    }
  }
}

interface LogInput {
  benefit: string;
  amount: number;
  note?: string;
}

const logBenefitUse: ToolDefinition = {
  description:
    "Record usage of an Amex Platinum credit so reminders stop nagging about it. Call this whenever the user says they used a benefit (booked the FHR hotel, ate at a Resy spot, streaming charge posted, paid a bag fee, etc.). Amount is dollars used in the current window; it accumulates.",
  input_schema: {
    type: "object",
    properties: {
      benefit: {
        type: "string",
        enum: [...BENEFIT_IDS],
        description: "Which benefit was used.",
      },
      amount: {
        type: "number",
        description: "Dollar amount used (adds to the current window's total).",
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
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const workspaceDir =
      process.env.VELLUM_WORKSPACE_DIR ?? (ctx as { workingDir?: string }).workingDir ?? process.cwd();
    const storageDir =
      (ctx as { pluginStorageDir?: string }).pluginStorageDir ??
      path.join(workspaceDir, "plugins", "amex-perk-reminder", "data");
    await fs.mkdir(storageDir, { recursive: true });
    const statePath = path.join(storageDir, "benefit-state.json");

    if (!BENEFIT_IDS.includes(input.benefit as (typeof BENEFIT_IDS)[number])) {
      return { content: JSON.stringify({ error: `Unknown benefit '${input.benefit}'. Valid: ${BENEFIT_IDS.join(", ")}` }) };
    }
    const amount = Number(input.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return { content: JSON.stringify({ error: "amount must be a positive number of dollars" }) };
    }

    let state: { settings?: { anniversaryMonth?: number }; usage?: Record<string, number>; log?: unknown[]; lastUpdated?: string } = {};
    try {
      state = JSON.parse(await fs.readFile(statePath, "utf8"));
    } catch {
      // first run
    }

    const key = windowKey(input.benefit, new Date(), state.settings?.anniversaryMonth);
    state.usage = state.usage ?? {};
    state.usage[key] = (state.usage[key] ?? 0) + amount;
    state.log = state.log ?? [];
    state.log.push({ at: new Date().toISOString(), benefit: input.benefit, amount, note: input.note ?? null });
    state.lastUpdated = new Date().toISOString();

    await fs.writeFile(statePath, JSON.stringify(state, null, 2), "utf8");
    return {
      content: JSON.stringify({
        ok: true,
        benefit: input.benefit,
        window: key,
        totalUsedThisWindow: state.usage[key],
      }),
    };
  },
};

export default logBenefitUse;
