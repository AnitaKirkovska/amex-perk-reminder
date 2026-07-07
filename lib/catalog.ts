// 2026 US Amex card benefit catalogs.
// Verified Jul 2026 against Amex/Delta official pages + CardStack / NextCard breakdowns.

export type Cadence =
  | "monthly"
  | "quarterly"
  | "semiannual"
  | "calendar_year"
  | "anniversary_year";

export interface Benefit {
  id: string;
  label: string;
  amount: number; // per window
  cadence: Cadence;
  unit?: "USD" | "cert"; // default USD
  auto?: boolean; // applies automatically when the merchant charges the card
  enroll?: boolean; // requires one-time enrollment in the Amex account
  note: string;
  decemberAmount?: number;
  endedOn?: string; // ISO date the benefit was or will be discontinued
}

export interface CardDef {
  id: string;
  label: string;
  annualFee: number;
  benefits: Benefit[];
}

export const CARDS: CardDef[] = [
  {
    id: "platinum",
    label: "Platinum Card",
    annualFee: 895,
    benefits: [
      { id: "hotel", label: "Hotel Credit (FHR / THC)", amount: 300, cadence: "semiannual",
        note: "Prepaid Fine Hotels + Resorts or The Hotel Collection (2+ nights) via Amex Travel. $600/yr total. The big one: book early in the half, availability thins out near the deadline." },
      { id: "resy", label: "Resy Dining Credit", amount: 100, cadence: "quarterly", enroll: true,
        note: "Any U.S. Resy-affiliated restaurant, pay with the Platinum. No app booking needed. Cannot bank unused credit across quarters." },
      { id: "lululemon", label: "lululemon Credit", amount: 75, cadence: "quarterly", enroll: true,
        note: "U.S. lululemon stores (not outlets) or lululemon.com." },
      { id: "digital_entertainment", label: "Digital Entertainment", amount: 25, cadence: "monthly", enroll: true,
        note: "Disney+, Hulu, YouTube TV/Premium, Peacock, Paramount+, ESPN+, NYT, WSJ. Automatic after enrollment." },
      { id: "uber_cash", label: "Uber Cash", amount: 15, decemberAmount: 20, cadence: "monthly",
        note: "Rides or Uber Eats. $20 in December. Link the card in the Uber app." },
      { id: "airline_fee", label: "Airline Fee Credit", amount: 200, cadence: "calendar_year", enroll: true,
        note: "Incidentals (bags, seats, in-flight, lounge passes) on ONE selected airline. Pick the airline in January; it locks for the year." },
      { id: "equinox", label: "Equinox Credit", amount: 300, cadence: "calendar_year", enroll: true,
        note: "Equinox club or Equinox+ digital. Worth $0 if you don't already pay for Equinox; mute it if so." },
      { id: "clear", label: "CLEAR Plus", amount: 209, cadence: "calendar_year", auto: true,
        note: "Covers CLEAR Plus membership, applies automatically as CLEAR charges the card monthly." },
      { id: "walmart_plus", label: "Walmart+", amount: 155, cadence: "calendar_year", auto: true,
        note: "Covers monthly Walmart+ membership (includes Paramount+ or Peacock)." },
      { id: "uber_one", label: "Uber One", amount: 120, cadence: "anniversary_year", auto: true,
        note: "Covers the Uber One membership fee (separate from monthly Uber Cash)." },
      { id: "oura", label: "Oura Ring Credit", amount: 200, cadence: "anniversary_year",
        note: "One-time credit per cardmember year toward an Oura Ring or subscription." },
      { id: "saks", label: "Saks Fifth Avenue", amount: 50, cadence: "semiannual", endedOn: "2026-07-01",
        note: "DISCONTINUED July 1, 2026. Amex has said replacement retail offers are coming; watch announcements." },
    ],
  },
  {
    id: "gold",
    label: "Gold Card",
    annualFee: 325,
    benefits: [
      { id: "dining", label: "Dining Credit", amount: 10, cadence: "monthly", enroll: true,
        note: "Grubhub (incl. Seamless), The Cheesecake Factory, Five Guys, Buffalo Wild Wings, Wonder. $10/mo cap across all merchants." },
      { id: "uber_cash", label: "Uber Cash", amount: 10, cadence: "monthly",
        note: "$10/mo Uber rides or Uber Eats. Link the card in the Uber app; no enrollment." },
      { id: "dunkin", label: "Dunkin' Credit", amount: 7, cadence: "monthly", enroll: true,
        note: "$7/mo at U.S. Dunkin' locations." },
      { id: "resy", label: "Resy Credit", amount: 50, cadence: "semiannual", enroll: true,
        note: "$50 per half (Jan-Jun / Jul-Dec) at U.S. Resy-affiliated restaurants." },
      { id: "uber_one_promo", label: "Uber One (limited-time)", amount: 96, cadence: "calendar_year", enroll: true, endedOn: "2026-11-01",
        note: "Limited-time Amex Offer covering a year of Uber One, available through Oct 2026. Enroll via Amex Offers before it disappears." },
    ],
  },
  {
    id: "business-platinum",
    label: "Business Platinum Card",
    annualFee: 895,
    benefits: [
      { id: "dell", label: "Dell Technologies Credit", amount: 1150, cadence: "calendar_year", enroll: true,
        note: "$150 on U.S. Dell purchases, plus an additional $1,000 credit after $5,000+ of Dell spend in the calendar year." },
      { id: "chatgpt_business", label: "ChatGPT Business Credit", amount: 300, cadence: "calendar_year", enroll: true,
        note: "NEW 2026: up to $300/yr on U.S. ChatGPT Business purchases." },
      { id: "adobe", label: "Adobe Credit", amount: 250, cadence: "calendar_year", enroll: true,
        note: "$250 credit after $600+ of U.S. Adobe purchases in the calendar year." },
      { id: "indeed", label: "Indeed Credit", amount: 90, cadence: "quarterly", enroll: true,
        note: "$90/quarter on U.S. purchases directly with Indeed." },
      { id: "hilton", label: "Hilton Credit", amount: 50, cadence: "quarterly", enroll: true,
        note: "$50/quarter on eligible purchases directly with Hilton (Hilton for Business account required)." },
      { id: "airline_fee", label: "Airline Fee Credit", amount: 200, cadence: "calendar_year", enroll: true,
        note: "Incidentals on ONE selected qualifying airline per calendar year." },
      { id: "wireless", label: "Wireless Credit", amount: 10, cadence: "monthly", enroll: true,
        note: "$10/mo on U.S. wireless phone service purchases." },
      { id: "clear", label: "CLEAR Plus", amount: 209, cadence: "calendar_year", auto: true,
        note: "Covers CLEAR Plus membership, applies automatically as CLEAR charges the card." },
    ],
  },
  {
    id: "delta-gold",
    label: "Delta SkyMiles Gold",
    annualFee: 150,
    benefits: [
      { id: "delta_stays", label: "Delta Stays Credit", amount: 100, cadence: "calendar_year",
        note: "Up to $100/yr back on prepaid hotel or vacation-rental bookings via Delta Stays on delta.com." },
      { id: "rideshare", label: "Rideshare Credit", amount: 10, cadence: "monthly", enroll: true,
        note: "$10/mo on U.S. rideshare with select providers. Only active after your first card renewal on this tier." },
      { id: "flight_credit", label: "$200 Delta Flight Credit", amount: 200, cadence: "calendar_year",
        note: "Unlocks after $10,000 of purchases on the card in a calendar year. Track spend if you're close." },
    ],
  },
  {
    id: "delta-platinum",
    label: "Delta SkyMiles Platinum",
    annualFee: 350,
    benefits: [
      { id: "delta_stays", label: "Delta Stays Credit", amount: 150, cadence: "calendar_year",
        note: "Up to $150/yr back on prepaid Delta Stays bookings on delta.com." },
      { id: "resy", label: "Resy Credit", amount: 10, cadence: "monthly", enroll: true,
        note: "$10/mo at U.S. Resy-affiliated restaurants." },
      { id: "rideshare", label: "Rideshare Credit", amount: 10, cadence: "monthly", enroll: true,
        note: "$10/mo on U.S. rideshare with select providers." },
      { id: "companion_cert", label: "Companion Certificate (Delta Main)", amount: 1, unit: "cert", cadence: "anniversary_year",
        note: "Domestic / Caribbean / Central America round trip for a companion, issued each renewal, expires in a year. Taxes/fees $22-$250 apply. Book it before it dies." },
    ],
  },
  {
    id: "delta-reserve",
    label: "Delta SkyMiles Reserve",
    annualFee: 650,
    benefits: [
      { id: "delta_stays", label: "Delta Stays Credit", amount: 200, cadence: "calendar_year",
        note: "Up to $200/yr back on prepaid Delta Stays bookings on delta.com." },
      { id: "resy", label: "Resy Credit", amount: 20, cadence: "monthly", enroll: true,
        note: "$20/mo at U.S. Resy-affiliated restaurants ($240/yr)." },
      { id: "rideshare", label: "Rideshare Credit", amount: 10, cadence: "monthly", enroll: true,
        note: "$10/mo on U.S. rideshare with select providers." },
      { id: "companion_cert", label: "Companion Certificate (First/Comfort/Main)", amount: 1, unit: "cert", cadence: "anniversary_year",
        note: "Delta First, Comfort, or Main round trip for a companion, issued each renewal, expires in a year. Book it before it dies." },
    ],
  },
];

