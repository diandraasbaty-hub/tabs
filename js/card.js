/* TABS — the card renderer.
   Everything a friend sees is drawn here. 1080x1350 so it lands big in a
   text thread without being cropped. */

const CARD_W = 1080;
const APP_URL = "diandraasbaty-hub.github.io/tabs";
/* Links always point at the public page — the artifact build is private, so a
   link generated there would be a dead end for whoever receives it. */
const SHARE_BASE = "https://diandraasbaty-hub.github.io/tabs/";

/* --- the card, packed into a URL ---------------------------------- */

function encodeCard(data) {
  const payload = {
    t: data.tabs.map(t => [t.text, Math.max(0, MOODS.indexOf(t.mood))]),
    w: data.wild,
    h: data.theme,
    d: data.date
  };
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  let bin = "";
  bytes.forEach(b => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeCard(str) {
  try {
    let b = String(str).replace(/-/g, "+").replace(/_/g, "/");
    while (b.length % 4) b += "=";
    const bin = atob(b);
    const bytes = Uint8Array.from(bin, ch => ch.charCodeAt(0));
    const p = JSON.parse(new TextDecoder().decode(bytes));
    if (!p || !Array.isArray(p.t) || p.t.length !== 3) return null;
    return {
      tabs: p.t.map(pair => ({
        text: String(pair[0] || ""),
        mood: MOODS[pair[1]] || MOODS[0]
      })),
      wild: p.w || "",
      theme: p.h || THEMES[0].id,
      date: /^\d{4}-\d{2}-\d{2}$/.test(p.d || "") ? p.d : todayKey(),
      photo: null
    };
  } catch (e) {
    return null;
  }
}

function cardLink(data) {
  return SHARE_BASE + "?c=" + encodeCard(data);
}
const FONT = "'Nunito', ui-rounded, -apple-system, system-ui, sans-serif";
const LABELS = ["A RANDOM THOUGHT", "WHAT I'M DOING", "NEW TAB"];

const font = (weight, size) => `${weight} ${size}px ${FONT}`;

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/* A soft organic blob rather than a circle — the photo should look dropped
   in by hand, not cropped by a computer. */
function blobPath(ctx, cx, cy, r) {
  const k = 0.5523 * r;
  const j = (n) => r * n;
  ctx.beginPath();
  ctx.moveTo(cx, cy - j(1.04));
  ctx.bezierCurveTo(cx + k * 1.12, cy - j(1.02), cx + j(1.06), cy - k * 0.92, cx + j(1.0), cy);
  ctx.bezierCurveTo(cx + j(0.96), cy + k * 1.1, cx + k * 0.94, cy + j(1.05), cx, cy + j(0.99));
  ctx.bezierCurveTo(cx - k * 1.08, cy + j(0.96), cx - j(1.03), cy + k * 0.96, cx - j(0.99), cy);
  ctx.bezierCurveTo(cx - j(0.96), cy - k * 1.06, cx - k * 0.98, cy - j(1.02), cx, cy - j(1.04));
  ctx.closePath();
}

function wrap(ctx, text, maxWidth, maxLines) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
      if (lines.length === maxLines) break;
    } else {
      line = test;
    }
  }
  if (lines.length < maxLines && line) lines.push(line);
  if (lines.length === maxLines) {
    let last = lines[maxLines - 1];
    const used = words.join(" ");
    if (lines.join(" ").length < used.length) {
      while (last.length > 4 && ctx.measureText(last + "…").width > maxWidth) {
        last = last.slice(0, -1);
      }
      lines[maxLines - 1] = last.replace(/[\s,.]+$/, "") + "…";
    }
  }
  return lines;
}

/* data = { tabs:[{text,mood}], wild, photo, theme, date }
   The canvas height is computed from the content — a fixed 1350 left a field
   of empty gradient under short answers, which is most of them. */
