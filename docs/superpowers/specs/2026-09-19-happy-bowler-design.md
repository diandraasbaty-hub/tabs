# THE HAPPY BOWLER — design spec

**Date:** 2026-09-19
**Name:** The Happy Bowler (wordmark: THE HAPPY BOWLER)
**Tagline:** how'd it go? answer in three frames.

## What it is

The car ride home from the bowling center has one question in it: "How'd it
go?" The kid says "fine." The parent hears the score. Nobody is happier.

THE HAPPY BOWLER replaces that question with three frames. After a practice, a
league night, or a tournament block, the bowler fills in a STRIKE, a SPLIT and
a SPARE, rates the night in pins (not pinfall), and it becomes a scorecard-style
card they text to a parent, a coach, or the team thread. No accounts, no feed,
no backend. The person receiving it needs nothing installed.

The name is a title, not a how-to. Anyone can be the happy bowler on a given
night, and the card is how you claim it. The three frames are the whole method.

This is a TABS sibling: same engine (three slots, a daily shared prompt, a
rendered card, a link that bounces back). Different audience, different skin,
and this one IS a Beyond the Lanes product.

## Decisions made (assumed, not interviewed, override any of them)

| Question | Answer |
|---|---|
| Audience | Youth and college bowlers first, their parents and coaches second. League bowlers will find it on their own. |
| The one core feature | The three-frame card. Nothing else ships in v1. |
| Delivery | Text it. iOS share sheet, press-and-hold fallback, same as TABS. |
| Vibe | Cosmic bowling. Black-light neon on a dark lane, scorecard grid, chunky rounded type. Fun first, mindset second, never preachy. |
| Score | Optional. The pins-up meter is required, the pinfall score is not. Happy bowlers don't have to say. |
| Relationship to TABS | Fork the code, not the brand. Own repo or a `/happy` path, own icon, own link preview. |
| Money | Free. It is the top of the Beyond the Lanes funnel, not a new paid product. See "Where it fits" below. |

## The three frames

Bowling scoring already has a symbol for each one, so the card can use them.

1. **STRIKE** (X) — one thing that went right tonight, even if the score
   didn't. Fixed.
2. **SPLIT** (circle) — one thing I'm leaving at the lanes. Something to let go
   of before the parking lot. Fixed.
3. **SPARE** (/) — the pickup. The daily wildcard, chosen from the date so
   every bowler in the world gets the same third prompt on the same day. A
   whole team texting cards after Tuesday league all answer the same SPARE,
   which is the social hook.

Each frame takes a mood chip, one of six, tap to cycle:
🎳 😤 😅 🤩 😮‍💨 🥲

### Pins up

Instead of a mood for the whole card, a row of ten pins. Tap to knock down or
stand up. "Pins up: 8/10" is the happy score. It sits next to the optional real
score so the card can say `Score 168 · Pins up 9`, or just `Pins up 9`. A 142
with 9 pins up is the whole point of the product.

### The pickup bank (SPARE prompts)

Same rules as TABS wildcards: one line to answer, mix the silly with the real,
about 60 for v1. Starter set:

- the shot I'd like back
- the lane I owe an apology
- my pre-shot routine in three words
- the snack that carried me
- what my coach's voice said tonight
- a teammate who made it better
- the thing I did right that nobody saw
- what I'd tell frame-one me
- the moment I almost quit and didn't
- something I'm going to stop blaming the lanes for
- my ball's mood tonight
- the pin I hate most
- a bowler I want to be more like
- what I'm bringing to practice
- the best thing about tonight that wasn't bowling
- what I'd do with one more frame
- a habit I'm building at the line
- what my hands know that my head forgets
- the song I need on at the center
- the last time bowling felt easy
- who I'm bowling for
- what I want to hear in the car home
- the number I'm not going to think about
- the thing I'll say to my next split
- a tiny win I'd like credit for
- something the lanes taught me today
- my walk-up song, if I had one
- what I'd tell a first-timer
- the frame where I was actually having fun
- one thing bigger than the score

