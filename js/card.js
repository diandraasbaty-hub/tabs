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
  ctx.textBaseline = "alphabetic";

  const WX = 74, WW = CARD_W - 148, WR = 54, PAD = 62;
  const GUT = 96;                    /* emoji column */
  const textW = WW - PAD * 2 - GUT;

  /* ---- measure before drawing so the window fits its contents ---- */
  let size = 48, blocks;
  for (;;) {
    ctx.font = font(700, size);
    blocks = data.tabs.map((tab, i) => {
      const lines = wrap(ctx, tab.text || "—", textW, 3);
      return { lines, h: 42 + lines.length * (size * 1.26) + 46 };
    });
    if (blocks.reduce((s, b) => s + b.h, 0) <= 660 || size <= 32) break;
    size -= 4;
  }
  blocks.forEach((b, i) => {
    b.label = i === 2 ? "NEW TAB · " + String(data.wild || "").toUpperCase()
                      : LABELS[i];
    b.labelSize = 26;
    ctx.font = font(800, b.labelSize);
    while (ctx.measureText(b.label).width > textW && b.labelSize > 17) {
      b.labelSize -= 1;
      ctx.font = font(800, b.labelSize);
    }
  });

  const contentH = blocks.reduce((s, b) => s + b.h, 0);
  const WH = Math.max(560, Math.min(880, 152 + contentH + 34));
  const WY = Math.round((CARD_H - WH) / 2 + 44);

  /* ---- background ---- */
  const g = ctx.createLinearGradient(0, 0, CARD_W * 0.35, CARD_H);
  g.addColorStop(0, t.bg[0]);
  g.addColorStop(0.55, t.bg[1]);
  g.addColorStop(1, t.bg[2]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  ctx.save();
  ctx.globalAlpha = 0.35;
  [[160, 190, 260, t.tabs[0]], [950, 540, 300, t.tabs[2]], [210, 1190, 250, t.tabs[1]]]
    .forEach(([x, y, r, c]) => {
      const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, c);
      rg.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    });
  ctx.restore();

  /* ---- tabs perched on the window's top edge ---- */
  const tw = 232, th = 100, gap = -10;
  let tx = WX + 24;
  data.tabs.forEach((tab, i) => {
    ctx.save();
    ctx.translate(tx + tw / 2, WY - th / 2 + 8);
    ctx.rotate((i - 1) * 0.012);
    ctx.fillStyle = t.tabs[i];
    roundRect(ctx, -tw / 2, -th / 2, tw, th + 46, 28);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    roundRect(ctx, -tw / 2 + 18, -th / 2 + 16, tw - 84, 13, 7);
    ctx.fill();
    ctx.font = font(400, 38);
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(tab.mood || MOODS[0], tw / 2 - 20, -th / 2 + 23);
    ctx.restore();
    tx += tw + gap;
  });

  ctx.save();
  ctx.shadowColor = "rgba(40,20,70,0.18)";
  ctx.shadowBlur = 44;
  ctx.shadowOffsetY = 18;
  ctx.fillStyle = t.surface;
  roundRect(ctx, WX, WY, WW, WH, WR);
  ctx.fill();
  ctx.restore();

  /* ---- header ---- */
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = t.ink;
  ctx.font = font(800, 44);
  const head = "3 TABS OPEN";
  const headW = ctx.measureText(head).width;
  ctx.fillText(head, WX + PAD, WY + 94);
  ctx.globalAlpha = 0.45;
  ctx.font = font(800, 32);
  ctx.fillText("· " + prettyDate(data.date), WX + PAD + headW + 20, WY + 93);
  ctx.globalAlpha = 1;

  /* ---- entries ---- */
  let y = WY + 168;
  blocks.forEach((b, i) => {
    ctx.fillStyle = t.tabs[i];
    ctx.globalAlpha = i === 2 ? 1 : 0.8;
    ctx.font = font(800, b.labelSize);
    ctx.fillText(b.label, WX + PAD + GUT, y);
    ctx.globalAlpha = 1;

    ctx.font = font(400, 44);
    ctx.fillText(data.tabs[i].mood || MOODS[0], WX + PAD + 6, y + 44);

    ctx.fillStyle = t.ink;
    ctx.font = font(700, size);
    b.lines.forEach((ln, k) => {
      ctx.fillText(ln, WX + PAD + GUT, y + 44 + k * (size * 1.26));
    });

    y += b.h;
    if (i < 2) {
      ctx.fillStyle = t.ink;
      ctx.globalAlpha = 0.09;
      roundRect(ctx, WX + PAD + GUT, y - 32, WW - PAD * 2 - GUT, 4, 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  });

  /* ---- photo ---- */
  if (data.photo && data.photo.img) {
    const cx = CARD_W - 176, cy = WY + 6, r = 124;
    ctx.save();
    ctx.shadowColor = "rgba(40,20,70,0.25)";
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 10;
    ctx.fillStyle = "#fff";
    ctx.translate(cx, cy);
    ctx.rotate(0.07);
    blobPath(ctx, 0, 0, r + 14);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(0.07);
    blobPath(ctx, 0, 0, r);
    ctx.clip();
    const im = data.photo.img;
    const scale = Math.max((r * 2) / im.width, (r * 2) / im.height);
    ctx.drawImage(im, -im.width * scale / 2, -im.height * scale / 2,
                  im.width * scale, im.height * scale);
    ctx.restore();
  }

  /* ---- footer ---- */
  const fy = Math.min(CARD_H - 88, WY + WH + 96);
  ctx.fillStyle = t.ink;
  ctx.font = font(800, 40);
  ctx.textAlign = "left";
  ctx.globalAlpha = 0.75;
  ctx.fillText("open yours →", WX + 12, fy);
  ctx.textAlign = "right";
  ctx.globalAlpha = 0.42;
  ctx.fillText("TABS", CARD_W - WX - 12, fy);
  ctx.globalAlpha = 1;
}

function canvasToBlob(canvas) {
  return new Promise(res => canvas.toBlob(res, "image/png", 0.95));
}

/* The share sheet is the happy path, but it is blocked in embedded viewers
   and missing on desktop. The caller always shows the press-and-hold image
   too, so a false return here is not a failure. */
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
