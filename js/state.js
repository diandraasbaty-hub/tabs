/* TABS — themes, dates, and everything that touches localStorage. */

const THEMES = [
  { id: "bubblegum", name: "Bubblegum",
    bg: ["#ffd3e8", "#c9b8ff", "#a6e3ff"],
    tabs: ["#ff8fc7", "#a98bff", "#5fc9f8"],
    ink: "#3a1f4d", surface: "#fffaff" },
  { id: "sherbet", name: "Sherbet",
    bg: ["#ffe1b8", "#ffb3a0", "#ff9fc4"],
    tabs: ["#ffb03b", "#ff7a66", "#ff77ab"],
    ink: "#4d2418", surface: "#fffdf7" },
  { id: "pool", name: "Pool",
    bg: ["#bff3ff", "#8fd0ff", "#a9b4ff"],
    tabs: ["#3ec9e0", "#4a9df7", "#7f86ff"],
    ink: "#12324d", surface: "#fbfeff" },
  { id: "limeade", name: "Limeade",
    bg: ["#e4ffb8", "#a8f0c6", "#7fe3e0"],
    tabs: ["#9fdc3c", "#41cf95", "#2fc4c4"],
    ink: "#1d3d24", surface: "#fcfff7" },
  { id: "grape", name: "Grape",
    bg: ["#e0c9ff", "#b7a6ff", "#8fb6ff"],
    tabs: ["#b072ff", "#7d78ff", "#5a9bff"],
    ink: "#2e1a52", surface: "#fdfbff" },
  { id: "sunbeam", name: "Sunbeam",
    bg: ["#fff2a8", "#ffd08a", "#ffab7d"],
    tabs: ["#ffd23c", "#ffa53c", "#ff8360"],
    ink: "#4a3410", surface: "#fffdf3" }
];

const themeById = id => THEMES.find(t => t.id === id) || THEMES[0];

/* --- dates --------------------------------------------------------- */

function todayKey(d) {
  const t = d || new Date();
  const p = n => String(n).padStart(2, "0");
  return `${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())}`;
}

function prettyDate(key) {
  const [y, m, d] = key.split("-").map(Number);
  const months = ["JAN","FEB","MAR","APR","MAY","JUN",
                  "JUL","AUG","SEP","OCT","NOV","DEC"];
  return `${months[m - 1]} ${d}`;
}

/* Everyone gets the same wildcard on the same calendar day. Seeded by the
   date string alone so it never depends on device, timezone offset math,
   or how many times the app has been opened. */
function wildcardFor(key) {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return WILDCARDS[Math.abs(h) % WILDCARDS.length];
}

function pickExample(bank, key) {
  let h = 5381;
  for (let i = 0; i < key.length; i++) h = ((h << 5) + h + key.charCodeAt(i)) | 0;
  return bank[Math.abs(h) % bank.length];
}

/* --- storage ------------------------------------------------------- */

const STORE_KEY = "tabs-v1";

function loadStore() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return { name: "", draft: null, history: [], theme: null };
    const parsed = JSON.parse(raw);
    return {
      name: typeof parsed.name === "string" ? parsed.name : "",
      draft: parsed.draft || null,
      history: Array.isArray(parsed.history) ? parsed.history : [],
      theme: parsed.theme || null
    };
  } catch (e) {
    return { name: "", draft: null, history: [], theme: null };
  }
}

function saveStore(store) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      name: store.name || "",
      draft: store.draft,
      history: store.history.slice(0, 7),
      theme: store.theme
    }));
  } catch (e) { /* private mode, full disk — the app still works */ }
}

/* History never keeps the photo. A week of data URLs blows the quota. */
function pushHistory(store, entry) {
  const rest = store.history.filter(h => h.date !== entry.date);
  store.history = [{
    date: entry.date,
    theme: entry.theme,
    wild: entry.wild,
    tabs: entry.tabs.map(t => ({ text: t.text, mood: t.mood }))
  }].concat(rest).slice(0, 7);
  saveStore(store);
}
