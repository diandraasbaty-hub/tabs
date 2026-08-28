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


/* Static check: app.js calling a function that no longer exists shipped a
   dead Send button once. Fail the build instead. */
const BUILTINS = new Set(("Promise Array Object JSON String Number Boolean Math Date " +
  "Error TypeError RegExp Set Map Symbol parseInt parseFloat isNaN isFinite " +
  "encodeURIComponent decodeURIComponent btoa atob setTimeout clearTimeout " +
  "setInterval clearInterval requestAnimationFrame TextEncoder TextDecoder " +
  "Uint8Array Image File Blob FileReader URLSearchParams Event CustomEvent " +
  "ClipboardItem console alert fetch structuredClone queueMicrotask").split(/\s+/));
const KEYWORDS = new Set(("if for while switch catch return function typeof new await async " +
  "else do try throw delete void yield in of instanceof case").split(/\s+/));

function auditScripts(files) {
  /* strip comments and string bodies first — css colors and gradients inside
     string literals look exactly like function calls to a regex */
  const strip = s => s
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\/\/[^\n]*/g, " ")
    .replace(/`(?:\\.|[^`\\])*`/g, '""')
    .replace(/'(?:\\.|[^'\\\n])*'/g, '""')
    .replace(/"(?:\\.|[^"\\\n])*"/g, '""');

  const declared = new Set();
  const raw = files.map(f => fs.readFileSync(path.join(root, f), "utf8"));
  const sources = raw.map(strip);

  const addParams = list => list.split(",").forEach(p => {
    (p.match(/[A-Za-z_$][\w$]*/g) || []).forEach(n => declared.add(n));
  });

  sources.forEach(src => {
    for (const m of src.matchAll(/(?:async\s+)?function\s*([A-Za-z_$][\w$]*)?\s*\(([^)]*)\)/g)) {
      if (m[1]) declared.add(m[1]);
      addParams(m[2]);
    }
    for (const m of src.matchAll(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g))
      declared.add(m[1]);
    for (const m of src.matchAll(/\(([^()]*)\)\s*=>/g)) addParams(m[1]);
    for (const m of src.matchAll(/([A-Za-z_$][\w$]*)\s*=>/g)) declared.add(m[1]);
    for (const m of src.matchAll(/catch\s*\(\s*([A-Za-z_$][\w$]*)/g)) declared.add(m[1]);
  });

  const missing = new Map();
  sources.forEach((src, i) => {
    for (const m of src.matchAll(/(?<![.\w$])([A-Za-z_$][\w$]*)\s*\(/g)) {
      const name = m[1];
      if (declared.has(name) || BUILTINS.has(name) || KEYWORDS.has(name)) continue;
      if (!missing.has(name)) missing.set(name, files[i]);
    }
  });
  if (missing.size) {
    const lines = [...missing].map(([n, f]) => `  ${n}()  called in ${f}`);
    throw new Error("Undefined function(s):\n" + lines.join("\n"));
  }
  console.log(`audit ok — ${declared.size} names known, no undefined calls`);
}

auditScripts(["js/prompts.js", "js/state.js", "js/card.js", "js/app.js"]);

/* A $("id") with no matching element throws at boot and kills the whole app —
   silently, since it happens before anything is drawn. */
function auditElements() {
  const markup = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const ids = new Set([...markup.matchAll(/id="([^"]+)"/g)].map(m => m[1]));
  const script = fs.readFileSync(path.join(root, "js/app.js"), "utf8");
  const used = new Set([...script.matchAll(/\$\("([^"]+)"\)/g)].map(m => m[1]));
  const missing = [...used].filter(id => !ids.has(id));
  if (missing.length) {
    throw new Error("Referenced but missing from index.html: " + missing.join(", "));
  }
  console.log(`audit ok — ${used.size} element references all resolve`);
}
auditElements();


/* GitHub Pages serves from /docs */
fs.mkdirSync(path.join(root, "docs"), { recursive: true });
fs.writeFileSync(path.join(root, "docs", "index.html"), html);


/* Vercel needs the page as a JS string with a slot for per-card preview tags,
   plus its own copy of the static assets. */
const OG_BLOCK = /<!--og:start-->[\s\S]*?<!--og:end-->/;
if (!OG_BLOCK.test(html)) throw new Error("og marker block missing from index.html");

const pageForEdge = html.replace(OG_BLOCK, "__OG_TAGS__");
if (!pageForEdge.includes("__OG_TAGS__")) throw new Error("og slot not inserted");
fs.writeFileSync(path.join(root, "api", "_page.js"),
  "/* generated by build.js — do not edit */\nexport const PAGE = " +
  JSON.stringify(pageForEdge) + ";\n");

fs.mkdirSync(path.join(root, "public"), { recursive: true });
["og.png", "icon.png"].forEach(f => {
  fs.copyFileSync(path.join(root, "docs", f), path.join(root, "public", f));
});

/* THEMES lives in two places (browser bundle + edge renderer). Assert they
   match so a palette change cannot silently apply to only one. */
const themeIds = s => (s.match(/id:\s*"([a-z]+)"/g) || []).join(",");
const browserThemes = themeIds(fs.readFileSync(path.join(root, "js/state.js"), "utf8"));
const edgeThemes = themeIds(fs.readFileSync(path.join(root, "api/_card.js"), "utf8"));
if (browserThemes !== edgeThemes) {
  throw new Error("THEMES drift between js/state.js and api/_card.js");
}
console.log("api/_page.js + public/ written; themes in sync");

console.log("dist/tabs.html", (html.length / 1024).toFixed(1) + "kb");
console.log("dist/artifact.html", (art.length / 1024).toFixed(1) + "kb");
console.log("docs/index.html");
