import { Tool, ToolContext, ToolResponse } from "@vellumai/plugin-api";

interface BenefitState {
  hotel_h1_used: number;      // Jan-Jun hotel credit used ($300 max)
  hotel_h2_used: number;      // Jul-Dec hotel credit used
  saks_h1_used: number;       // Jan-Jun Saks used ($50 max)
  saks_h2_used: number;       // Jul-Dec Saks used
  airline_fees_used: number;  // YTD airline fee credits used ($200 max)
  uber_cash_used: number;     // Current month Uber cash used
  resy_dining_used: number;   // Current month Resy dining used
  last_updated: string;       // ISO date
}

const tool: Tool = {
  name: "get-benefit-status",
  description: "Returns current Amex Platinum benefit usage and shows what's about to expire",
  parameters: {
    type: "object",
    properties: {
      month: {
        type: "number",
        description: "Current month (1-12), for determining semi-annual windows",
      },
      day: {
        type: "number",
        description: "Current day of month",
      },
      benefit: {
        type: "string",
        enum: ["all", "hotel", "saks", "uber", "resy", "airline", "entertainment"],
        description: "Which benefit to check, or 'all' for full overview",
      },
    },
    required: ["month", "day"],
  },

  async execute(
    context: ToolContext,
    params: { month: number; day: number; benefit?: string },
  ): Promise<ToolResponse> {
    const month = params.month;
    const day = params.day;
    const benefit = params.benefit || "all";

    // Read stored state from plugin data directory
    let state: BenefitState = {
      hotel_h1_used: 0,
      hotel_h2_used: 0,
      saks_h1_used: 0,
      saks_h2_used: 0,
      airline_fees_used: 0,
      uber_cash_used: 0,
      resy_dining_used: 0,
      last_updated: new Date().toISOString(),
    };

    try {
      const data = await context.fs.readFile("benefit-state.json");
      state = JSON.parse(data.toString());
    } catch {
      // No state file yet — first run
    }

    const is_h2 = month >= 7;
    const days_until_jul = month <= 6
      ? new Date(2026, 6, 1).getTime() - new Date(2026, month - 1, day).getTime()
      : 0;
    const days_until_jan = month > 6
      ? new Date(2027, 0, 1).getTime() - new Date(2026, month - 1, day).getTime()
      : 0;
    const days_until_month_end = new Date(2026, month, 0).getDate() - day;

    const alerts: string[] = [];
    const overview: Record<string, string> = {};

    // Hotel credit
    const hotel_used = is_h2 ? state.hotel_h2_used : state.hotel_h1_used;
    const hotel_remaining = 300 - hotel_used;
    overview.hotel = `$${hotel_used}/$300 used ($${hotel_remaining} remaining)`;
    if (!is_h2 && days_until_jul > 0 && days_until_jul <= 45) {
      alerts.push(`⚠️ ${Math.ceil(days_until_jul / 7)} weeks left on your $300 hotel credit. Book via Amex Travel.`);
    } else if (is_h2 && days_until_jan > 0 && days_until_jan <= 45) {
      alerts.push(`⚠️ ${Math.ceil(days_until_jan / 7)} weeks left on your $300 hotel credit. Book via Amex Travel.`);
    }

    // Saks
    const saks_used = is_h2 ? state.saks_h2_used : state.saks_h1_used;
    const saks_remaining = 50 - saks_used;
    overview.saks = `$${saks_used}/$50 used ($${saks_remaining} remaining)`;
    if (month === 6 || month === 12) {
      alerts.push(`⚠️ Saks $50 credit expires this month. Use it or lose it.`);
    }

    // Uber Cash
    const uber_amt = month === 12 ? 35 : 15;
    overview.uber_cash = `$${state.uber_cash_used}/$${uber_amt} used this month`;
    if (state.uber_cash_used < uber_amt) {
      alerts.push(`💰 $${uber_amt - state.uber_cash_used} Uber Cash available this month.`);
    }

    // Resy
    overview.resy = `$${state.resy_dining_used}/$33 used this month`;
    if (state.resy_dining_used < 33) {
      alerts.push(`🍽️ $${33 - state.resy_dining_used} Resy dining credit available this month.`);
    }

    // Airline
    overview.airline = `$${state.airline_fees_used}/$200 used this year`;
    if (state.airline_fees_used < 200 && (month === 9 || month === 12)) {
      alerts.push(`✈️ $${200 - state.airline_fees_used} airline fee credit remaining. Bag fees, seat assignments, lounge passes count.`);
    }

    // Entertainment
    overview.entertainment = `$${Math.min(state.uber_cash_used, 20)}/$20 estimated this month`;
    alerts.push(`📺 Digital entertainment credit: Peacock, WSJ, NYT, Disney streaming. Check your Amex offers page.`);

    if (benefit !== "all") {
      const filtered: Record<string, string> = {};
      if (overview[benefit]) filtered[benefit] = overview[benefit];
      return {
        content: `## ${benefit.charAt(0).toUpperCase() + benefit.slice(1)} Credit\n${filtered[benefit] || "No data for this benefit"}`,
      };
    }

    return {
      content: [
        `## Amex Platinum Perk Status (${month}/${day})`,
        "",
        ...Object.entries(overview).map(([k, v]) => `• **${k.replace(/_/g, " ")}**: ${v}`),
        "",
        ...(alerts.length > 0 ? ["### Alerts", ...alerts, ""] : []),
        alerts.length === 0 ? "✅ All perks tracked. No urgent expirations." : "",
        "",
        "Ask me to log a credit when you use it.",
      ].join("\n"),
    };
  },
};

export default tool;
