# TABS

Three things open in your head. Send them to someone.

**Live:** https://diandraasbaty-hub.github.io/tabs/

You dump the three things rattling around your head — a random thought, what
you're doing, and a daily wildcard prompt that's the same for everyone that
day — optionally add a selfie, and it renders a card you text to your friends.
No accounts, no feed, no backend.

## Build

```
node build.js
```

- `dist/tabs.html` — standalone, opens straight from disk
- `dist/artifact.html` — no wrapper tags, for publishing as an artifact
- `docs/index.html` — what GitHub Pages serves

Edit the source in `index.html`, `css/`, and `js/` — never the build output.
