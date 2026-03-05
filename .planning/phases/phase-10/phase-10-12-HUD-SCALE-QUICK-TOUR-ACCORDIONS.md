# Phase 10-12 — HUD Scale Tuning, Quick Tour CTA, and Accordion De-Clutter

Date: 2026-03-05

## Objective

Address post-hardening UI fit/usability issues by:
- ensuring panel drag/resize interactions are reliably usable,
- reducing oversized defaults and control density,
- replacing auto welcome/tour behavior with an explicit first-run CTA beside Quick Action,
- reducing HUD clutter via accordion grouping while preserving all existing controls/features.

## Scope Implemented

1. Onboarding/tour entrypoint rework
- Removed in-page automatic welcome modal flow from ChatGPT/Gemini content entrypoints.
- Added first-run `Start Quick Tour` CTA adjacent to the FAB/Quick Action button.
- CTA visibility now keyed by `tourSeenVersion` and `onboardingSeenVersion`.
- Added explicit `Start Quick Tour` action in `Window Management` settings panel.
- Preserved existing tour access via Quick Hub (`Feature Tour`) and sidebar request paths.

2. Panel/window scale tuning
- Reduced default/min sizes across HUD windows in `ui-settings` defaults/clamps.
- Reduced global control sizing (`dex-link-btn`) and FAB default range.
- Tuned panel-level min sizes in Prompt Library, Optimizer, Export, Hub, Tour, and Settings components.

3. Drag/resize affordance hardening
- Improved panel-header drag behavior with stronger pointer propagation handling.
- Expanded resize handle hit area and visual affordance for easier grab/resize.
- Added touch-action constraints on drag/resize handles.

4. HUD de-clutter via accordions
- Quick Hub groups (`AI Tools`, `Panels`, `Utilities`) now collapsible accordion sections.
- HUD Settings sections now collapsible accordion sections:
  - Accent color
  - Structural base color
  - Glass overlay color
  - Window visibility/transparency
  - Quick Action controls
  - Reset controls

5. Popup tour behavior
- Disabled popup immediate tour auto-open.
- Popup tour remains user-triggered via existing button.

## Files Updated

- `src/lib/ui-settings.js`
- `src/ui/components/FAB.jsx`
- `src/ui/components/PanelFrame.jsx`
- `src/ui/components/QuickHubPanel.jsx`
- `src/ui/components/HUDSettingsPanel.jsx`
- `src/ui/components/FeatureTourModal.jsx`
- `src/ui/components/PromptLibrary.jsx`
- `src/ui/components/PromptOptimizerModal.jsx`
- `src/ui/components/ExportDialog.jsx`
- `src/ui/styles/theme.css`
- `src/content/chatgpt/index.js`
- `src/content/gemini/index.js`
- `src/popup/index.js`
- `BIBLE.md`

## Verification

Executed:
- `bun run build`
- feature checksum sweep across core surfaces/actions (28 checks)

Result:
- Build passed for all bundles (background, chatgpt, gemini, popup).
- Feature checksum: 28/28 checks reported `OK` (no missing features detected).