## Screens

Two, like TABS after the rebuild.

1. **Write** — THE HAPPY BOWLER wordmark, name chip, optional photo. Three frame cards on one
   screen (STRIKE, SPLIT, SPARE with today's pickup printed on it). The pin row
   and an optional score field under them. One button: BOWL HAPPY.
2. **Card** — the rendered card, swatches to change the neon, SEND. Below it
   the share row and "start over."

Plus the **Got one** screen when a link opens with a card in it: their card,
and a "Send yours back" button.

## The loop

Every card ends with `bowl happy →`. The card is the ad, and it lands in the
one place bowlers already talk: the team thread and the family thread.

The parent loop is the strong one. A parent who receives a card three weeks in
a row has been shown, three times, that the score is not the story. That is
the Out of the Settee pitch delivered by their own kid.

## Look

Cosmic bowling. Dark lane background (near-black navy), neon frame cards in
pink, cyan, lime and violet, a faint scorecard grid behind the wordmark. Pins
are drawn, not emoji, so they match on every phone. The three frame boxes on
the card use real scorecard corners: an X, a circle, a slash.

Type stays rounded and chunky (`ui-rounded` on Apple, Nunito elsewhere). Six
neon themes to swap, same swatch mechanic as TABS.

Beyond the Lanes brand rules apply to the wordmark lockup and the link-out, not
to the card palette. The card should look like it belongs at a bowling center at
9pm on a Friday, not on a coaching website.

## Where it fits in Beyond the Lanes

Free, and deliberately so. The business rule is no new paid products until the
existing ones have clear funnels, so this is a funnel, not a product.

- The `bowl happy →` link opens the app. The app footer carries one line:
  "Want the rest of the how-to?" → the parent lead magnet (5 Things Every
  Bowling Parent Needs to Know) or the free masterclass. That is the only
  Beyond the Lanes call to action in the app.
- Cards are natural organic content. A parent posting their kid's "Pins up 10
  on a 131" is the brand, unpaid.
- Workshops: STRIKE / SPLIT / SPARE is a 12 Frames exercise in disguise. It can
  be the take-home after any Champion's Path or 12 Frames session, so the room
  keeps doing the work after the workshop ends.
- EYT: the tour thread after every stop. Same prompt for every athlete that day.
- Merch, later: "The Happy Bowler" and "Pins up" are both shirt-ready. Not v1.

## Sharing, the technical constraint

Identical to TABS. `navigator.share()` with a file on iOS Safari is the happy
path; it is unreliable inside an embedded artifact viewer and downloads are
blocked there, so the card is always also a plain `<img>` to press and hold.
The link encodes the whole card in the URL so no server ever holds it.

## Storage

`localStorage` key `happy-v1`. A draft for today, and the last 30 cards
(text, moods, pins, score, date, no photos). Thirty rather than seven, because
a bowler's history is a real thing: a month of SPLITs is a coaching
conversation. Reading it back in-app is not in v1.

## Cut from v1

Accounts. Team rosters. A feed. Streaks. Coach dashboards. Reactions. Any
backend. Reading your own history in the app. Pinfall stats of any kind. This
is not a scoring app and must never drift into one.

**Held for v1.1:** "the month" — open the app and see your last four SPAREs in
a strip. Storage is built for it, the screen is not.

## Files

Fork of TABS with these changes:

- `js/prompts.js` — the pickup bank replaces WILDCARDS; bowling-flavored
  placeholder examples; the six moods.
- `js/card.js` — LABELS become STRIKE / SPLIT / SPARE; the pin row and optional
  score render on the card; neon THEMES; `bowl happy →`.
- `js/state.js` — key `happy-v1`, 30-card history, pins and score in the draft.
- `js/app.js` — pin row interaction and score field on the write screen.
- `css/app.css` — cosmic bowling skin.
- `index.html` — wordmark, meta, link preview.
- `api/` — link preview renders the frames and the pins.
