#!/usr/bin/env node
// Edit raw clips (e.g. downloaded from Google Flow / Veo, phone videos) into a branded
// Triptastic Instagram Reel (1080x1920 MP4) with HyperFrames.
//
// Usage: node scripts/edit-clips.mjs content/2026-w46/reel-goa.json
//
// Spec shape (paths relative to the repo root):
// {
//   "hook": "Goa beyond the beaches",            // big text over the first clip (optional)
//   "clips": [
//     { "file": "incoming/goa-1.mp4", "caption": "Sunrise at **Chapora Fort**", "trimStart": 0, "duration": 4 }
//   ],
//   "keepAudio": false,      // true keeps each clip's own sound (e.g. Veo dialogue/ambience)
//   "music": "",             // optional audio file laid under the whole reel (leave empty and add trending audio in Instagram)
//   "voiceover": "",         // optional narration (e.g. your cloned voice from VoiceStudio); clip sound and music are lowered under it
//   "cta": { "line": "Want this trip?\nWe'll plan it.", "button": "DM \"GOA\"" },
//   "out": "content/2026-w46/reel-goa.mp4"   // optional
// }
// Landscape (16:9) clips are cropped to fill the vertical frame; generate 9:16 in Flow when possible.
// "duration" defaults to the whole clip after trimStart. In captions, **text** is highlighted in brand gold.

import { readFileSync, writeFileSync, mkdtempSync, copyFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve, basename, extname } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const specPath = process.argv[2];
if (!specPath) {
  console.error("Usage: node scripts/edit-clips.mjs <spec.json>");
  process.exit(1);
}
const spec = JSON.parse(readFileSync(specPath, "utf8"));
const brand = JSON.parse(readFileSync(join(root, "brand/brand.json"), "utf8"));
if (!Array.isArray(spec.clips) || spec.clips.length === 0 || !spec.cta) {
  console.error("Spec needs clips[] and cta.");
  process.exit(1);
}

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const rich = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\n/g, "<br/>");
const probe = (f) =>
  parseFloat(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString().trim());
const r2 = (n) => Math.round(n * 100) / 100;

const work = mkdtempSync(join(tmpdir(), "tt-clips-"));
const tpl = join(root, "templates/tips-reel");
for (const f of ["gsap.min.js", "hyperframes.json", "meta.json"]) copyFileSync(join(tpl, f), join(work, f));
copyFileSync(join(root, brand.logo), join(work, "logo.png"));

const OUTRO = 3;
let t = 0;
const parts = [];
const anims = [];
spec.clips.forEach((c, i) => {
  const src = resolve(root, c.file);
  if (!existsSync(src)) throw new Error(`Clip not found: ${c.file}`);
  const name = `clip${i}${extname(src) || ".mp4"}`;
  copyFileSync(src, join(work, name));
  const trim = c.trimStart || 0;
  const dur = r2(c.duration || probe(src) - trim);
  if (!(dur > 0)) throw new Error(`Clip ${c.file} has no usable length after trimStart`);
  const audio = spec.keepAudio ? `data-has-audio="true" data-volume="${spec.voiceover ? 0.25 : 1}" data-fade-in="0.2" data-fade-out="0.2"` : "muted";
  parts.push(`<video id="v${i}" class="clip media" src="${name}" data-start="${t}" data-duration="${dur}" data-media-start="${trim}" ${audio} playsinline></video>`);
  if (i === 0 && spec.hook) {
    parts.push(`<div id="hook" class="clip hook" data-start="${t}" data-duration="${r2(Math.min(dur, 3.5))}">
      <div class="badge"><img src="logo.png" alt="Triptastic" /></div>
      <div class="hooktext">${rich(spec.hook)}</div></div>`);
    anims.push(`tl.fromTo("#hook > *", {opacity:0, y:50}, {opacity:1, y:0, duration:.6, stagger:.15, ease:"power3.out"}, ${t + 0.1});`);
  }
  if (c.caption) {
    const capStart = i === 0 && spec.hook ? r2(t + Math.min(dur, 3.5)) : t;
    const capDur = r2(t + dur - capStart);
    if (capDur > 0.3) {
      parts.push(`<div id="cap${i}" class="clip cap" data-start="${capStart}" data-duration="${capDur}"><span>${rich(c.caption)}</span></div>`);
      anims.push(`tl.fromTo("#cap${i} span", {opacity:0, y:30}, {opacity:1, y:0, duration:.45, ease:"power2.out"}, ${capStart + 0.1});`);
    }
  }
  t = r2(t + dur);
});
parts.push(`<section id="outro" class="clip endcard" data-start="${t}" data-duration="${OUTRO}">
  <img class="endlogo" src="logo.png" alt="Triptastic" />
  <div class="cta">${rich(spec.cta.line)}</div>
  <div><span class="pill">${esc(spec.cta.button)}</span></div>
  ${brand.contactLine ? `<div class="contact">${esc(brand.contactLine)}</div>` : ""}
</section>`);
anims.push(`tl.fromTo("#outro > *", {opacity:0, y:60}, {opacity:1, y:0, duration:.6, stagger:.18, ease:"power3.out"}, ${t + 0.05});`);
const total = r2(t + OUTRO);

