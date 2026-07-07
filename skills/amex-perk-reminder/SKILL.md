# Amex Perk Reminder

Track every credit on the Amex cards the user actually holds and nag before anything expires unused. Supports six cards: **Platinum** ($3,084/yr in credits), **Gold**, **Business Platinum**, **Delta SkyMiles Gold / Platinum / Reserve**. Reminders are status-aware: if a credit is already used, the plugin stays silent.

## Setup (run once, right after install)

1. **Ask which Amex cards the user holds.** This is the first question, before anything else. Supported ids: `platinum`, `gold`, `business-platinum`, `delta-gold`, `delta-platinum`, `delta-reserve`. Users often hold more than one (Platinum + a Delta card is common). Save each with `update-benefit-settings` `addCards`.
2. **Per card, ask only what that card needs:**
   - **Anniversary month** for cards with cardmember-year benefits (Platinum: Oura + Uber One; Delta Platinum/Reserve: companion certificate). If they don't know it, offer to find the application date in their email.
   - **Selected airline** for cards with the $200 Airline Fee Credit (Platinum, Business Platinum). If unselected, remind them it's chosen on the Amex site and locks for the calendar year.
   - **Mutes** for credits that don't apply to their life. Mute keys are `card.benefit`, e.g. `platinum.equinox`, `platinum.walmart_plus`, `business-platinum.indeed`. Common mutes: Equinox (worth $0 unless they already pay for it), CLEAR (worth $0 if their airport lacks CLEAR), Dell/Indeed/Adobe for non-business spenders.
3. **Flag enrollment-required credits.** Many credits pay nothing until enrolled in the Amex account (the status tool marks these with `enrollmentRequired`). During setup, list the unenrolled-looking ones and tell the user to enroll once at americanexpress.com; no enrollment = no credit, and Amex never applies them retroactively.
4. **Detect the reminder channel.** Check which channels are connected (Slack, Telegram, email/Gmail, in-app). Delivery priority: **Slack > Telegram > email > in-app chat**. Don't ask the user to pick; use the best connected one and mention it in the setup recap.
5. **Create the scheduler jobs** below.
6. **Announce what setup did:** which cards and credits are tracked, what's muted, which channel reminders use, what runs automatically when. Make clear nothing is ever purchased or booked automatically: reminders only.

## Scheduler jobs

Every job's prompt follows the same protocol: **run `get-benefit-status` first (it covers all configured cards). If the response has no alerts and nothing fresh to announce, do nothing: send no message.** Otherwise send a short reminder (exact dollar amounts + deadline dates) via the user's best connected channel.

```
assistant scheduler create \
  --name "Amex month open" \
  --schedule "0 9 1 * *" \
  --action "Amex Perk Reminder: run get-benefit-status across all cards. Announce this month's fresh monthly credits per card (Platinum: $25 digital entertainment + $15 Uber Cash, $20 in December; Gold: $10 dining + $10 Uber Cash + $7 Dunkin'; Business Platinum: $10 wireless; Delta cards: $10 rideshare, Delta Plat/Reserve Resy). On Jan/Apr/Jul/Oct also the fresh quarterly credits (Platinum Resy $100 + lululemon $75; Business Platinum Indeed $90 + Hilton $50). On Jan 1 and Jul 1 also the fresh Platinum $300 hotel credit (book early, FHR availability thins near deadlines) and the fresh Gold $50 Resy half. In January remind about airline selection for any card with the $200 fee credit. Skip muted benefits. Deliver via best connected channel (Slack > Telegram > email)."

assistant scheduler create \
  --name "Amex monthly sweep" \
  --schedule "0 9 24 * *" \
  --action "Amex Perk Reminder: run get-benefit-status across all cards. If monthly credits are still unused with under a week left, nag with exact remaining dollars per card. If everything monthly is used or muted, send nothing."

assistant scheduler create \
  --name "Amex quarter close" \
  --schedule "0 9 20 3,6,9,12 *" \
  --action "Amex Perk Reminder: run get-benefit-status across all cards. About 10 days left in the quarter: alert on unused quarterly credits (Platinum Resy/lululemon, Business Platinum Indeed/Hilton). In June and December, also surface unused semiannual and calendar-year credits (hotel, airline fee, Delta Stays, Dell, Adobe, ChatGPT Business, Gold Resy half) as CRITICAL. Send nothing if all clear."

assistant scheduler create \
  --name "Amex hotel credit escalation" \
  --schedule "0 9 15 5,6,11,12 *" \
  --action "Amex Perk Reminder: run get-benefit-status and check the Platinum hotel credit and any Delta Stays credits. If the Platinum current half's $300 is unused: May/Nov = heads-up (suggest 2-3 concrete FHR/THC options for trips the user has coming up, check their calendar and trip records if available); Jun/Dec = CRITICAL, deadline is the end of this month, push hard for a booking this week. In Nov/Dec also flag unused Delta Stays dollars (calendar-year deadline). If already used, send nothing. Skip cards the user doesn't hold."
```

Plus one job per card with an anniversary month, created at setup time (replace `<M>` with the month number):

