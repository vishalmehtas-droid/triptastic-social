#!/usr/bin/env node
// Render a branded Triptastic "tips" Reel (1080x1920 MP4) from a JSON spec using HyperFrames.
//
// Usage: node scripts/render-reel.mjs content/2026-w45/reel-honeymoon.json
// Output: the spec's "out" path (default: same folder, same name, .mp4)
//
// Spec shape:
// {
//   "kicker": "17 YEARS OF PLANNING HONEYMOONS",
//   "title": "4 mistakes couples make before the honeymoon",
//   "items": [ { "head": "Booking flights before checking the visa", "body": "Check visa rules **first**. Then lock flights." } ],
//   "cta": { "line": "Planning your honeymoon?\nWe'll handle the details.", "button": "DM \"HONEYMOON\"" },
//   "out": "content/2026-w45/reel-honeymoon.mp4"   // optional
// }
// In "body", **text** is highlighted in the brand accent colour.

import { readFileSync, writeFileSync, mkdtempSync, copyFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve, basename, extname } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const specPath = process.argv[2];
if (!specPath) {
  console.error("Usage: node scripts/render-reel.mjs <spec.json>");
  process.exit(1);
}
const spec = JSON.parse(readFileSync(specPath, "utf8"));
const brand = JSON.parse(readFileSync(join(root, "brand/brand.json"), "utf8"));

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const rich = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\n/g, "<br/>");

if (!spec.title || !Array.isArray(spec.items) || spec.items.length === 0 || !spec.cta) {
  console.error("Spec needs title, items[] and cta.");
  process.exit(1);
}

const INTRO = 3.5, ITEM = 3.5, OUTRO = 3;
const scenes = [];
let t = 0;
scenes.push({ start: t, dur: INTRO, html: `
  <div class="brand">${esc(brand.nameMain)} <b>${esc(brand.nameAccent)}</b></div>
  ${spec.kicker ? `<div class="kicker">${esc(spec.kicker)}</div>` : ""}
  <div class="big">${esc(spec.title)}</div>` });
t += INTRO;
spec.items.forEach((it, i) => {
  scenes.push({ start: t, dur: ITEM, html: `
  <div class="num">${String(i + 1).padStart(2, "0")}</div>
  <div class="tip">${esc(it.head)}</div>
  ${it.body ? `<div class="fix">${rich(it.body)}</div>` : ""}` });
  t += ITEM;
});
scenes.push({ start: t, dur: OUTRO, html: `
  <div class="brand">${esc(brand.nameMain)} <b>${esc(brand.nameAccent)}</b></div>
  <div class="cta">${rich(spec.cta.line)}</div>
  <div><span class="pill">${esc(spec.cta.button)}</span></div>
  ${brand.contactLine ? `<div class="contact">${esc(brand.contactLine)}</div>` : ""}` });
t += OUTRO;
const total = t;
const c = brand.colors;

const html = `<!doctype html>
<html lang="en" data-resolution="portrait">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=1080, height=1920" />
<script src="gsap.min.js"></script>
<style>
:root { --sea:${c.primary}; --deep:${c.dark}; --sun:${c.accent}; --coral:${c.highlight}; --ink:#fff; --font:${brand.font}; }
* { margin:0; padding:0; box-sizing:border-box; }
html, body { width:1080px; height:1920px; overflow:hidden; background:var(--deep); }
#root { width:100%; height:100%; position:relative; font-family:var(--font); color:var(--ink); }
.scene { position:absolute; inset:0; display:flex; flex-direction:column; justify-content:center; padding:0 110px; background:linear-gradient(160deg, var(--sea) 0%, var(--deep) 75%); }
.brand { position:absolute; top:120px; left:110px; font-size:34px; letter-spacing:.18em; text-transform:uppercase; opacity:.85; }
.brand b { color:var(--sun); }
.kicker { font-size:40px; color:var(--sun); font-weight:700; margin-bottom:36px; letter-spacing:.04em; }
.big { font-size:104px; font-weight:800; line-height:1.02; letter-spacing:-.02em; }
.num { font-size:220px; font-weight:900; color:var(--coral); line-height:1; margin-bottom:30px; }
.tip { font-size:82px; font-weight:800; line-height:1.05; margin-bottom:40px; }
.fix { font-size:46px; line-height:1.35; opacity:.92; }
.fix b, .cta b { color:var(--sun); }
.cta { font-size:64px; font-weight:800; line-height:1.15; margin-bottom:50px; }
.pill { display:inline-block; background:var(--sun); color:var(--deep); font-size:48px; font-weight:800; padding:26px 46px; border-radius:80px; }
.contact { margin-top:40px; font-size:40px; opacity:.85; }
.bar { position:absolute; bottom:160px; left:110px; right:110px; height:8px; background:rgba(255,255,255,.15); border-radius:8px; }
.bar i { display:block; height:100%; width:0; background:var(--sun); border-radius:8px; }
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${total}" data-width="1080" data-height="1920">
${scenes.map((s, i) => `<section id="s${i}" class="scene clip" data-start="${s.start}" data-duration="${s.dur}">${s.html}
</section>`).join("\n")}
<div class="bar clip" data-start="0" data-duration="${total}"><i id="prog"></i></div>
</div>
<script>
const tl = gsap.timeline({ paused: true });
tl.to("#prog", { width: "100%", duration: ${total}, ease: "none" }, 0);
${JSON.stringify(scenes.map((s) => s.start))}.forEach((t, i) => {
  tl.fromTo("#s" + i + " > *", { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.18, ease: "power3.out" }, t + 0.05);
});
window.__timelines["main"] = tl;
tl.seek(0);
</script>
</body>
</html>
`;

const work = mkdtempSync(join(tmpdir(), "tt-reel-"));
const tpl = join(root, "templates/tips-reel");
for (const f of ["gsap.min.js", "hyperframes.json", "meta.json"]) copyFileSync(join(tpl, f), join(work, f));
writeFileSync(join(work, "index.html"), html);

const out = resolve(spec.out ? join(root, spec.out) : join(dirname(resolve(specPath)), basename(specPath, extname(specPath)) + ".mp4"));
const bin = join(root, "node_modules/.bin/hyperframes");
try {
  execFileSync(bin, ["render", "-o", out], { cwd: work, stdio: "inherit", env: { ...process.env, HYPERFRAMES_SKIP_SKILLS: "1" } });
  console.log(`\nRendered ${total}s reel -> ${out}`);
} finally {
  rmSync(work, { recursive: true, force: true });
}