export const CARD_IDS = CARDS.map((c) => c.id);

export interface CardSetting {
  card: string;
  anniversaryMonth?: number;
  airline?: string;
}

export interface State {
  settings?: {
    cards?: CardSetting[];
    muted?: string[]; // "card.benefit"
    // legacy single-card (v0.2) fields:
    anniversaryMonth?: number;
    airline?: string;
  };
  usage?: Record<string, number>; // "card.benefit:window"
  log?: unknown[];
  lastUpdated?: string;
}

// Migrate a v0.2 single-card (Platinum) state to the multi-card shape. Idempotent.
export function migrateState(state: State): State {
  const s = state.settings;
  if (!s || s.cards) return state;
  const legacyKeys = state.usage ? Object.keys(state.usage) : [];
  const hadLegacy =
    s.anniversaryMonth !== undefined || s.airline !== undefined ||
    (s.muted?.length ?? 0) > 0 || legacyKeys.some((k) => !k.includes("."));
  if (!hadLegacy) return state;
  const card: CardSetting = { card: "platinum" };
  if (s.anniversaryMonth !== undefined) card.anniversaryMonth = s.anniversaryMonth;
  if (s.airline !== undefined) card.airline = s.airline;
  const muted = (s.muted ?? []).map((m) => (m.includes(".") ? m : `platinum.${m}`));
  const usage: Record<string, number> = {};
  for (const [k, v] of Object.entries(state.usage ?? {})) {
    usage[k.includes(".") ? k : `platinum.${k}`] = v;
  }
  return { ...state, settings: { cards: [card], muted }, usage };
}

