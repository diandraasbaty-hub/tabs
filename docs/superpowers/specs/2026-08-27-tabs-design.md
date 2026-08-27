# TABS — design spec

**Date:** 2026-08-27
**Tagline:** keep tabs on your people

## What it is

You dump the three things open in your head, optionally add a selfie, and it
becomes a card you text to your friends. No accounts, no feed, no backend. The
friend receiving it needs nothing installed — it arrives as a picture in a
normal text thread.

The name carries both halves of the idea: *keeping tabs on each other*, and
*having too many tabs open*.

## Decisions made in the interview

| Question | Answer |
|---|---|
| Audience | General consumer. Not a bowling or Beyond the Lanes product. |
| The one core feature | The Top 3 post. Friend reactions are out of scope. |
| Delivery | Literally text it. iOS share sheet. No accounts, no backend. |
| Vibe | Bubbly and springy — gradients, chunky rounded type, everything bounces. |
| Slot 3 | Daily wildcard, same prompt for everyone that day, ~60 prompts. |
| Name | TABS (her idea, and better than the shortlist). |

## The three slots

1. **A random thought** — fixed
2. **What I'm doing** — fixed
3. **NEW TAB** — the daily wildcard, chosen deterministically from the date so
   everyone in the world gets the same third prompt on the same day

Each slot takes a mood dot (one of six emoji) so a line can be funny or heavy
without explaining itself.

## Screens

1. **Hello** — wordmark, a stack of squishy tabs, one button.
2. **Compose** — one tab at a time, springs to the next. Text + mood dot.
3. **Face** — optional photo or selfie, masked into a blob. Skippable.
4. **Card** — the rendered card, swatches to change the gradient, SEND TABS.

## The loop

Every card ends with `open yours →`. That is the only growth mechanic in v1 —
the card is the ad, and it lands in a thread where people already talk.

## Look

Squishy tabs: browser-tab structure, gummy texture. Rounded overlapping pills
that bounce when tapped. Candy gradients, six themes. Rounded sans throughout
(`ui-rounded` on Apple devices, Nunito elsewhere).

This is not a Beyond the Lanes product, so the BTL palette does not apply.

## Sharing — the important technical constraint

`navigator.share()` with a file is the happy path and works in Safari on iOS.
It is NOT reliable inside an embedded artifact viewer, and page-initiated
downloads are blocked there entirely. So the card is always ALSO presented as a
plain `<img>` the user can press and hold to save or copy. That fallback works
everywhere and is never hidden behind a failure.

## Storage

`localStorage` key `tabs-v1`. Holds a draft (so typing survives a reload) and
the last 7 days of cards. Photos are not stored in history — quota risk.

## Cut from v1

Accounts. Friend lists. A feed. Notifications. Streaks. Reactions returning to
the app. Groups. Any backend.

**Held for v1.1:** "close a tab" — reopening the app the next day shows
yesterday's three and lets you close one. The history storage is built for it;
the interaction is not wired up.

## Files

- `index.html` — markup for all four screens
- `css/app.css` — the whole look
- `js/prompts.js` — the ~60 wildcards + placeholder examples
- `js/state.js` — localStorage, draft, history, date-seeded wildcard pick
- `js/card.js` — canvas render of the card, share and save
- `js/app.js` — screen flow and interactions
- `build.js` — inlines everything into `dist/tabs.html` for publishing