function drawCard(canvas, data) {
  const t = themeById(data.theme);
  const ctx = canvas.getContext("2d");

  const M = 74, WW = CARD_W - M * 2, WR = 54, PAD = 62;
  const textW = WW - PAD * 2 - 96;
  const HEADLINE = "3 TABS OPEN IN MY HEAD";

  /* measure everything before sizing the canvas */
  canvas.width = CARD_W;
  canvas.height = 100;
  let size = 48, blocks;
  for (;;) {
    ctx.font = font(700, size);
    blocks = data.tabs.map((tab, i) => {
      const lines = wrap(ctx, tab.text || "—", textW, 3);
      const label = i === 2
        ? "NEW TAB · " + (data.wild || "").toUpperCase()
        : LABELS[i];
      return { lines, label, h: 44 + lines.length * (size * 1.28) + 46 };
    });
    if (blocks.reduce((s, b) => s + b.h, 0) <= 780 || size <= 32) break;
    size -= 4;
  }
  /* the photo rides beside the headline like an avatar — parked over the
     window it covered the third answer */
  const hasPhoto = !!(data.photo && data.photo.img);
  const PR = 112;
  ctx.font = font(800, 58);
  const headLines = wrap(ctx, HEADLINE, hasPhoto ? WW - 268 : WW, 2);

  const TOP = 76;
  const headH = Math.max(headLines.length * 66 + 78, hasPhoto ? 244 : 0);
  const TABSTRIP = 76;
  const WH = Math.round(60 + blocks.reduce((s, b) => s + b.h, 0) + 20);
  const footH = 150;
  const CARD_H = Math.round(TOP + headH + 34 + TABSTRIP + WH + footH);

  canvas.width = CARD_W;
  canvas.height = CARD_H;
  ctx.clearRect(0, 0, CARD_W, CARD_H);

  /* background */
  const g = ctx.createLinearGradient(0, 0, CARD_W * 0.35, CARD_H);
  g.addColorStop(0, t.bg[0]);
  g.addColorStop(0.55, t.bg[1]);
  g.addColorStop(1, t.bg[2]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  ctx.save();
  ctx.globalAlpha = 0.5;
  [[120, 130, 380, t.tabs[0]], [1010, CARD_H * 0.42, 420, t.tabs[2]],
   [170, CARD_H - 90, 340, t.tabs[1]]].forEach(([x, y, r, c]) => {
    const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, c);
    rg.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();

  /* headline — so a friend knows what they are looking at */
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = t.ink;
  ctx.font = font(800, 58);
  let hy = TOP + 54;
  headLines.forEach(ln => { ctx.fillText(ln, M + 6, hy); hy += 66; });
  ctx.font = font(800, 30);
  ctx.globalAlpha = 0.5;
  ctx.fillText(prettyDate(data.date), M + 8, hy + 4);
  ctx.globalAlpha = 1;

  const WY = TOP + headH + 34 + TABSTRIP;

  /* tabs perched on the window's top edge */
  const tw = 286, th = 118, gap = -12;
  let tx = M + 26;
  data.tabs.forEach((tab, i) => {
    ctx.save();
    ctx.translate(tx + tw / 2, WY - TABSTRIP + th / 2);
    ctx.rotate((i - 1) * 0.012);
    ctx.fillStyle = t.tabs[i];
    roundRect(ctx, -tw / 2, -th / 2, tw, th + 46, 30);
    ctx.fill();
    const vis = -21;
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    roundRect(ctx, -tw / 2 + 22, vis - 8, tw - 118, 16, 8);
    ctx.fill();
    ctx.font = font(400, 40);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(tab.mood || MOODS[0], tw / 2 - 48, vis);
    ctx.restore();
    tx += tw + gap;
  });

  /* window */
  ctx.save();
  ctx.shadowColor = "rgba(40,20,70,0.2)";
  ctx.shadowBlur = 48;
  ctx.shadowOffsetY = 18;
  ctx.fillStyle = t.surface;
  roundRect(ctx, M, WY, WW, WH, WR);
  ctx.fill();
  ctx.restore();

  /* entries */
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  let y = WY + 74;
  blocks.forEach((b, i) => {
    ctx.fillStyle = t.tabs[i];
    ctx.font = font(800, 24);
    ctx.fillText(b.label, M + PAD + 96, y);

    ctx.font = font(400, 44);
    ctx.fillText(data.tabs[i].mood || MOODS[0], M + PAD + 6, y + 44);

    ctx.fillStyle = t.ink;
    ctx.font = font(700, size);
    b.lines.forEach((ln, k) => {
      ctx.fillText(ln, M + PAD + 96, y + 46 + k * (size * 1.28));
    });

    y += b.h;
    if (i < 2) {
      ctx.fillStyle = t.ink;
      ctx.globalAlpha = 0.08;
      roundRect(ctx, M + PAD + 96, y - 34, WW - PAD * 2 - 96, 4, 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  });

  /* photo */
  if (hasPhoto) {
    const cx = CARD_W - M - PR, cy = TOP + PR + 4;
    ctx.save();
    ctx.shadowColor = "rgba(40,20,70,0.28)";
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 10;
    ctx.fillStyle = "#fff";
    ctx.translate(cx, cy);
    ctx.rotate(-0.06);
    blobPath(ctx, 0, 0, PR + 12);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-0.06);
    blobPath(ctx, 0, 0, PR);
    ctx.clip();
    const im = data.photo.img;
    const sc = Math.max((PR * 2) / im.width, (PR * 2) / im.height);
    ctx.drawImage(im, -im.width * sc / 2, -im.height * sc / 2,
                  im.width * sc, im.height * sc);
    ctx.restore();
  }

  /* footer — an instruction and an address, not a fake button */
  const fy = WY + WH + 72;
  ctx.textAlign = "center";
  ctx.fillStyle = t.ink;
  ctx.globalAlpha = 0.88;
  ctx.font = font(800, 46);
  ctx.fillText("SEND YOUR TABS BACK!", CARD_W / 2, fy);
  ctx.globalAlpha = 0.5;
  ctx.font = font(800, 30);
  ctx.fillText(APP_URL, CARD_W / 2, fy + 46);
  ctx.globalAlpha = 1;
  ctx.textAlign = "left";
}

/* Neither of these may hang or throw. An unsettled clipboard promise left the
   Send button doing nothing at all, with no error to show for it. */
function settleWithin(promise, ms) {
  return Promise.race([
    Promise.resolve(promise).then(() => true, () => false),
    new Promise(resolve => setTimeout(() => resolve(false), ms))
  ]);
}

async function shareLink(url) {
  if (!navigator.share) return false;
  try {
    await navigator.share({
      title: "TABS",
      text: "3 tabs open in my head. Send yours back \u2192",
      url: url
    });
    return true;
  } catch (e) {
    return !!(e && e.name === "AbortError");
  }
}

async function copyLink(url) {
  if (!navigator.clipboard || !navigator.clipboard.writeText) return false;
  /* writeText can throw synchronously when there is no user gesture, so the
     call itself has to happen inside a promise that cannot escape */
  const attempt = new Promise((resolve, reject) => {
    try { resolve(navigator.clipboard.writeText(url)); }
    catch (e) { reject(e); }
  });
  try { return await settleWithin(attempt, 1500); }
  catch (e) { return false; }
}
