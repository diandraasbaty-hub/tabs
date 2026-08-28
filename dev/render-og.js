/* Renders the link-preview image locally so it can be looked at before any
   deploy. Same module the Vercel endpoint uses. */
import fs from "node:fs";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { decodeCard, previewTree } from "../api/_card.js";

const SAMPLE = process.argv[2] || "eyJ0IjpbWyJ3aHkgZG8gaG90ZWwgc2hvd2VycyBoYXZlIHNldmVudGVlbiBzZXR0aW5ncyIsNV0sWyJ0aHJlZSBjYWxscyBhbmQgYSBsYW5lIHJlbnRhbCBJIGZvcmdvdCB0byBib29rIiw0XSxbInNvbWVvbmUgdG8gdGVsbCBtZSB0aGUgZGVjayBsb29rcyBmaW5lIiwyXV0sInciOiJ3aGF0IHdvdWxkIG1ha2UgdG9tb3Jyb3cgZWFzaWVyIiwiaCI6ImJ1YmJsZWd1bSIsImQiOiIyMDI2LTA4LTI4In0";

const card = decodeCard(SAMPLE);
if (!card) throw new Error("sample payload did not decode");

const fonts = [
  { name: "Nunito", weight: 700, style: "normal",
    data: fs.readFileSync(new URL("../assets/Nunito-700.ttf", import.meta.url)) },
  { name: "Nunito", weight: 800, style: "normal",
    data: fs.readFileSync(new URL("../assets/Nunito-800.ttf", import.meta.url)) }
];

const svg = await satori(previewTree(card), { width: 1200, height: 630, fonts });
const png = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } })
  .render().asPng();

const out = process.env.OUT || "dev/preview.png";
fs.writeFileSync(out, png);
console.log(`${out}  ${(png.length / 1024).toFixed(0)}kb`);
