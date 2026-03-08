# Feature Visibility Matrix and UAT

A feature is not done unless it is both **working** and **visible**.

## 1. Visibility matrix

| Feature | Popup entry | FAB entry | Hub/Sidebar entry | Always-visible surface | Must work end-to-end |
|---|---|---|---|---|---|
| Welcome / onboarding | Yes | Indirect | Yes | First run | Yes |
| Quick tour | Yes | Yes | Yes | No | Yes |
| Folder organization | Optional shortcut | Optional | Yes | No | Yes |
| Smart queue | Status only | Optional | Yes | Queue count may be visible | Yes |
| Prompt library | Yes | Yes | Yes | No | Yes |
| Prompt variables | No | Via prompt library | Via prompt library | No | Yes |
| Prompt optimizer | Yes | Yes | Yes | No | Yes |
| Semantic clipboard | Yes | Optional | Yes | No | Yes |
| Export PDF/DOCX | Yes | Yes | Yes | No | Yes |
| Token/model overlay | Setting/toggle | Optional | Settings | Yes when enabled | Yes |
| Code canvas | Optional | Optional | Utilities/Message action | No | Yes |
| HUD settings | Yes | Optional | Yes | No | Yes |
| Window recovery/reset | Yes | Optional | Yes | No | Yes |

## 2. UAT checklist

### A. Install and load

- [ ] `bun run build` exits successfully.
- [ ] `dist/manifest.json` is valid MV3.
- [ ] Background/service worker output exists and is not ESM-import based.
- [ ] ChatGPT content script output exists.
- [ ] Gemini content script output exists.
- [ ] Brave loads the unpacked `dist/` extension with no red error badge.

### B. Branding and welcome flow

- [ ] First run shows the circular logo as the main focal point.
- [ ] Welcome composition is circle-first, not buried in a generic card.
- [ ] `Get Started` persists onboarding completion.
- [ ] Welcome does not randomly reappear after cross-tab sync.
- [ ] Branding remains visible in popup and major modal/window headers.
- [ ] Watermark/logo usage does not overpower readable content.

### C. Popup

- [ ] Popup opens with working icon/branding.
- [ ] Popup provides obvious entry points to settings, quick tour, prompts, optimizer, export.
- [ ] Popup settings write through to shared HUD state.

### D. FAB and quick actions

- [ ] FAB is visible on both ChatGPT and Gemini.
- [ ] FAB does not obstruct primary host controls excessively.
- [ ] FAB exposes quick tour and major feature shortcuts.
- [ ] FAB size changes persist.

### E. Folder organization

- [ ] Create folder.
- [ ] Rename folder.
- [ ] Delete folder to trash.
- [ ] Restore folder from trash.
- [ ] Permanently delete folder.
- [ ] Assign current chat to folder.
- [ ] Unassign current chat.
- [ ] Folder assignment persists across reload.
- [ ] Folder data syncs across tabs/sites.

### F. Smart queue

- [ ] While generating, submit attempts are intercepted and queued.
- [ ] Queued messages are visible in the queue inspector.
- [ ] Messages send in FIFO order after generation ends.
- [ ] Queue can remove one item.
- [ ] Queue can clear all.
- [ ] No accidental duplicate sends occur.

### G. Prompt library

- [ ] Create prompt.
- [ ] Edit prompt.
- [ ] Delete prompt.
- [ ] Search prompt library.
- [ ] Tags display correctly.
- [ ] Variable placeholders are extracted correctly.
- [ ] Variable form renders only needed inputs.
- [ ] Compiled prompt inserts into active site composer.
- [ ] Prompt library works on both ChatGPT and Gemini.

### H. Prompt optimizer

- [ ] Deterministic local optimize path works.
- [ ] Same-tab AI refine path works.
- [ ] Hidden-tab AI refine path works.
- [ ] Hidden-tab worker is cleaned up safely.
- [ ] Optimized result can replace or insert into composer.
- [ ] Failure states are surfaced clearly.

### I. Semantic clipboard

- [ ] Ingest text locally.
- [ ] Chunk count displays.
- [ ] Query returns ranked results.
- [ ] Generated preamble displays.
- [ ] Generated preamble inserts into composer.
- [ ] Empty-state messaging appears when nothing is ingested.

### J. Export

- [ ] Current conversation is parsed correctly on ChatGPT.
- [ ] Current conversation is parsed correctly on Gemini.
- [ ] Adjacent duplicate dedupe behaves correctly.
- [ ] PDF export downloads.
- [ ] DOCX export downloads.
- [ ] Export status feedback shows loading/success/error.

### K. Token and model overlay

- [ ] Main-world bridge injects without CSP failure.
- [ ] Intercepted data reaches the content UI.
- [ ] Model name displays when available.
- [ ] Token estimate displays when available.
- [ ] Compact overlay mode reduces obstruction.
- [ ] Graceful fallback appears when metadata is unavailable.

### L. Code canvas

- [ ] Runnable code bundle detection works for eligible messages.
- [ ] Code canvas opens.
- [ ] Iframe is sandboxed.
- [ ] Runtime errors are visible rather than silent.
- [ ] Canvas closes cleanly.

### M. HUD settings and window management

- [ ] Windows drag.
- [ ] Windows resize.
- [ ] Windows collapse.
- [ ] Windows pin.
- [ ] Accent hue updates persist.
- [ ] Transparency updates persist.
- [ ] Reset defaults works.
- [ ] Recover off-screen windows works.

### N. Accessibility and readability

- [ ] Keyboard focus is visible.
- [ ] Icon-only buttons have labels.
- [ ] Glass surfaces remain readable.
- [ ] Reduced-motion preference is respected where applicable.
- [ ] Status is not color-only.

### O. Hardening

- [ ] No runtime external network dependencies are introduced.
- [ ] No CDN usage exists.
- [ ] No remote fonts exist.
- [ ] No dynamic-eval style code exists.
- [ ] Brave Shields aggressive mode still allows normal operation.

## 3. Recommended manual test route

1. Load the extension in Brave.
2. Open ChatGPT.
3. Confirm branding/welcome.
4. Run quick tour.
5. Create folder and assign current chat.
6. Create prompt with variables and insert it.
7. Start a response and queue follow-up prompts.
8. Run optimizer local mode.
9. Run optimizer hidden-tab mode.
10. Ingest semantic clipboard text and inject preamble.
11. Export PDF and DOCX.
12. Confirm token/model overlay.
13. Open Gemini and confirm the same state/features exist.
14. Change settings in popup and confirm in-page HUD updates.
15. Move and recover windows.

## 4. Completion rule

Do not call the project done until the table above is functionally true and the checklist is fully green.
