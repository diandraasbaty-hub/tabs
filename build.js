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

/* GitHub Pages serves from /docs */
fs.mkdirSync(path.join(root, "docs"), { recursive: true });
fs.writeFileSync(path.join(root, "docs", "index.html"), html);

console.log("dist/tabs.html", (html.length / 1024).toFixed(1) + "kb");
console.log("dist/artifact.html", (art.length / 1024).toFixed(1) + "kb");
console.log("docs/index.html");
