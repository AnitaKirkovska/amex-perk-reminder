# Amex Platinum Perk Reminder

Track your Amex Platinum benefits and get reminded before credits expire. Install the plugin and the assistant sets up recurring reminders — no config needed.

## Setup

```
assistant plugins install amex-perk-reminder
```

On install, create these scheduler jobs:

```
assistant scheduler create \
  --name "Hotel Credit Reminder" \
  --schedule "0 12 1 6,12 *" \
  --action "Remind me my $300 Amex hotel credit resets this month. Book via Amex Travel (FHR or 2+ night THC) to use it before it expires."

assistant scheduler create \
  --name "Saks Credit Reminder" \
  --schedule "0 12 15 2,8 *" \
  --action "Remind me my $50 Saks credit is mid-cycle. Use it by end of Jun/Dec."

assistant scheduler create \
  --name "Uber Cash Reminder" \
  --schedule "0 12 1 * *" \
  --action "Remind me my $15 Amex Uber Cash just landed. Use it on Uber or Uber Eats this month."

assistant scheduler create \
  --name "Resy Dining Reminder" \
  --schedule "0 12 1 * *" \
  --action "Remind me my $33 Resy dining credit is available this month."

assistant scheduler create \
  --name "Airline Fee Credit Check" \
  --schedule "0 12 1 3,6,9,12 *" \
  --action "Check how much of my $200 airline fee credit I've used this year. Bags, seats, lounge passes on my selected airline count."
```

All dates are calendar-year / semi-annual windows. Credits reset Jan 1 and Jul 1 unless noted.

## Usage

Ask the assistant:

- "what amex perks are about to expire?"
- "how much hotel credit have i used this half?"
- "set up my amex tracking"
- "amex status"

The assistant reads this skill file and the `get-benefit-status` tool to answer. When you use a credit, tell the assistant and it tracks it locally.

## Perk Reference (2026 US Amex Platinum)

| Perk | Value | Frequency | Reset |
|------|-------|-----------|-------|
| Hotel Credit (FHR/THC) | $300/semi | Semi-annual | Jan 1, Jul 1 |
| Resy Dining | $400/yr | Monthly | Each month |
| Uber Cash | $200/yr | Monthly | Each month |
| Airline Fee Credit | $200/yr | Annual | Jan 1 |
| Digital Entertainment | $240/yr | Monthly | Each month |
| Saks Fifth Avenue | $100/yr | Semi-annual | Jan 1, Jul 1 |
| CLEAR Plus | Up to $199 | Annual | Membership anniversary |
| Global Entry/TSA Pre | Up to $120 | Once/4-5yr | Upon expiry |
| Walmart+ | ~$155/yr | Annual | Jan 1 |
| SoulCycle/Equinox+ | Varies | Monthly | Check current |

**Total easy value:** $1,500-1,900/yr against $895 annual fee.
