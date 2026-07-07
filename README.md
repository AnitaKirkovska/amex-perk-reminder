# Amex Platinum Perk Reminder 🏦

Never lose a $300 hotel credit again because you forgot to book by July 1.

The 2026 Amex Platinum ($895/yr) carries **$3,084 in annual statement credits across 12 different windows**: monthly, quarterly, semiannual, calendar-year, and cardmember-year. Miss a window and that money is gone. This plugin does the remembering, and only speaks up when a credit is actually at risk.

## How it works

1. Install the plugin
2. The assistant runs a 3-question setup (anniversary month, airline, credits to mute) and creates recurring reminder jobs
3. Reminders arrive on your best connected channel: **Slack > Telegram > email > in-app**
4. Reminders are **status-aware**: the assistant checks what you've used first. Used your hotel credit? Silence. Unused with 2 weeks left? Escalating nag with exact dollars and the deadline.

No cron surface in the plugin manifest: the skill instructs the assistant to create jobs with its built-in scheduler on install.

## What runs automatically

| Job | When | What it does |
|---|---|---|
| Month open | 1st, 9am | Fresh monthly credits ($25 streaming, $15 Uber Cash), plus quarterly/hotel/airline resets when applicable |
| Monthly sweep | 24th, 9am | Nags on unused monthly credits, silent if used |
| Quarter close | Mar/Jun/Sep/Dec 20 | Unused Resy ($100/q) + lululemon ($75/q); Jun/Dec also escalate hotel + annual credits |
| Hotel escalation | May/Jun/Nov/Dec 15 | The anti-lost-hotel-credit job. Unused $300? May/Nov suggests concrete FHR bookings, Jun/Dec goes critical |
| Anniversary | Your card month | Oura $200 reset + Uber One renewal |

Reminders only. It never books, buys, enrolls, or messages anyone but you.

## Tools

| Tool | What it does |
|---|---|
| `get-benefit-status` | Full 2026 credit overview: used / remaining / days left per window, urgency-ranked alerts |
| `log-benefit-use` | Records usage ("I spent $60 at a Resy spot") so reminders stop nagging |
| `update-benefit-settings` | Anniversary month, selected airline, mute credits you don't use |

## 2026 credits tracked

Hotel $600 (2x $300 semiannual, FHR/THC via Amex Travel) · Resy $400 ($100/q) · Digital Entertainment $300 ($25/mo) · Equinox $300 · lululemon $300 ($75/q) · CLEAR Plus ~$209 · Uber Cash $200 ($15/mo, $20 Dec) · Oura $200 · Airline Fee $200 · Walmart+ ~$155 · Uber One $120 · ~~Saks $100~~ (ended Jul 1, 2026)

## Structure

```
amex-perk-reminder/
├── package.json
├── README.md
├── skills/
│   └── amex-perk-reminder/
│       └── SKILL.md               # Setup interview, scheduler jobs, delivery rules, benefit reference
└── tools/
    ├── get-benefit-status.ts      # Status + urgency-ranked alerts
    ├── log-benefit-use.ts         # Persist credit usage per window
    └── update-benefit-settings.ts # Anniversary, airline, mutes
```

## Example prompts

- "set up my amex tracking"
- "amex status"
- "what perks are about to expire?"
- "I booked the hotel through Amex Travel, $300"
- "I don't care about Equinox or lululemon"

MIT licensed.
