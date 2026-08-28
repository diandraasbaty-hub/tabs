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
const HINT_DEFAULT =
  "One link. They see this card and get a button to send theirs back.";
const HINT_PHOTO =
  "Heads up: a link can\u2019t carry your photo. To send the picture instead, " +
  "press and hold the card above and choose Copy.";

function render() {
  applyTheme();
  const cv = $("cv");
  drawCard(cv, {
    tabs: state.tabs, wild: WILD, photo: state.photo,
    theme: state.theme, date: DATE
  });
  $("d-img").src = cv.toDataURL("image/png");
  $("d-hint").textContent = state.photo ? HINT_PHOTO : HINT_DEFAULT;
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
  saveDraft();
  buildCards();
  refreshSend();
  show("s-write");
};

function remember() {
  pushHistory(store, { date: DATE, theme: state.theme, wild: WILD, tabs: state.tabs });
}

function myLink() {
  return cardLink({ tabs: state.tabs, wild: WILD, theme: state.theme, date: DATE });
}

$("d-send").onclick = async () => {
  remember();
  const url = myLink();
  if (await shareLink(url)) return;
  if (await copyLink(url)) {
    toast("Link copied. Paste it into Messages.");
    $("d-hint").textContent =
      "Link is on your clipboard — paste it into any text. It opens this card.";
    return;
  }
  $("d-hint").textContent = url;
  toast("Copy the address below");
};

/* ---------- did someone send us one? ---------- */
function showReceived(got) {
  const cv = document.createElement("canvas");
  const prev = state.theme;
  state.theme = got.theme;
  applyTheme();
  drawCard(cv, got);
  $("g-img").src = cv.toDataURL("image/png");
  state.theme = prev;
  show("s-got");
}

$("g-reply").onclick = () => {
  history.replaceState(null, "", location.pathname);
  applyTheme();
  show("s-write");
  const first = document.querySelector(".field");
  if (first) first.focus();
};

/* ---------- boot ---------- */
applyTheme();
$("w-date").textContent = prettyDate(DATE);
buildCards();
refreshSend();
const incoming = new URLSearchParams(location.search).get("c");
const got = incoming ? decodeCard(incoming) : null;

function boot() {
  if (got) showReceived(got);
}

/* the card is drawn to a canvas, so the webfont has to be in before it runs
   or the render falls back to a system face */
if (document.fonts && document.fonts.load) {
  document.fonts.load("800 48px Nunito")
    .then(() => document.fonts.load("700 48px Nunito"))
    .then(boot, boot);
} else {
  boot();
}
