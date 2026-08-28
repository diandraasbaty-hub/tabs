/* The link-preview image. iMessage fetches this, which is how the tabs show
   up in the thread without anyone tapping. */
import { ImageResponse } from "@vercel/og";
import { decodeCard, previewTree } from "./_card.js";

export const config = { runtime: "edge" };

let fontCache = null;
async function fonts() {
  if (fontCache) return fontCache;
  const [w700, w800] = await Promise.all([
    fetch(new URL("../assets/Nunito-700.ttf", import.meta.url)).then(r => r.arrayBuffer()),
    fetch(new URL("../assets/Nunito-800.ttf", import.meta.url)).then(r => r.arrayBuffer())
  ]);
  fontCache = [
    { name: "Nunito", data: w700, weight: 700, style: "normal" },
    { name: "Nunito", data: w800, weight: 800, style: "normal" }
  ];
  return fontCache;
}

export default async function handler(req) {
  const card = decodeCard(new URL(req.url).searchParams.get("c") || "");
  if (!card) return new Response("no card", { status: 400 });
  return new ImageResponse(previewTree(card), {
    width: 1200,
    height: 630,
    fonts: await fonts(),
    headers: { "cache-control": "public, max-age=31536000, immutable" }
  });
}
