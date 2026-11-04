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
//   "voiceover": "incoming/2026-w46/vo-honeymoon.mp3", // optional narration (e.g. your cloned voice from VoiceStudio);
//                                                       // scenes stretch evenly so the reel is never shorter than the voiceover
//   "out": "content/2026-w45/reel-honeymoon.mp4"   // optional
// }
// In "body", **text** is highlighted in the brand red.

import { readFileSync, writeFileSync, mkdtempSync, copyFileSync, rmSync, existsSync } from "node:fs";
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

let INTRO = 3.5, ITEM = 3.5, OUTRO = 3;
let vo = null;
if (spec.voiceover) {
  vo = resolve(root, spec.voiceover);
  if (!existsSync(vo)) throw new Error(`Voiceover not found: ${spec.voiceover}`);
  const voDur = parseFloat(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", vo]).toString().trim());
  const base = INTRO + ITEM * spec.items.length + OUTRO;
  const k = Math.max(1, (voDur + 0.8) / base);
  INTRO = Math.round(INTRO * k * 100) / 100; ITEM = Math.round(ITEM * k * 100) / 100; OUTRO = Math.round(OUTRO * k * 100) / 100;
}
const scenes = [];
let t = 0;
scenes.push({ start: t, dur: INTRO, html: `
  <img class="logo" src="logo.png" alt="Triptastic" />
  ${spec.kicker ? `<div class="kicker">${esc(spec.kicker)}</div>` : ""}
  <div class="big">${esc(spec.title)}</div>` });
t = Math.round((t + INTRO) * 100) / 100;
spec.items.forEach((it, i) => {
  scenes.push({ start: t, dur: ITEM, html: `
  <div class="num">${String(i + 1).padStart(2, "0")}</div>
  <div class="tip">${esc(it.head)}</div>
  ${it.body ? `<div class="fix">${rich(it.body)}</div>` : ""}` });
  t = Math.round((t + ITEM) * 100) / 100;
});
scenes.push({ start: t, dur: OUTRO, html: `
  <img class="endlogo" src="logo.png" alt="Triptastic" />
  <div class="cta">${rich(spec.cta.line)}</div>
  <div><span class="pill">${esc(spec.cta.button)}</span></div>
  ${brand.contactLine ? `<div class="contact">${esc(brand.contactLine)}</div>` : ""}` });
t = Math.round((t + OUTRO) * 100) / 100;
const total = Math.round(t * 100) / 100;
const c = brand.colors;

const html = `<!doctype html>
<html lang="en" data-resolution="portrait">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=1080, height=1920" />
<script src="gsap.min.js"></script>
<style>
:root { --teal:${c.teal}; --tealDark:${c.tealDark}; --gold:${c.gold}; --orange:${c.orange}; --red:${c.red}; --cream:${c.cream}; --font:${brand.font}; }
* { margin:0; padding:0; box-sizing:border-box; }
html, body { width:1080px; height:1920px; overflow:hidden; background:var(--cream); }
#root { width:100%; height:100%; position:relative; font-family:var(--font); color:var(--tealDark); }
.scene { position:absolute; inset:0; display:flex; flex-direction:column; justify-content:center; padding:0 110px; background:linear-gradient(165deg, #ffffff 0%, var(--cream) 70%, #ffe9cf 100%); }
.scene::after { content:""; position:absolute; left:0; right:0; bottom:0; height:22px; background:linear-gradient(90deg, var(--gold), var(--orange), var(--red)); }
.logo { position:absolute; top:110px; left:100px; width:340px; }
.endlogo { width:620px; margin:0 0 70px -20px; }
.kicker { font-size:40px; color:var(--orange); font-weight:800; margin-bottom:36px; letter-spacing:.04em; }
.big { font-size:104px; font-weight:800; line-height:1.02; letter-spacing:-.02em; color:var(--teal); }
.num { align-self:flex-start; font-size:220px; font-weight:900; line-height:1; margin-bottom:30px; background:linear-gradient(90deg, var(--gold), var(--orange) 45%, var(--red)); -webkit-background-clip:text; background-clip:text; color:transparent; }
.tip { font-size:82px; font-weight:800; line-height:1.05; margin-bottom:40px; color:var(--teal); }
.fix { font-size:46px; line-height:1.35; color:#3b4a4f; }
.fix b, .cta b { color:var(--red); }
.cta { font-size:64px; font-weight:800; line-height:1.15; margin-bottom:50px; color:var(--teal); }
.pill { display:inline-block; background:linear-gradient(90deg, var(--orange), var(--red)); color:#fff; font-size:48px; font-weight:800; padding:26px 46px; border-radius:80px; }
.contact { margin-top:40px; font-size:40px; color:var(--tealDark); }
.bar { position:absolute; bottom:160px; left:110px; right:110px; height:8px; background:rgba(1,137,159,.15); border-radius:8px; }
.bar i { display:block; height:100%; width:0; background:linear-gradient(90deg, var(--gold), var(--orange), var(--red)); border-radius:8px; }
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${total}" data-width="1080" data-height="1920">
${scenes.map((s, i) => `<section id="s${i}" class="scene clip" data-start="${s.start}" data-duration="${s.dur}">${s.html}
</section>`).join("\n")}
<div class="bar clip" data-start="0" data-duration="${total}"><i id="prog"></i></div>
${vo ? `<audio class="clip" src="voiceover${extname(vo)}" data-start="0.3" data-duration="${Math.round((total - 0.3) * 100) / 100}" data-volume="1" data-fade-out="0.4"></audio>` : ""}
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
copyFileSync(join(root, brand.logo), join(work, "logo.png"));
if (vo) copyFileSync(vo, join(work, "voiceover" + extname(vo)));
writeFileSync(join(work, "index.html"), html);

const out = resolve(spec.out ? resolve(root, spec.out) : join(dirname(resolve(specPath)), basename(specPath, extname(specPath)) + ".mp4"));
const bin = join(root, "node_modules/.bin/hyperframes");
try {
  execFileSync(bin, ["render", "-o", out], { cwd: work, stdio: "inherit", env: { ...process.env, HYPERFRAMES_SKIP_SKILLS: "1" } });
  console.log(`\nRendered ${total}s reel -> ${out}`);
} finally {
  rmSync(work, { recursive: true, force: true });
}