if (spec.music) {
  const m = resolve(root, spec.music);
  if (!existsSync(m)) throw new Error(`Music not found: ${spec.music}`);
  copyFileSync(m, join(work, "music" + extname(m)));
  parts.push(`<audio class="clip" src="music${extname(m)}" data-start="0" data-duration="${total}" data-volume="${spec.voiceover ? 0.2 : 0.7}" data-fade-out="1.5"></audio>`);
}
if (spec.voiceover) {
  const v = resolve(root, spec.voiceover);
  if (!existsSync(v)) throw new Error(`Voiceover not found: ${spec.voiceover}`);
  const vd = probe(v);
  if (vd > total - 0.3) console.warn(`Warning: voiceover is ${r2(vd)}s but the reel is ${total}s; the end will be cut. Add clip time or trim the script.`);
  copyFileSync(v, join(work, "voiceover" + extname(v)));
  parts.push(`<audio class="clip" src="voiceover${extname(v)}" data-start="0.3" data-duration="${r2(total - 0.3)}" data-volume="1" data-fade-out="0.4"></audio>`);
}

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
html, body { width:1080px; height:1920px; overflow:hidden; background:#000; }
#root { width:100%; height:100%; position:relative; font-family:var(--font); color:#fff; }
.media { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
.hook { position:absolute; inset:0; display:flex; flex-direction:column; justify-content:center; padding:0 90px;
  background:linear-gradient(180deg, rgba(0,0,0,.45) 0%, rgba(0,0,0,.1) 45%, rgba(0,0,0,.55) 100%); }
.hooktext { font-size:100px; font-weight:800; line-height:1.03; letter-spacing:-.02em; text-shadow:0 4px 24px rgba(0,0,0,.5); }
.hooktext b, .cap b { color:var(--gold); }
.badge { position:absolute; top:100px; left:80px; background:rgba(255,255,255,.94); border-radius:28px; padding:18px 26px; box-shadow:0 6px 24px rgba(0,0,0,.25); }
.badge img { display:block; width:300px; }
.cap { position:absolute; left:0; right:0; bottom:0; height:700px; display:flex; align-items:flex-end; padding:0 90px 260px;
  background:linear-gradient(0deg, rgba(0,0,0,.65) 0%, rgba(0,0,0,0) 100%); }
.cap span { font-size:64px; font-weight:800; line-height:1.12; text-shadow:0 3px 16px rgba(0,0,0,.6); }
.endcard { position:absolute; inset:0; display:flex; flex-direction:column; justify-content:center; padding:0 110px; color:var(--teal);
  background:linear-gradient(165deg, #ffffff 0%, var(--cream) 70%, #ffe9cf 100%); }
.endcard::after { content:""; position:absolute; left:0; right:0; bottom:0; height:22px; background:linear-gradient(90deg, var(--gold), var(--orange), var(--red)); }
.endlogo { width:620px; margin:0 0 70px -20px; }
.cta { font-size:64px; font-weight:800; line-height:1.15; margin-bottom:50px; }
.cta b { color:var(--red); }
.pill { display:inline-block; background:linear-gradient(90deg, var(--orange), var(--red)); color:#fff; font-size:48px; font-weight:800; padding:26px 46px; border-radius:80px; }
.contact { margin-top:40px; font-size:40px; color:var(--tealDark); }
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${total}" data-width="1080" data-height="1920">
${parts.join("\n")}
</div>
<script>
const tl = gsap.timeline({ paused: true });
${anims.join("\n")}
tl.set({}, {}, ${total});
window.__timelines["main"] = tl;
tl.seek(0);
</script>
</body>
</html>
`;
writeFileSync(join(work, "index.html"), html);

const out = resolve(spec.out ? resolve(root, spec.out) : join(dirname(resolve(specPath)), basename(specPath, extname(specPath)) + ".mp4"));
try {
  execFileSync(join(root, "node_modules/.bin/hyperframes"), ["render", "-o", out], {
    cwd: work, stdio: "inherit", env: { ...process.env, HYPERFRAMES_SKIP_SKILLS: "1" },
  });
  console.log(`\nRendered ${total}s reel from ${spec.clips.length} clip(s) -> ${out}`);
} finally {
  rmSync(work, { recursive: true, force: true });
}
