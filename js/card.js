/* TABS — the card renderer.
   Everything a friend sees is drawn here. 1080x1350 so it lands big in a
   text thread without being cropped. */

const CARD_W = 1080, CARD_H = 1350;
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

/* data = { tabs:[{text,mood}], wild, photo, theme, date } */
function drawCard(canvas, data) {
  const t = themeById(data.theme);
  const ctx = canvas.getContext("2d");
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  ctx.clearRect(0, 0, CARD_W, CARD_H);

  const WX = 74, WW = CARD_W - 148, WR = 54, PAD = 62;
  const textW = WW - PAD * 2 - 96;

  /* measure before anything is drawn, so the window can hug its contents
     instead of leaving a pool of dead space under short answers */
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
    const total = blocks.reduce((s, b) => s + b.h, 0);
    if (total <= 780 || size <= 32) break;
    size -= 4;
  }
  const body = blocks.reduce((s, b) => s + b.h, 0);
  const WH = Math.round(150 + body + 24);
  const WY = Math.round((CARD_H - WH) / 2 + 26);

  /* background */
  const g = ctx.createLinearGradient(0, 0, CARD_W * 0.35, CARD_H);
  g.addColorStop(0, t.bg[0]);
  g.addColorStop(0.55, t.bg[1]);
  g.addColorStop(1, t.bg[2]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  ctx.save();
  ctx.globalAlpha = 0.55;
  [[120, 150, 420, t.tabs[0]], [1010, 470, 460, t.tabs[2]],
   [180, 1240, 380, t.tabs[1]]].forEach(([x, y, r, c]) => {
    const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, c);
    rg.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();

  /* tabs perched on the window's top edge */
  const tw = 286, th = 118, gap = -12;
  let tx = WX + 26;
  data.tabs.forEach((tab, i) => {
    ctx.save();
    ctx.translate(tx + tw / 2, WY - 76 + th / 2);
    ctx.rotate((i - 1) * 0.012);
    ctx.fillStyle = t.tabs[i];
    roundRect(ctx, -tw / 2, -th / 2, tw, th + 46, 30);
    ctx.fill();
    /* only the strip above the window is visible, so both the title bar and
       the mood sit centered in that band — like a favicon on a browser tab */
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
  roundRect(ctx, WX, WY, WW, WH, WR);
  ctx.fill();
  ctx.restore();

  /* header */
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = t.ink;
  ctx.font = font(800, 44);
  ctx.fillText("3 TABS OPEN", WX + PAD, WY + 92);
  const hw = ctx.measureText("3 TABS OPEN").width;
  ctx.font = font(700, 32);
  ctx.globalAlpha = 0.45;
  ctx.fillText("· " + prettyDate(data.date), WX + PAD + hw + 22, WY + 90);
  ctx.globalAlpha = 1;

  /* entries */
  let y = WY + 164;
  blocks.forEach((b, i) => {
    ctx.fillStyle = t.tabs[i];
    ctx.font = font(800, 24);
    ctx.fillText(b.label, WX + PAD + 96, y);

    ctx.font = font(400, 44);
    ctx.fillText(data.tabs[i].mood || MOODS[0], WX + PAD + 6, y + 44);

    ctx.fillStyle = t.ink;
    ctx.font = font(700, size);
    b.lines.forEach((ln, k) => {
      ctx.fillText(ln, WX + PAD + 96, y + 46 + k * (size * 1.28));
    });

    y += b.h;
    if (i < 2) {
      ctx.fillStyle = t.ink;
      ctx.globalAlpha = 0.08;
      roundRect(ctx, WX + PAD + 96, y - 34, WW - PAD * 2 - 96, 4, 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  });

  /* photo */
  if (data.photo && data.photo.img) {
    const cx = CARD_W - 232, cy = WY + WH - 30, r = 142;
    ctx.save();
    ctx.shadowColor = "rgba(40,20,70,0.28)";
    ctx.shadowBlur = 32;
    ctx.shadowOffsetY = 12;
    ctx.fillStyle = "#fff";
    ctx.translate(cx, cy);
    ctx.rotate(-0.06);
    blobPath(ctx, 0, 0, r + 14);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-0.06);
    blobPath(ctx, 0, 0, r);
    ctx.clip();
    const im = data.photo.img;
    const scale = Math.max((r * 2) / im.width, (r * 2) / im.height);
    ctx.drawImage(im, -im.width * scale / 2, -im.height * scale / 2,
                  im.width * scale, im.height * scale);
    ctx.restore();
  }

  /* footer */
  const fy = Math.min(WY + WH + 96, CARD_H - 70);
  ctx.fillStyle = t.ink;
  ctx.globalAlpha = 0.8;
  ctx.font = font(800, 40);
  ctx.textAlign = "left";
  ctx.fillText("open yours →", WX + 12, fy);
  ctx.textAlign = "right";
  ctx.globalAlpha = 0.5;
  ctx.fillText("TABS", CARD_W - WX - 12, fy);
  ctx.globalAlpha = 1;
}

function canvasToBlob(canvas) {
  return new Promise(res => canvas.toBlob(res, "image/png", 0.95));
}

/* The share sheet is the happy path, but it is blocked in embedded viewers
   and missing on desktop. The caller always shows the press-and-hold image
   too, so a false return here is not a failure. */
/* Safari wants the ClipboardItem built inside the user gesture, so the blob
   is handed over as a promise rather than awaited first. */
async function copyCard(canvas) {
  if (!navigator.clipboard || !window.ClipboardItem) return false;
  try {
    await navigator.clipboard.write([
      new ClipboardItem({ "image/png": canvasToBlob(canvas) })
    ]);
    return true;
  } catch (e) {
    try {
      const blob = await canvasToBlob(canvas);
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      return true;
    } catch (e2) { return false; }
  }
}

async function shareCard(canvas, dateKey) {
  const blob = await canvasToBlob(canvas);
  if (!blob) return false;
  const file = new File([blob], `tabs-${dateKey}.png`, { type: "image/png" });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return true;
    } catch (e) {
      return e && e.name === "AbortError" ? true : false;
    }
  }
  return false;
}
