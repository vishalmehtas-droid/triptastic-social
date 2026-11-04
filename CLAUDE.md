# Triptastic Holidays social media: operating manual for Claude

This repo runs the LinkedIn + Instagram content for Triptastic Holidays LLP. The owner does not code. Their only jobs are **approving content** and supplying photos and stories. Claude does everything else.

## Goal and audience
- Grow the Triptastic brand and get enquiries for family trips, honeymoons, and domestic and international holidays.
- Audience: families, couples, friends, honeymooners (India).
- Owner's time budget: 2–3 hours/week, mostly approving.

## Hard rules
1. **Nothing is published without the owner's explicit approval** of that exact post. An approval of one week never carries over to the next.
2. **Use only facts in `brand/story-bank.md`.** Never invent client stories, names, numbers, reviews, prices or results. When a post needs a missing fact, leave a `[bracketed question]`.
3. General travel advice (visa, passports, packing, pacing) is fine, but avoid exact visa rules or prices for specific countries unless verified that week. Rules change.
4. Client photos or names only with permission recorded in the story bank.
5. Keep commits small; never force-push.

## Weekly workflow (every Monday)
1. Read `brand/story-bank.md`, `brand/brand.json`, `log.md` (what was posted and how it did) and the last 2 weeks of `content/`.
2. Create `content/<YYYY>-w<NN>/` with:
   - `posts.md`: 3 LinkedIn posts (Tue/Wed/Thu 9:00 AM IST) and 3 Instagram posts (2 Reels + 1 photo), following the format of `content/2026-w45/posts.md`.
   - Mix across the week: ~40% travel expertise, ~30% story/behind-the-scenes, ~20% community (polls, questions), max 1 offer post. Don't repeat a hook style or topic used in the last 2 weeks.
   - For each Reel, a JSON spec (see `scripts/render-reel.mjs` header) then render it: `npm install` once, then `node scripts/render-reel.mjs content/<week>/<reel>.json`. Check frames with ffmpeg before sending.
   - At least one Reel per week should use real or Flow footage: write `flow-shots.md` (3–4 ready-to-paste Google Flow prompts, following `brand/flow-guide.md`) and a `reel-<topic>.json` clip spec. When the owner uploads the clips, save them in `incoming/<week>/`, then run `node scripts/edit-clips.mjs content/<week>/reel-<topic>.json`. If no clips arrive by Wednesday, fall back to a `render-reel.mjs` text Reel.
   - For each Reel, also write `vo-<topic>.txt`: a 20–30 second spoken voiceover script (~60–75 words, conversational, first person plural for the brand). If the owner uploads a voiceover MP3 (own recording or VoiceStudio clone, see `brand/voice-guide.md`), save it in `incoming/<week>/`, add `"voiceover"` to the Reel spec and re-render.
   - Use the `linkedin-skills` humanizer pass on LinkedIn drafts when available.
3. For every Reel run `bash scripts/storyboard.sh <reel>.mp4` (one-image contact sheet of every scene). Commit + push, then send the owner the drafts: text in chat + each Reel's **storyboard first**, then the MP4. Apply the style notes in `brand/style-references.md` and ask them to approve, edit or reject each post by ID (LI-1, IG-2…).
4. On approval: mark `APPROVED` in `posts.md`. If the Publora connector is available, schedule each approved post for its slot and mark `SCHEDULED`. If not, give the owner the final text and files to paste, ready to copy.
5. After posting, add a row to `log.md`. When stats are available (Publora `post_stats`), record them and use them to pick next week's topics.

## Clip editor (Google Flow / phone footage)
`scripts/edit-clips.mjs` turns raw clips into a branded Reel: trims, vertical crop, hook text over clip 1, captions per clip, optional music, Triptastic end card. Spec format is in the script header. AI clips are for scenery and mood only. Never present them as real client trips, real hotels or reviews (see `brand/flow-guide.md`).

## OpenMontage (agent-driven video production)
Installed on demand with `bash scripts/setup-openmontage.sh` (~8 min, pinned commit; lands in `../OpenMontage`). Read its `AGENT_GUIDE.md` and follow its pipeline + approval gates; don't improvise. Use it for:
- **documentary-montage**: destination Reels from real, free stock footage (Pexels/Pixabay; free for commercial use). Prefer this to AI clips for showing real places.
- **talking-head**: owner's phone videos with word-level captions.
- **localization-dub**: Hindi/regional versions of Reels.
- **clip-factory**: several Reels from one long video.
Always pass its output through `scripts/edit-clips.mjs` (or its HyperFrames compose with the brand colours/logo) so every Reel carries the Triptastic logo and end card.
Needs network access to: api.pexels.com, pixabay.com, cdn.pixabay.com, videos.pexels.com, images.pexels.com, huggingface.co (+ cdn-lfs.huggingface.co, cas-bridge.xethub.hf.co) for voice/caption models. If a host is blocked, tell the owner which one; don't fake output.

## Running on the owner's computer (optional)
The same repo works with the Claude desktop app (Claude Code) on the owner's computer, which avoids this cloud session's limits: raw footage straight from a local folder or hard disk, Whisper captions and Pexels/Hugging Face downloads (not blocked locally). If the owner connects a folder through Remote Control, prefer working there for footage-heavy edits.

## Export quality
Render at 1080×1920. Instagram re-compresses everything to 1080 wide, so 4K exports only cost render time and upload size.

## Reel template
`scripts/render-reel.mjs` builds a branded 1080×1920 tips Reel from a JSON spec using HyperFrames (heygen-com/hyperframes, pinned in package.json). Colours, name and contact line come from `brand/brand.json`. Instagram audio is added by the owner in-app (trending audio gets more reach).
Chromium is pre-installed in the cloud session. GSAP is vendored locally because the renderer's browser cannot reach CDNs.
