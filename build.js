/* Inlines css + js into one self-contained file for publishing.
   Usage: node build.js   ->  dist/tabs.html */
const fs = require("fs"), path = require("path");
const root = __dirname;
let html = fs.readFileSync(path.join(root, "index.html"), "utf8");

html = html.replace(
  /<link rel="stylesheet" href="(css\/[^"]+)">/g,
  (_, f) => `<style>\n${fs.readFileSync(path.join(root, f), "utf8")}\n</style>`
);
html = html.replace(
  /<script src="(js\/[^"]+)"><\/script>/g,
  (_, f) => `<script>\n${fs.readFileSync(path.join(root, f), "utf8")}\n</script>`
);

fs.mkdirSync(path.join(root, "dist"), { recursive: true });
fs.writeFileSync(path.join(root, "dist", "tabs.html"), html);

/* Artifact build: the publisher supplies its own doctype/head/body wrapper,
   so strip ours. Title goes first — only the first 8KB is scanned for it. */
const grab = re => (html.match(re) || [, ""])[1];
const inner = grab(/<body[^>]*>([\s\S]*)<\/body>/i);
const styles = (html.match(/<style>[\s\S]*?<\/style>/gi) || []).join("\n");
const fonts = (html.match(/<link[^>]+fonts\.googleapis[^>]*>/gi) || []).join("\n");
const art = [
  "<title>TABS</title>",
  fonts,
  styles,
  inner.trim()
].join("\n");
fs.writeFileSync(path.join(root, "dist", "artifact.html"), art);

/* GitHub Pages serves from /docs */
fs.mkdirSync(path.join(root, "docs"), { recursive: true });
fs.writeFileSync(path.join(root, "docs", "index.html"), html);

console.log("dist/tabs.html", (html.length / 1024).toFixed(1) + "kb");
console.log("dist/artifact.html", (art.length / 1024).toFixed(1) + "kb");
console.log("docs/index.html");
