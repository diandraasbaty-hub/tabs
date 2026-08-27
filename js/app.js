/* TABS — screen flow. */

const $ = id => document.getElementById(id);
const store = loadStore();
const DATE = todayKey();
const WILD = wildcardFor(DATE);

const state = {
  theme: store.theme || THEMES[0].id,
  tabs: [
    { text: "", mood: MOODS[0] },
    { text: "", mood: MOODS[0] },
    { text: "", mood: MOODS[0] }
  ],
  photo: null
};

/* restore an unfinished draft from the same day */
if (store.draft && store.draft.date === DATE) {
  state.tabs = store.draft.tabs.map((t, i) => ({
    text: t.text || "",
    mood: t.mood || MOODS[0]
  }));
  if (store.draft.theme) state.theme = store.draft.theme;
}

let step = 0;

/* ---------- theme ---------- */
function applyTheme(id) {
  const t = themeById(id);
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

/* ---------- screens ---------- */
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

/* ---------- compose ---------- */
const SLOT_LABEL = ["A RANDOM THOUGHT", "WHAT I'M DOING", "NEW TAB"];
const SLOT_HINT = [
  () => pickExample(EXAMPLES.thought, DATE),
  () => pickExample(EXAMPLES.doing, DATE),
  () => pickExample(EXAMPLES.wild, DATE)
];

function paintMoods() {
  const row = $("c-moods");
  row.innerHTML = "";
  MOODS.forEach(m => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = m;
    if (m === state.tabs[step].mood) b.classList.add("on");
    b.onclick = () => {
      state.tabs[step].mood = m;
      paintMoods();
      saveDraft();
    };
    row.appendChild(b);
  });
}

function paintStep() {
  const t = themeById(state.theme);
  $("c-card").style.setProperty("--tabcolor", t.tabs[step]);
  $("c-label").textContent = SLOT_LABEL[step];
  $("c-wild").hidden = step !== 2;
  $("c-wild").textContent = WILD;
  $("c-step").textContent = `Tab ${step + 1} of 3`;
  $("c-field").placeholder = SLOT_HINT[step]();
  $("c-field").value = state.tabs[step].text;
  $("c-count").textContent = state.tabs[step].text.length;
  $("c-next").textContent = step === 2 ? "Make the card" : "Next tab";
  $("c-next").disabled = !state.tabs[step].text.trim();
  [...$("c-dots").children].forEach((d, i) => d.classList.toggle("on", i === step));
  $("c-card").style.animation = "none";
  void $("c-card").offsetWidth;
  $("c-card").style.animation = "";
  paintMoods();
}

function saveDraft() {
  store.draft = { date: DATE, theme: state.theme, tabs: state.tabs };
  store.theme = state.theme;
  saveStore(store);
}

$("c-field").addEventListener("input", e => {
  state.tabs[step].text = e.target.value;
  $("c-count").textContent = e.target.value.length;
  $("c-next").disabled = !e.target.value.trim();
  saveDraft();
});

$("c-next").onclick = () => {
  if (!state.tabs[step].text.trim()) return;
  if (step < 2) {
    step++;
    paintStep();
    $("c-field").focus();
  } else {
    show("s-face");
  }
};

$("c-back").onclick = () => {
  if (step === 0) show("s-hello");
  else { step--; paintStep(); }
};

/* ---------- hello ---------- */
$("start").onclick = () => {
  step = 0;
  show("s-compose");
  paintStep();
  $("c-field").focus();   /* must be synchronous or iOS won't raise the keyboard */
};

if (store.history.length) {
  const h = $("seehistory");
  h.hidden = false;
  h.onclick = () => {
    const last = store.history[0];
    toast(`${prettyDate(last.date)} — ${last.tabs.map(t => t.mood).join(" ")}`);
  };
}

/* ---------- face ---------- */
$("f-pick").onclick = () => $("f-input").click();
$("f-skip").onclick = () => { state.photo = null; render(); };
$("f-back").onclick = () => { show("s-compose"); paintStep(); };

$("f-input").addEventListener("change", e => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const img = new Image();
    img.onload = () => {
      state.photo = { img: img, src: ev.target.result };
      $("f-blob").innerHTML = "";
      const prev = new Image();
      prev.src = ev.target.result;
      $("f-blob").appendChild(prev);
      $("f-pick").textContent = "Use a different one";
      $("f-skip").textContent = "Looks good →";
      $("f-skip").classList.remove("ghost");
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
});

/* ---------- card ---------- */
function render() {
  applyTheme(state.theme);
  const cv = $("cv");
  drawCard(cv, {
    tabs: state.tabs, wild: WILD, photo: state.photo,
    theme: state.theme, date: DATE
  });
  $("d-img").src = cv.toDataURL("image/png");
  show("s-card");
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
    b.title = t.name;
    b.setAttribute("aria-label", t.name);
    b.style.background = `linear-gradient(140deg,${t.bg[0]},${t.tabs[1]})`;
    b.onclick = () => { state.theme = t.id; render(); };
    box.appendChild(b);
  });
}

$("d-back").onclick = () => show("s-face");

$("d-again").onclick = () => {
  state.tabs = state.tabs.map(() => ({ text: "", mood: MOODS[0] }));
  state.photo = null;
  $("f-blob").textContent = "🫧";
  $("f-pick").textContent = "Add a photo";
  $("f-skip").textContent = "Skip it";
  $("f-skip").classList.add("ghost");
  step = 0;
  saveDraft();
  show("s-hello");
};

function remember() {
  pushHistory(store, { date: DATE, theme: state.theme, wild: WILD, tabs: state.tabs });
}

$("d-send").onclick = async () => {
  remember();
  if (await shareCard($("cv"), DATE)) return;
  if (await copyCard($("cv"))) {
    toast("Copied. Open Messages and paste it.");
    $("d-hint").textContent = "Card is on your clipboard — paste it into any text.";
    return;
  }
  toast("Press and hold the card → Copy");
  $("d-hint").textContent =
    "Sharing is blocked here. Press and hold the card above, choose Copy, then paste it into Messages.";
};

$("d-copy").onclick = async () => {
  remember();
  if (await copyCard($("cv"))) {
    toast("Copied. Open Messages and paste it.");
    $("d-hint").textContent = "Card is on your clipboard — paste it into any text.";
  } else {
    toast("Press and hold the card → Copy");
  }
};

/* ---------- boot ---------- */
applyTheme(state.theme);
if (document.fonts && document.fonts.load) {
  document.fonts.load("800 48px Nunito").catch(() => {});
}