```
assistant scheduler create \
  --name "Amex anniversary credits" \
  --schedule "0 9 1 <M> *" \
  --action "Amex Perk Reminder: run get-benefit-status. New cardmember year: announce reset anniversary benefits for this card (Platinum: Oura $200 + Uber One $120 auto-renewal; Delta Platinum/Reserve: fresh companion certificate, book it before it expires). Skip muted benefits, send nothing if all are muted."
```

And one catalog-freshness job so this plugin never serves stale benefit data:

```
assistant scheduler create \
  --name "Amex catalog verify" \
  --schedule "0 10 2 1,4,7,10 *" \
  --action "Amex Perk Reminder maintenance: web-search the current US Amex statement credits for each card the user holds (amounts, cadences, reset windows, new or discontinued credits). Compare against the benefit reference tables in the amex-perk-reminder SKILL.md. If Amex changed anything (like the Saks credit ending Jul 1, 2026 or its promised replacement retail offers arriving), tell the user exactly what changed and how it affects their reminders. If nothing changed, send nothing."
```

## Reminder delivery rules

- **Never batch a critical alert.** `critical` urgency (7 days or less, money on the table) goes out the moment a scheduled check finds it, as its own message.
- `closing` and `heads_up` items may be grouped into one digest message.
- Always include exact dollars remaining, the card, and the hard deadline date. "Use your credits" is noise; "$300 hotel credit on the Platinum dies Dec 31, book a prepaid FHR stay this week" is a reminder.
- If the user says they used a benefit, call `log-benefit-use` immediately (pass the card id if the benefit exists on more than one of their cards), then confirm what's still open in that window.
- Companion certificates track as 1 unit per cardmember year, not dollars. Log with amount 1.
- If `get-benefit-status` returns `setupNeeded`, run the setup interview instead of sending reminders.

## Benefit reference (2026, US cards)

### Platinum ($895/yr)

| Benefit | Amount | Window | Notes |
|---|---|---|---|
| Hotel (FHR/THC) | $300 | Semiannual | Prepaid, 2+ nights, via Amex Travel. The big one. |
| Resy | $100 | Quarterly | Any US Resy restaurant. Enroll. |
| lululemon | $75 | Quarterly | Enroll. |
| Digital Entertainment | $25 | Monthly | Enroll. |
| Uber Cash | $15 ($20 Dec) | Monthly | Link card in Uber app. |
| Airline Fee | $200 | Calendar year | One airline, locks in January. |
| Equinox | $300 | Calendar year | Mute if not a member. |
| CLEAR Plus | $209 | Calendar year | Auto. |
| Walmart+ | $155 | Calendar year | Auto. |
| Uber One | $120 | Cardmember year | Auto. |
| Oura | $200 | Cardmember year | One-time per year. |
| Saks | ~~$50~~ | ~~Semiannual~~ | ENDED Jul 1, 2026. Replacement retail offers promised. |

### Gold ($325/yr)

| Benefit | Amount | Window | Notes |
|---|---|---|---|
| Dining | $10 | Monthly | Grubhub, Cheesecake Factory, Five Guys, BWW, Wonder. Enroll. |
| Uber Cash | $10 | Monthly | Link card in Uber app. |
| Dunkin' | $7 | Monthly | Enroll. |
| Resy | $50 | Semiannual | Enroll. |
| Uber One promo | $96 | One-time | Limited-time Amex Offer through Oct 2026. Enroll fast. |

### Business Platinum ($895/yr)

| Benefit | Amount | Window | Notes |
|---|---|---|---|
| Dell | $150 + $1,000 | Calendar year | $1,000 tier needs $5k Dell spend. Enroll. |
| ChatGPT Business | $300 | Calendar year | NEW 2026. Enroll. |
| Adobe | $250 | Calendar year | After $600 Adobe spend. Enroll. |
| Indeed | $90 | Quarterly | Enroll. |
| Hilton | $50 | Quarterly | Hilton for Business. Enroll. |
| Airline Fee | $200 | Calendar year | One airline. |
| Wireless | $10 | Monthly | Enroll. |
| CLEAR Plus | $209 | Calendar year | Auto. |

### Delta SkyMiles Gold ($150) / Platinum ($350) / Reserve ($650)

| Benefit | Gold | Platinum | Reserve | Window |
|---|---|---|---|---|
| Delta Stays | $100 | $150 | $200 | Calendar year |
| Rideshare | $10/mo (after first renewal) | $10/mo | $10/mo | Monthly. Enroll. |
| Resy | - | $10/mo | $20/mo | Monthly. Enroll. |
| Companion certificate | - | Main cabin | First/Comfort/Main | Cardmember year. Expires in 1 year. |
| $200 flight credit | After $10k spend/yr | - | - | Calendar year |

## What this plugin never does

- Never books, purchases, or enrolls in anything. Reminders and tracking only.
- Never messages the user when everything is covered. Silence means all good.
- Never reads card statements or transactions. Usage is what the user (or the assistant on their behalf) logs via `log-benefit-use`.
