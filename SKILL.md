# Amex Platinum Perk Reminder

A Vellum plugin skill that tracks your Amex Platinum benefits and reminds you before they expire. Because losing a $300 hotel credit because you forgot to book by July 1st is a bad way to learn.

## How it works

On install, this skill tells the assistant to set up periodic reminder jobs. No cron in the plugin manifest — the scheduler is the assistant's built-in system, the plugin just configures it.

```
assistant plugins install amex-perk-reminder
```

The assistant reads this SKILL.md, creates the recurring jobs, and you're set.

## Perk Calendar (2026 US Amex Platinum)

All semi-annual credits reset **Jan 1** and **Jul 1**. Some are calendar-year, some are membership-year — this skill tracks both.

### Semi-annual (resets Jan 1 + Jul 1)

| Perk | Amount | Window | Reminder |
|------|--------|--------|----------|
| Hotel Credit (FHR/THC) | $300 | Jan-Jun, Jul-Dec | **1 month before reset** (Dec 1, Jun 1) + **2 weeks before** |
| Saks Fifth Avenue | $50 | Jan-Jun, Jul-Dec | **Mid-cycle** (Feb 15, Aug 15) + **2 weeks before reset** |

### Monthly

| Perk | Amount | Notes | Reminder |
|------|--------|-------|----------|
| Uber Cash | $15 ($35 Dec) | Uber, Uber Eats | **Monthly** — easy to lose if you don't order Uber regularly |
| Resy Dining | $33.33/mo | $400/yr dining at Resy restaurants | **Monthly** |

### Annual (calendar year)

| Perk | Amount | Notes | Reminder |
|------|--------|-------|----------|
| Airline Fee Credit | $200 | Incidental fees (bags, seats, lounge) on selected airline | **Quarterly** — soft reminder to use or lose |
| Digital Entertainment | $240 | Peacock, WSJ, NYT, Disney bundle, etc (up to $20/mo) | **Yearly enrollment** reminder, then monthly soft check |
| CLEAR® Plus | Up to $199 | Covers membership | **At renewal** |
| Global Entry/TSA PreCheck | Up to $120 | Once per 4-5 years | **One-time** — only relevant if expired |
| Walmart+ | ~$13/mo | Free membership, Paramount+ included | **Monthly** soft reminder |
| SoulCycle | Up to $300 | $25/mo Equinox+ credit? (varying) | Check current |

### Lounge Access (no dollar cap, always on)

- Centurion Lounge (unlimited)
- Delta SkyClub (when booking Delta)
- Priority Pass (enrollment required)
- Plaza Premium

## Scheduled Jobs

The assistant creates these on install:

1. **`amex-reminder-hotel-semi`** — fires Jun 1 + Dec 1 (`0 12 1 6,12 *`). "Your $300 Amex hotel credit resets at month end. Check if you have any FHR/THC bookings planned. Book via Amex Travel for the credit to apply."
2. **`amex-reminder-saks-semi`** — fires Feb 15 + Aug 15. "Your $50 Saks credit is mid-cycle. It resets end of Jun/Dec."
3. **`amex-reminder-uber-monthly`** — fires 1st of each month. "Your $15 Uber Cash just landed. Use it or lose it this month."
4. **`amex-reminder-resy-monthly`** — fires 1st. "Your $33 Resy credit for the month. Book a dinner."
5. **`amex-reminder-airline-annual`** — fires quarterly (Mar 1, Jun 1, Sep 1, Dec 1). "You've used $X of $200 airline fee credit this year. Bags, seats, lounge passes all count toward your selected airline."
6. **`amex-reminder-entertainment-monthly`** — fires 15th. "Your $20 Amex digital entertainment credit. Peacock, WSJ, NYT, Disney streaming — checked off this month?"

## Total Potential Value

~$1,500-$1,900/year in easy credits vs $895 annual fee.

The hotel credit ($600), dining ($400), airline ($200), and entertainment ($240) alone cover the fee. Everything else is pure upside — if you remember to use it.

## Query Tool

The plugin also ships a `get_benefit_status` tool that the assistant can call on demand:

```
"how much of my amex hotel credit have i used this half?"
"what amex perks are about to expire?"
"amex status"
```

The tool reads from a local state file (created when you track usage via the reminders) and returns your current progress against each perk.

## Future

- **Statement credit detection** (parse Amex emails for triggered credits)
- **FHR booking alert** when a hotel booking qualifies for the credit
- **Multi-card support** if she has Gold/Green too

---

*Not affiliated with American Express. Verify benefit details on your account.*
