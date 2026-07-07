# Amex Platinum Perk Reminder

Track every 2026 Amex Platinum credit ($3,084/yr across 12 credits, against the $895 fee) and get nagged before anything expires unused. Reminders are status-aware: if you've already used a credit, the plugin stays silent.

## Setup (run once, right after install)

1. **Interview the user, briefly.** Ask only:
   - Cardmember anniversary month (drives the Oura + Uber One windows). If they don't know it offhand, offer to find the anniversary from their card statements or emails.
   - Which airline they selected for the $200 Airline Fee Credit this year (or remind them to pick one on the Amex site: it locks for the calendar year).
   - Which credits don't apply to their life. Common mutes: `equinox` (only worth it if they already pay for Equinox), `lululemon`, `walmart_plus`, `oura`, `clear` (worth $0 if their airport doesn't have CLEAR). Save with `update-benefit-settings`.
2. **Save settings** via `update-benefit-settings` (anniversaryMonth, airline, mute list).
3. **Detect the reminder channel.** Check which channels are connected for this user (Slack, Telegram, email/Gmail, in-app). Reminder delivery priority: **Slack > Telegram > email > in-app chat**. Do not ask the user to pick: use the best connected one, and mention in the setup recap which channel reminders will use.
4. **Create the scheduler jobs** below with the assistant's built-in scheduler.
5. **Announce what setup did:** which credits are tracked, which are muted, which channel reminders use, and what runs automatically when. Make clear nothing is ever purchased or booked automatically: reminders only.

## Scheduler jobs

Every job's prompt follows the same protocol: **run `get-benefit-status` first. If the response has no alerts and nothing fresh to announce, do nothing: send no message.** Otherwise send a short reminder (exact dollar amounts + deadline dates) via the user's best connected channel.

```
assistant scheduler create \
  --name "Amex month open" \
  --schedule "0 9 1 * *" \
  --action "Amex Perk Reminder: run get-benefit-status. Announce this month's fresh credits: $25 digital entertainment + $15 Uber Cash ($20 in December) always; on Jan/Apr/Jul/Oct also the fresh $100 Resy + $75 lululemon quarter; on Jan 1 and Jul 1 also the fresh $300 hotel credit (tell the user to book early, FHR availability thins near deadlines); in January also remind them to select their airline for the $200 fee credit. Skip muted benefits. Deliver via best connected channel (Slack > Telegram > email)."

assistant scheduler create \
  --name "Amex monthly sweep" \
  --schedule "0 9 24 * *" \
  --action "Amex Perk Reminder: run get-benefit-status. If monthly credits (digital entertainment, Uber Cash) are still unused with under a week left, nag with exact remaining dollars. If everything monthly is used or muted, send nothing."

assistant scheduler create \
  --name "Amex quarter close" \
  --schedule "0 9 20 3,6,9,12 *" \
  --action "Amex Perk Reminder: run get-benefit-status. About 10 days left in the quarter: alert on unused Resy ($100/q) and lululemon ($75/q) amounts. In June and December, also surface any unused hotel credit, airline fee credit, and calendar-year credits as CRITICAL. Send nothing if all clear."

assistant scheduler create \
  --name "Amex hotel credit escalation" \
  --schedule "0 9 15 5,6,11,12 *" \
  --action "Amex Perk Reminder: run get-benefit-status and check ONLY the hotel credit. If the current half's $300 is unused: May/Nov = heads-up (suggest 2-3 concrete FHR/THC options for trips the user has coming up, check their calendar and trip records if available); Jun/Dec = CRITICAL, deadline is the end of this month, push hard for a booking this week. If already used, send nothing."
```

Plus one job created at setup time from the anniversary month (replace `<M>` with the month number):

```
assistant scheduler create \
  --name "Amex anniversary credits" \
  --schedule "0 9 1 <M> *" \
  --action "Amex Perk Reminder: run get-benefit-status. New cardmember year: Oura Ring $200 credit reset (one-time per year) and Uber One $120 renewal will auto-charge. Skip muted benefits, send nothing if both are muted."
```

And one catalog-freshness job so this plugin never serves stale benefit data:

```
assistant scheduler create \
  --name "Amex catalog verify" \
  --schedule "0 10 2 1,4,7,10 *" \
  --action "Amex Perk Reminder maintenance: web-search the current US Amex Platinum statement credits (amounts, cadences, reset windows, new or discontinued credits). Compare against the benefit reference table in the amex-perk-reminder SKILL.md. If Amex changed anything (like the Saks credit ending Jul 1, 2026 or its promised replacement retail offers arriving), tell the user exactly what changed and how it affects their reminders. If nothing changed, send nothing."
```

## Reminder delivery rules

- Channel priority: Slack DM > Telegram > email (send from the user's connected Gmail to themselves, subject like "Amex: $300 hotel credit expires in 16 days") > in-app.
- Escalation tone tracks urgency from `get-benefit-status`: `heads_up` = one calm line, `closing` = direct with the deadline date, `critical` = lead with the dollar amount being lost and a concrete action ("book any FHR night $300+ before Jun 30").
- Never batch a critical alert into a digest. Critical goes out alone, immediately.
- When the user says they used a credit (in any conversation, e.g. "booked the hotel through Amex Travel"), call `log-benefit-use` right then. Booking confirmations spotted in their email count too: log them and tell the user you did.

## Usage

- "amex status" / "what perks are about to expire?" → `get-benefit-status`
- "I spent $60 at a Resy place" → `log-benefit-use` (benefit: resy, amount: 60)
- "I don't care about lululemon" → `update-benefit-settings` (mute)
- "my card anniversary is March" → `update-benefit-settings` (anniversaryMonth: 3)

## 2026 Benefit Reference (US Amex Platinum, $895 AF)

| Credit | Window amount | Cadence | Window |
|---|---|---|---|
| Hotel (FHR / THC prepaid via Amex Travel) | $300 | Semiannual | Jan-Jun, Jul-Dec |
| Resy Dining | $100 | Quarterly | Calendar quarters |
| lululemon | $75 | Quarterly | Calendar quarters |
| Digital Entertainment | $25 | Monthly | Calendar month |
| Uber Cash | $15 ($20 Dec) | Monthly | Calendar month |
| Airline Fee (one selected airline) | $200 | Annual | Calendar year |
| Equinox | $300 | Annual | Calendar year |
| CLEAR Plus (auto) | ~$209 | Annual | Calendar year |
| Walmart+ (auto) | ~$155 | Annual | Calendar year |
| Uber One (auto) | $120 | Annual | Cardmember year |
| Oura Ring | $200 | Annual, one-time | Cardmember year |
| ~~Saks Fifth Avenue~~ | ~~$50~~ | Semiannual | **Ended Jul 1, 2026.** Amex says replacement retail offers are coming: surface any announcement to the user. |

Auto credits (CLEAR, Walmart+, Uber One) apply when the merchant charges the card: no reminders needed beyond verifying they bill the Platinum. Enrollment-required credits (Resy, Digital Entertainment, lululemon, Equinox, airline selection) need one-time activation in the Amex app; check during setup that the user has enrolled.

## What this plugin never does

Reminders and tracking only. It never books, buys, enrolls, or messages anyone but the user.
