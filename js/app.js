/* TABS — two screens. Write, send. */

const $ = id => document.getElementById(id);
const store = loadStore();
const DATE = todayKey();
const WILD = wildcardFor(DATE);  /* LABELS comes from card.js */

const state = {
  theme: store.theme || THEMES[0].id,
  tabs: [
    { text: "", mood: MOODS[0] },
    { text: "", mood: MOODS[0] },
    { text: "", mood: MOODS[0] }
  ],
  photo: null
};

if (store.draft && store.draft.date === DATE) {
  state.tabs = store.draft.tabs.map(t => ({
    text: t.text || "", mood: t.mood || MOODS[0]
  }));
  if (store.draft.theme) state.theme = store.draft.theme;
}

/* ---------- theme ---------- */
function applyTheme() {
  const t = themeById(state.theme);
  const r = document.documentElement.style;
  r.setProperty("--ink", t.ink);
  r.setProperty("--surface", t.surface);
  r.setProperty("--bg1", t.bg[0]);
  r.setProperty("--bg2", t.bg[1]);
  r.setProperty("--bg3", t.bg[2]);
  t.tabs.forEach((c, i) => r.setProperty("--t" + (i + 1), c));
  const meta = document.querySelector('meta[name=theme-color]');
  if (meta) meta.setAttribute("content", t.bg[1]);
}

function show(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("on"));
  $(id).classList.add("on");
  window.scrollTo(0, 0);
}

let toastTimer;
function toast(msg) {
  const el = $("toast");
  el.textContent = msg;
  el.classList.add("on");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("on"), 2600);
}

function saveDraft() {
  store.draft = { date: DATE, theme: state.theme, tabs: state.tabs };
  store.theme = state.theme;
  saveStore(store);
}

/* ---------- the three cards, all on one screen ---------- */
function grow(field) {
  field.style.height = "auto";
  field.style.height = field.scrollHeight + "px";
}

function buildCards() {
  const wrap = $("w-cards");
  wrap.innerHTML = "";
  state.tabs.forEach((tab, i) => {
    const card = document.createElement("div");
    card.className = "tabcard";
    card.style.setProperty("--tabcolor", themeById(state.theme).tabs[i]);

    const head = document.createElement("div");
    head.className = "cardhead";

    const label = document.createElement("span");
    label.className = "slotlabel";
    label.textContent = LABELS[i];
    head.appendChild(label);

    /* one chip, tap to cycle — a six-button row for every line was the
       bulkiest thing on the old screen */
    const chip = document.createElement("button");
    chip.className = "moodchip";
    chip.type = "button";
    chip.textContent = tab.mood;
    chip.setAttribute("aria-label", "Change the mood");
    chip.onclick = () => {
      const next = (MOODS.indexOf(tab.mood) + 1) % MOODS.length;
      tab.mood = MOODS[next];
      chip.textContent = tab.mood;
      chip.classList.remove("bump");
      void chip.offsetWidth;
      chip.classList.add("bump");
      saveDraft();
    };
    head.appendChild(chip);
    card.appendChild(head);

    if (i === 2) {
      const q = document.createElement("div");
      q.className = "wildq";
      q.textContent = WILD;
      card.appendChild(q);
    }

    const field = document.createElement("textarea");
    field.className = "field";
    field.rows = 1;
    field.maxLength = 90;
    field.value = tab.text;
    field.placeholder = pickExample(
      [EXAMPLES.thought, EXAMPLES.doing, EXAMPLES.wild][i], DATE);
    field.addEventListener("input", () => {
      tab.text = field.value;
      grow(field);
      refreshSend();
      saveDraft();
    });
    card.appendChild(field);
    wrap.appendChild(card);
    grow(field);
  });
}

function refreshSend() {
  $("w-send").disabled = !state.tabs.every(t => t.text.trim());
}

/* ---------- photo, inline ---------- */
$("w-face").onclick = () => $("w-file").click();

$("w-file").addEventListener("change", e => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const img = new Image();
    img.onload = () => {
      state.photo = { img: img, src: ev.target.result };
      const btn = $("w-face");
      btn.classList.add("has");
      btn.style.backgroundImage = `url(${ev.target.result})`;
      $("w-faceicon").textContent = "";
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
});

/* ---------- card ---------- */
function render() {
  applyTheme();
  const cv = $("cv");
  drawCard(cv, {
    tabs: state.tabs, wild: WILD, photo: state.photo,
    theme: state.theme, date: DATE
  });
  $("d-img").src = cv.toDataURL("image/png");
  paintSwatches();
  saveDraft();
}

function paintSwatches() {
  const box = $("d-swatches");
  box.innerHTML = "";
  THEMES.forEach(t => {
    const b = document.createElement("button");
    b.className = "swatch" + (t.id === state.theme ? " on" : "");
    b.type = "button";
    b.setAttribute("aria-label", t.name);
    b.style.background = `linear-gradient(140deg,${t.bg[0]},${t.tabs[1]})`;
    b.onclick = () => { state.theme = t.id; render(); };
    box.appendChild(b);
  });
}

$("w-send").onclick = () => { render(); show("s-card"); };
$("d-back").onclick = () => { buildCards(); show("s-write"); };

$("d-again").onclick = () => {
  state.tabs = state.tabs.map(() => ({ text: "", mood: MOODS[0] }));
  state.photo = null;
  const btn = $("w-face");
  btn.classList.remove("has");
  btn.style.backgroundImage = "";
  $("w-faceicon").textContent = "＋";
  $("d-hint").textContent = "Or press and hold the card to copy it.";
  saveDraft();
  buildCards();
  refreshSend();
  show("s-write");
};

$("d-link").onclick = async () => {
  const url = "https://" + APP_URL;
  try {
    await navigator.clipboard.writeText(url);
    toast("Link copied. Paste it under your card.");
  } catch (e) {
    toast(APP_URL);
  }
};

function remember() {
  pushHistory(store, { date: DATE, theme: state.theme, wild: WILD, tabs: state.tabs });
}

$("d-send").onclick = async () => {
  remember();
  if (await shareCard($("cv"), DATE)) return;
  if (await copyCard($("cv"))) {
    toast("Copied. Open Messages and paste it.");
    $("d-hint").textContent =
      "On your clipboard — paste it into any text, then send the link too.";
    return;
  }
  toast("Press and hold the card → Copy");
  $("d-hint").textContent =
    "Sharing is blocked here. Press and hold the card, choose Copy, then paste it into Messages.";
};

/* ---------- boot ---------- */
applyTheme();
$("w-date").textContent = prettyDate(DATE);
buildCards();
refreshSend();
if (document.fonts && document.fonts.load) {
  document.fonts.load("800 48px Nunito").catch(() => {});
}
