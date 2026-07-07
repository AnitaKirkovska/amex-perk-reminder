# Amex Perk Reminder 🏦

Never lose a $300 hotel credit again because you forgot to book by July 1.

Amex cards bury their annual fees under a pile of statement credits with expiring windows: monthly, quarterly, semiannual, calendar-year, cardmember-year. Miss a window and that money is gone. This plugin does the remembering across **every Amex card you hold**, and only speaks up when a credit is actually at risk.

## Cards supported

| Card | Annual fee | Credits tracked |
|---|---|---|
| Platinum | $895 | $3,084/yr across 12 windows (hotel, Resy, lululemon, streaming, Uber, airline, Equinox, CLEAR, Walmart+, Uber One, Oura) |
| Gold | $325 | Dining, Uber Cash, Dunkin', Resy, limited-time Uber One offer |
| Business Platinum | $895 | Dell ($1,150), ChatGPT Business ($300 NEW), Adobe, Indeed, Hilton, airline, wireless, CLEAR |
| Delta SkyMiles Gold | $150 | Delta Stays $100, rideshare, $200 flight credit after $10k spend |
| Delta SkyMiles Platinum | $350 | Delta Stays $150, Resy, rideshare, companion certificate |
| Delta SkyMiles Reserve | $650 | Delta Stays $200, Resy $240/yr, rideshare, companion certificate |

Hold more than one? It tracks them all, with per-card windows and per-card anniversary dates.

## How it works

1. Install the plugin
2. The assistant asks which Amex cards you hold, then only what those cards need (anniversary month, airline, credits to mute) and creates recurring reminder jobs
3. Reminders arrive on your best connected channel: **Slack > Telegram > email > in-app**
4. Reminders are **status-aware**: the assistant checks what you've used first. Used your hotel credit? Silence. Unused with 2 weeks left? Escalating nag with exact dollars and the deadline.

No cron surface in the plugin manifest: the skill instructs the assistant to create jobs with its built-in scheduler on install.

## What runs automatically

| Job | When | What it does |
|---|---|---|
| Month open | 1st, 9am | Fresh monthly credits on every card, plus quarterly/semiannual/airline resets when applicable |
| Monthly sweep | 24th, 9am | Nags on unused monthly credits, silent if used |
| Quarter close | Mar/Jun/Sep/Dec 20 | Unused quarterly credits; Jun/Dec also escalate hotel, Delta Stays, and annual credits |
| Hotel escalation | May/Jun/Nov/Dec 15 | The anti-lost-hotel-credit job. Unused Platinum $300? May/Nov suggests concrete FHR bookings, Jun/Dec goes critical |
| Anniversary | Your card month(s) | Oura reset, Uber One renewal, fresh companion certificates |
| Catalog verify | Jan/Apr/Jul/Oct 2 | Web-checks current Amex terms per card, flags benefit changes |

Reminders only. It never books, buys, enrolls, or messages anyone but you.

## Tools

| Tool | What it does |
|---|---|
| `get-benefit-status` | Per-card credit overview: used / remaining / days left per window, urgency-ranked alerts across all your cards |
| `log-benefit-use` | Records usage ("I spent $60 at a Resy spot") so reminders stop nagging. Resolves the card automatically when unambiguous |
| `update-benefit-settings` | Add/remove cards, per-card anniversary month and airline, mute credits you don't use |

## Structure

```
amex-perk-reminder/
├── package.json
├── README.md
├── lib/
│   └── catalog.ts                 # 2026 benefit catalogs for all 6 cards + state, windows, migration
├── skills/
│   └── amex-perk-reminder/
│       └── SKILL.md               # Setup interview, scheduler jobs, delivery rules, benefit reference
└── tools/
    ├── get-benefit-status.ts      # Status + urgency-ranked alerts
    ├── log-benefit-use.ts         # Persist credit usage per card and window
    └── update-benefit-settings.ts # Cards, anniversaries, airlines, mutes
```

## Example prompts

- "set up my amex tracking"
- "amex status"
- "what perks are about to expire?"
- "I booked the hotel through Amex Travel, $300"
- "I used my Delta companion certificate"
- "I don't care about Equinox or lululemon"

MIT licensed.
