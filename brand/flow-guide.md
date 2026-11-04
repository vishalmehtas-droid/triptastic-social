# Making clips in Google Flow for Triptastic Reels

Google Flow (flow.google, included with Google AI Pro) has no API that Claude can drive, so the work is split:

1. **Claude** writes a shot list: one ready-to-paste Flow prompt per clip, in each week's `content/<week>/flow-shots.md`.
2. **You** paste each prompt into Flow, pick the best take and download it (about 10–15 minutes a week).
3. **You** upload the clips in the Claude chat and say which Reel they're for.
4. **Claude** edits them into a branded Reel (`scripts/edit-clips.mjs`): trims, vertical crop, hook text, captions, Triptastic end card. Claude then sends it to you for approval.

## Flow settings
- **Aspect ratio: 9:16 (portrait).** Landscape clips get cropped and lose the edges.
- **Model:** use the cheaper/faster Veo option for drafts and switch to the top-quality one only for the clip you'll actually use. Pro credits are limited each month.
- **Download at 1080p.**
- Name files simply, e.g. `goa-1.mp4`, `goa-2.mp4`, in the order they should play.

## Rules for AI clips
- Use AI clips for **mood and destination scenery**: sunsets, beaches, streets, food, hotel-style shots.
- **Never present an AI clip as a real client trip, a real hotel you've booked, or a real review.** Real client moments come only from your own photos and videos.
- AI-generated people should not look like real, identifiable people.
- Instagram may label AI content ("AI info"). That's fine. Don't try to hide it.

## Prompt pattern Claude uses
`[Shot type], [subject + action], [place], [time of day / light], [camera movement], [mood], vertical 9:16, cinematic travel film, natural colours, no text, no logos`

Example:
> Slow drone shot rising over a quiet beach with palm trees and a wooden fishing boat, North Goa, golden hour, gentle forward glide, calm and warm, vertical 9:16, cinematic travel film, natural colours, no text, no logos

## Best mix
Blend 1–2 Flow clips with your own phone footage (airport, hotel arrival, local food, you talking to camera). Real footage builds trust and AI clips add polish. Claude's editor handles both in the same Reel.
