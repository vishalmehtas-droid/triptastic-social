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
   - Use the `linkedin-skills` humanizer pass on LinkedIn drafts when available.
3. Commit + push, then send the owner the drafts (text in chat + the MP4 files) and ask them to approve, edit or reject each post by ID (LI-1, IG-2…).
4. On approval: mark `APPROVED` in `posts.md`. If the Publora connector is available, schedule each approved post for its slot and mark `SCHEDULED`. If not, give the owner the final text and files to paste, ready to copy.
5. After posting, add a row to `log.md`. When stats are available (Publora `post_stats`), record them and use them to pick next week's topics.

## Reel template
`scripts/render-reel.mjs` builds a branded 1080×1920 tips Reel from a JSON spec using HyperFrames (heygen-com/hyperframes, pinned in package.json). Colours, name and contact line come from `brand/brand.json`. Instagram audio is added by the owner in-app (trending audio gets more reach).
Chromium is pre-installed in the cloud session. GSAP is vendored locally because the renderer's browser cannot reach CDNs.
