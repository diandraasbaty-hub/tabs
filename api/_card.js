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

/* A link preview is shown small in a thread, so the answers get the whole
   width and the largest type that still fits. Emoji are left out on purpose —
   they are the least reliable thing to render off-browser, and colored dots
   read fine at this size. */
export function previewTree(card) {
  const t = themeById(card.theme);

  const total = card.tabs.reduce((n, tab) => n + (tab.text || "").length, 0);
  const size = total <= 100 ? 50 : total <= 160 ? 44 : total <= 220 ? 38 : 32;
  const labelSize = size <= 38 ? 19 : 22;

  const entry = (tab, i) => el("div", {
    display: "flex", flexDirection: "column", marginBottom: i < 2 ? 22 : 0
  }, [
    el("div", { display: "flex", alignItems: "center", marginBottom: 4 }, [
      el("div", {
        display: "flex", width: 13, height: 13, borderRadius: 7,
        backgroundColor: t.tabs[i], marginRight: 11, flexShrink: 0
      }, []),
      el("div", {
        display: "flex", fontSize: labelSize, fontWeight: 800,
        color: t.tabs[i], letterSpacing: 1.4, width: 1000
      }, i === 2 && card.wild
        ? "NEW TAB · " + card.wild.toUpperCase()
        : LABELS[i])
    ]),
    el("div", {
      display: "flex", fontSize: size, fontWeight: 700, color: t.ink,
      lineHeight: 1.22, paddingLeft: 24, width: 1000
    }, tab.text || "—")
  ]);

  return el("div", {
    display: "flex", flexDirection: "column", width: 1200, height: 630,
    padding: 44, fontFamily: "Nunito",
    backgroundImage: `linear-gradient(130deg, ${t.bg[0]}, ${t.bg[1]} 55%, ${t.bg[2]})`
  }, [
    el("div", {
      display: "flex", alignItems: "center", justifyContent: "space-between",
      paddingLeft: 8, paddingRight: 8, marginBottom: 16
    }, [
      el("div", {
        display: "flex", fontSize: 36, fontWeight: 800, color: t.ink,
        letterSpacing: -0.4
      }, "3 TABS OPEN IN MY HEAD"),
      el("div", {
        display: "flex", fontSize: 26, fontWeight: 800, color: t.ink,
        opacity: 0.45, letterSpacing: 1.6
      }, prettyDate(card.date))
    ]),
    el("div", {
      display: "flex", flexDirection: "column", flexGrow: 1,
      justifyContent: "center",
      backgroundColor: t.surface, borderRadius: 36, padding: 36
    }, card.tabs.map(entry)),
    el("div", {
      display: "flex", justifyContent: "center", marginTop: 14,
      fontSize: 26, fontWeight: 800, color: t.ink, opacity: 0.6
    }, "tap to send yours back")
  ]);
}
