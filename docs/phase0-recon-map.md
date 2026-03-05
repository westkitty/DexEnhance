# DexEnhance Phase 0 Recon Map (2026-03-05)

## Runtime Topology
- `src/content/chatgpt/index.js`: ChatGPT content entrypoint; mounts all injected UI via Shadow DOM; wires queue, optimizer, export, token bridge, onboarding, and feature settings.
- `src/content/gemini/index.js`: Gemini entrypoint with equivalent architecture and host-specific labels.
- `src/ui/shadow-renderer.js`: Creates open Shadow DOM (`mode: 'open'`) host, injects scoped theme CSS, and watches host-page theme classes.
- `src/background/service_worker.js`: MV3 background service worker; centralized storage/message protocol, folder/prompt CRUD, feature settings, hidden-tab optimizer, semantic clipboard runtime, canvas session lifecycle.
- `src/lib/message-protocol.js`: Shared action constants + runtime message wrapper (`sendRuntimeMessage`).

## Current Surfaces / Entrypoints
- In-page surfaces mounted by content scripts:
  - `WelcomeHandoffModal` (first-run welcome)
  - `FAB` (floating action button)
  - `QuickHubPanel` (action launcher)
  - `Sidebar` (current richest panel and best Home candidate)
  - `PromptLibrary`
  - `PromptOptimizerModal`
  - `ExportDialog`
  - `FeatureTourModal` (linear tour)
  - `HUDSettingsPanel`
  - `TokenOverlay`
- Additional surface:
  - `src/popup/index.html` + `src/popup/index.js` popup UI with tour + settings modal flows.
- Brand affordance:
  - `src/ui/components/BrandBadge.jsx` exists but is currently not mounted from host entrypoints.

## Queue Implementation
- Queue core:
  - `src/content/shared/queue.js` (`createQueue`) currently FIFO in-memory only.
- Queue interception/dispatch:
  - `src/content/shared/queue-controller.js` intercepts Enter/click while generating, enqueues text, flushes after generation ends.
- Queue visibility:
  - `Sidebar` receives queue count only (`queueSize`), no queue detail panel yet.

## Onboarding / Tour Implementation
- In-page tour:
  - `src/ui/components/FeatureTourModal.jsx` with linear stepper and global `window.addEventListener('keydown')` for ArrowLeft/ArrowRight/Escape.
- Welcome CTA:
  - `WelcomeHandoffModal` drives first-run to quick-tour prompt state in host content scripts.
- Popup tour:
  - `src/popup/index.js` opens popup tour modal and uses global `document.addEventListener('keydown')` escape close behavior.

## Keyboard Routing Findings
- Global key handlers found:
  - `src/ui/components/FeatureTourModal.jsx`: global `window` keydown for arrows/escape.
  - `src/popup/index.js`: global `document` keydown for escape.
- Scoped handlers found:
  - `queue-controller.js` keydown listener on active composer textarea (capture phase).
  - Local element `onKeyDown` handlers in `PanelFrame` collapsed toggle and `FolderTree` inline forms.

## Notification / Dialog Patterns (Current)
- Notification status:
  - No global toast system. Errors are currently split between inline component errors and console warn/error logs.
- Dialog status:
  - `WelcomeHandoffModal` uses `role="dialog"` but no strict modal/focus trap implementation.
  - `PanelFrame` acts as movable window shell, not an accessible modal dialog primitive.
  - Popup modals are DOM/CSS overlays without shared a11y dialog primitive.

## Shadow DOM + Styling
- Shadow root is `open` mode via `host.attachShadow({ mode: 'open' })`.
- Theme CSS is injected into shadow root from `src/ui/styles/theme.css`.
- Current watermark variable exists (`--dex-watermark-opacity`) but defaults to `0.14`; requirement target is `~0.30` for Home watermark prominence.

## Architectural Risks to Resolve in Refactor
- Host entry duplication between ChatGPT and Gemini content scripts is high; refactor changes must stay mirrored.
- Queue lacks item metadata, pause/resume, reorder, and failure telemetry.
- No global in-UI failure surface for runtime/storage/adapter failures.
- Tour introduces global key interception and coercive flow contrary to new constraints.
