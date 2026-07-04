# Amex Platinum Perk Reminder 🏦

Never lose a $300 hotel credit again because you forgot to book by July 1.

The Amex Platinum ($895/yr) has ~$1,500 in easy credits — hotel, dining, Uber, airline fees, Saks, entertainment. The catch is you have to *remember* to use them within specific windows, or they disappear. This plugin does the remembering.

## How it works

1. Install the plugin
2. The assistant reads the skill and creates recurring reminder jobs
3. You get notifications before credits expire — hotel credits 1 month out, Saks mid-cycle, Uber/Resy monthly, airline quarterly

No cron surface in the plugin manifest (the harness only knows hooks/skills/tools). The workaround: the skill's setup instructions tell the assistant to create scheduler jobs natively. Same result, automatic on install.

## Structure

```
amex-perk-reminder/
├── package.json         # Plugin manifest
├── README.md
├── skills/
│   └── amex-perk-reminder/
│       └── SKILL.md     # Full benefit calendar + setup instructions
└── tools/
    └── get-benefit-status.ts  # On-demand perk check + expiry warnings
```

## Benefits tracked

| Perk | Value | Frequency | Reminder cadence |
|------|-------|-----------|------------------|
| Hotel Credit (FHR/THC) | $600/yr | Semi-annual | Dec 1, Jun 1 — 1 month before reset |
| Resy Dining | $400/yr | Monthly | 1st of every month |
| Uber Cash | $200/yr | Monthly | 1st of every month |
| Airline Fee Credit | $200/yr | Annual | Quarterly check-in |
| Digital Entertainment | $240/yr | Monthly | 15th of every month |
| Saks Fifth Avenue | $100/yr | Semi-annual | Mid-cycle + end-of-window |
| CLEAR Plus, TSA PreCheck, Walmart+ | Various | Annual/once | On relevant schedule |

## Why this exists

Anita lost her $300 H1 hotel credit because she didn't book a hotel by July 1. Told me about it, and I said let's build a plugin so it doesn't happen again.

## Future

- Parse Amex email statements to auto-detect triggered credits
- FHR booking alert when a hotel qualifies
- Multi-card (Gold/Green) support

---

*Not affiliated with American Express. Verify your benefit details on your Amex account.*
