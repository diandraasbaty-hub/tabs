/* Serves the app with preview tags built from the card in the URL. Static
   hosting cannot do this — the tags have to change per card. */
import { PAGE } from "./_page.js";
import { decodeCard } from "./_card.js";

export const config = { runtime: "edge" };

const esc = s => String(s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;")
  .replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export default function handler(req) {
  const url = new URL(req.url);
  const raw = url.searchParams.get("c") || "";
  const card = decodeCard(raw);
  const origin = url.origin;

  let title = "TABS";
  let desc = "Three things open in your head. Send them to someone.";
  let image = origin + "/og.png";

  if (card) {
    title = card.name ? card.name + " · 3 tabs open" : "3 tabs open in my head";
    desc = card.tabs.map(t => t.text).filter(Boolean).join("  ·  ").slice(0, 190);
    image = origin + "/api/og?c=" + encodeURIComponent(raw);
  }

  const tags = [
    `<meta name="description" content="${esc(desc)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="TABS">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(desc)}">`,
    `<meta property="og:url" content="${esc(origin + url.pathname + url.search)}">`,
    `<meta property="og:image" content="${esc(image)}">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${esc(title)}">`,
    `<meta name="twitter:description" content="${esc(desc)}">`,
    `<meta name="twitter:image" content="${esc(image)}">`
  ].join("\n");

  return new Response(PAGE.replace("__OG_TAGS__", tags), {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=300"
    }
  });
}
