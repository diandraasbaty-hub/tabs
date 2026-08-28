/* Shared by the preview-image endpoint and the local renderer.
   Kept free of browser globals so it runs on the edge and in Node.
   THEMES is duplicated from js/state.js on purpose — build.js asserts the two
   copies stay identical, so they cannot drift silently. */

export const THEMES = [
  { id: "bubblegum", bg: ["#ffd3e8", "#c9b8ff", "#a6e3ff"],
    tabs: ["#ff8fc7", "#a98bff", "#5fc9f8"], ink: "#3a1f4d", surface: "#fffaff" },
  { id: "sherbet", bg: ["#ffe1b8", "#ffb3a0", "#ff9fc4"],
    tabs: ["#ffb03b", "#ff7a66", "#ff77ab"], ink: "#4d2418", surface: "#fffdf7" },
  { id: "pool", bg: ["#bff3ff", "#8fd0ff", "#a9b4ff"],
    tabs: ["#3ec9e0", "#4a9df7", "#7f86ff"], ink: "#12324d", surface: "#fbfeff" },
  { id: "limeade", bg: ["#e4ffb8", "#a8f0c6", "#7fe3e0"],
    tabs: ["#9fdc3c", "#41cf95", "#2fc4c4"], ink: "#1d3d24", surface: "#fcfff7" },
  { id: "grape", bg: ["#e0c9ff", "#b7a6ff", "#8fb6ff"],
    tabs: ["#b072ff", "#7d78ff", "#5a9bff"], ink: "#2e1a52", surface: "#fdfbff" },
  { id: "sunbeam", bg: ["#fff2a8", "#ffd08a", "#ffab7d"],
    tabs: ["#ffd23c", "#ffa53c", "#ff8360"], ink: "#4a3410", surface: "#fffdf3" }
];

const LABELS = ["A RANDOM THOUGHT", "WHAT I'M DOING", "NEW TAB"];
const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

export const themeById = id => THEMES.find(t => t.id === id) || THEMES[0];

export function prettyDate(key) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key || "");
  return m ? `${MONTHS[Number(m[2]) - 1]} ${Number(m[3])}` : "";
}

export function decodeCard(str) {
  try {
    let b = String(str).replace(/-/g, "+").replace(/_/g, "/");
    while (b.length % 4) b += "=";
    const bin = atob(b);
    const bytes = Uint8Array.from(bin, ch => ch.charCodeAt(0));
    const p = JSON.parse(new TextDecoder().decode(bytes));
    if (!p || !Array.isArray(p.t) || p.t.length !== 3) return null;
    return {
      tabs: p.t.map(pair => ({ text: String(pair[0] || "").slice(0, 90) })),
      wild: String(p.w || "").slice(0, 60),
      theme: typeof p.h === "string" ? p.h : "bubblegum",
      date: /^\d{4}-\d{2}-\d{2}$/.test(p.d || "") ? p.d : ""
    };
  } catch (e) {
    return null;
  }
}

const el = (type, style, children) => ({ type, props: { style, children } });

/* A link preview is wide, so the card is rebuilt sideways rather than
   letterboxed. Emoji are left out on purpose — they are the least reliable
   thing to render off-browser, and colored dots read fine at this size. */
export function previewTree(card) {
  const t = themeById(card.theme);

  const entry = (tab, i) => el("div", {
    display: "flex", flexDirection: "column", marginBottom: i < 2 ? 26 : 0
  }, [
    el("div", { display: "flex", alignItems: "center", marginBottom: 6 }, [
      el("div", {
        display: "flex", width: 14, height: 14, borderRadius: 7,
        backgroundColor: t.tabs[i], marginRight: 12
      }, []),
      el("div", {
        display: "flex", fontSize: 18, fontWeight: 800, color: t.tabs[i],
        letterSpacing: 1.4, width: 530
      }, i === 2 && card.wild
        ? "NEW TAB · " + card.wild.toUpperCase()
        : LABELS[i])
    ]),
    el("div", {
      display: "flex", fontSize: 31, fontWeight: 700, color: t.ink,
      lineHeight: 1.25, paddingLeft: 26, width: 548
    }, tab.text || "—")
  ]);

  return el("div", {
    display: "flex", width: 1200, height: 630, padding: 54,
    fontFamily: "Nunito",
    backgroundImage: `linear-gradient(130deg, ${t.bg[0]}, ${t.bg[1]} 55%, ${t.bg[2]})`
  }, [
    el("div", {
      display: "flex", flexDirection: "column", width: 400, flexShrink: 0,
      justifyContent: "space-between", paddingRight: 34
    }, [
      el("div", { display: "flex", flexDirection: "column" }, [
        el("div", {
          display: "flex", fontSize: 40, fontWeight: 800, color: t.ink,
          letterSpacing: -1.6, opacity: 0.55
        }, "TABS"),
        el("div", {
          display: "flex", fontSize: 60, fontWeight: 800, color: t.ink,
          lineHeight: 1.05, letterSpacing: -1.6, marginTop: 16
        }, "3 tabs open in my head"),
        el("div", {
          display: "flex", fontSize: 24, fontWeight: 800, color: t.ink,
          opacity: 0.45, marginTop: 18, letterSpacing: 2
        }, prettyDate(card.date))
      ]),
      el("div", {
        display: "flex", fontSize: 26, fontWeight: 800, color: t.ink, opacity: 0.7
      }, "tap to send yours back")
    ]),
    /* an explicit width, not flexGrow — long answers pushed the panel off the
       right edge and clipped instead of wrapping */
    el("div", {
      display: "flex", flexDirection: "column", width: 658, flexShrink: 0,
      justifyContent: "center",
      backgroundColor: t.surface, borderRadius: 40, padding: 42
    }, card.tabs.map(entry))
  ]);
}