export function windowKey(cardId: string, b: Benefit, now: Date, annivMonth?: number): string {
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const prefix = `${cardId}.${b.id}`;
  switch (b.cadence) {
    case "monthly": return `${prefix}:${y}-${String(m).padStart(2, "0")}`;
    case "quarterly": return `${prefix}:${y}Q${Math.ceil(m / 3)}`;
    case "semiannual": return `${prefix}:${y}H${m <= 6 ? 1 : 2}`;
    case "calendar_year": return `${prefix}:${y}`;
    case "anniversary_year": {
      const am = annivMonth ?? 1;
      return `${prefix}:${m >= am ? y : y - 1}A`;
    }
  }
}

export function windowEnd(b: Benefit, now: Date, annivMonth?: number): Date {
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  switch (b.cadence) {
    case "monthly": return new Date(y, m, 0, 23, 59, 59);
    case "quarterly": return new Date(y, Math.ceil(m / 3) * 3, 0, 23, 59, 59);
    case "semiannual": return new Date(y, m <= 6 ? 6 : 12, 0, 23, 59, 59);
    case "calendar_year": return new Date(y, 12, 0, 23, 59, 59);
    case "anniversary_year": {
      const am = annivMonth ?? 1;
      return new Date((m >= am ? y : y - 1) + 1, am - 1, 0, 23, 59, 59);
    }
  }
}

export async function loadState(ctx: unknown): Promise<{ state: State; statePath: string }> {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  const c = ctx as { pluginStorageDir?: string; workingDir?: string };
  const workspaceDir = process.env.VELLUM_WORKSPACE_DIR ?? c.workingDir ?? process.cwd();
  const storageDir = c.pluginStorageDir ?? path.join(workspaceDir, "plugins", "amex-perk-reminder", "data");
  await fs.mkdir(storageDir, { recursive: true });
  const statePath = path.join(storageDir, "benefit-state.json");
  let state: State = {};
  try {
    state = JSON.parse(await fs.readFile(statePath, "utf8"));
  } catch {
    // first run
  }
  return { state: migrateState(state), statePath };
}

export async function saveState(statePath: string, state: State): Promise<void> {
  const fs = await import("node:fs/promises");
  state.lastUpdated = new Date().toISOString();
  await fs.writeFile(statePath, JSON.stringify(state, null, 2), "utf8");
}
