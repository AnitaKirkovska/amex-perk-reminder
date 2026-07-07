import type { ToolDefinition } from "@vellumai/plugin-api";

const MUTABLE = [
  "hotel", "resy", "lululemon", "digital_entertainment", "uber_cash",
  "airline_fee", "equinox", "clear", "walmart_plus", "uber_one", "oura",
];

interface SettingsInput {
  anniversaryMonth?: number;
  airline?: string;
  mute?: string[];
  unmute?: string[];
}

const updateBenefitSettings: ToolDefinition = {
  description:
    "Update Amex Platinum tracking settings: cardmember anniversary month (drives Oura + Uber One windows), selected airline for the fee credit, and muting benefits the user doesn't care about (muted benefits never trigger reminders). Call during setup and whenever the user says things like 'I don't use Equinox' or 'my airline is Delta'.",
  input_schema: {
    type: "object",
    properties: {
      anniversaryMonth: {
        type: "number",
        description: "Cardmember anniversary month, 1-12.",
      },
      airline: {
        type: "string",
        description: "Airline selected for the $200 fee credit this calendar year.",
      },
      mute: {
        type: "array",
        items: { type: "string" },
        description: `Benefit ids to stop reminding about. Valid: ${MUTABLE.join(", ")}`,
      },
      unmute: {
        type: "array",
        items: { type: "string" },
        description: "Benefit ids to resume reminding about.",
      },
    },
  },
  defaultRiskLevel: "low",
  execute: async (input: SettingsInput, ctx) => {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const workspaceDir =
      process.env.VELLUM_WORKSPACE_DIR ?? (ctx as { workingDir?: string }).workingDir ?? process.cwd();
    const storageDir =
      (ctx as { pluginStorageDir?: string }).pluginStorageDir ??
      path.join(workspaceDir, "plugins", "amex-perk-reminder", "data");
    await fs.mkdir(storageDir, { recursive: true });
    const statePath = path.join(storageDir, "benefit-state.json");

    let state: { settings?: { anniversaryMonth?: number; airline?: string; muted?: string[] }; lastUpdated?: string } = {};
    try {
      state = JSON.parse(await fs.readFile(statePath, "utf8"));
    } catch {
      // first run
    }
    state.settings = state.settings ?? {};

    if (input.anniversaryMonth !== undefined) {
      const m = Number(input.anniversaryMonth);
      if (!Number.isInteger(m) || m < 1 || m > 12) {
        return { content: JSON.stringify({ error: "anniversaryMonth must be an integer 1-12" }) };
      }
      state.settings.anniversaryMonth = m;
    }
    if (input.airline !== undefined) {
      state.settings.airline = String(input.airline).slice(0, 80);
    }
    const muted = new Set(state.settings.muted ?? []);
    for (const id of input.mute ?? []) {
      if (MUTABLE.includes(id)) muted.add(id);
    }
    for (const id of input.unmute ?? []) {
      muted.delete(id);
    }
    state.settings.muted = [...muted];
    state.lastUpdated = new Date().toISOString();

    await fs.writeFile(statePath, JSON.stringify(state, null, 2), "utf8");
    return { content: JSON.stringify({ ok: true, settings: state.settings }) };
  },
};

export default updateBenefitSettings;
