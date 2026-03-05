# DexEnhance Verification Checklist

## Manual Verification Matrix

### ChatGPT Host (`https://chatgpt.com/*`)
- Open DexEnhance Home from FAB and confirm Home header logo is prominent.
- Confirm watermark appears behind Home menus at ~30% opacity and does not block interaction.
- Open Prompt Library, Prompt Optimizer, Export, Settings, Queue Manager, and Status from Home.
- Queue workflow:
  - Queue at least 3 prompts while host is generating.
  - View per-item metadata (type/origin/target/timestamp/status).
  - Edit a queued item and verify text persists.
  - Reorder items using Up/Down.
  - Pause and Resume queue processing.
  - Use Send now for a specific item.
  - Remove one item and undo via toast.
  - Clear all and undo via toast.
- Failure paths:
  - Disable network or force message timeout and verify DexToast appears with actionable message.
  - Trigger queue send timeout (missing host selector state) and verify Retry + Details + Copy diagnostics is available.
  - Force storage failure path (if available in dev tooling) and verify rollback toast appears.
- Destructive actions:
  - Permanently delete a folder and confirm DexDialog explicit irreversible copy.
- Status panel:
  - Verify host label, adapter selector health, service worker ping/failure timestamps, queue state, and token refresh metadata.
  - Use Copy diagnostics and verify clipboard JSON payload.
  - Use Re-inject UI and Reload adapter actions.

### Gemini Host (`https://gemini.google.com/*`)
- Repeat the full ChatGPT matrix above.
- Confirm adapter health reflects Gemini selectors correctly.
- Confirm Home launch via popup "Open Home" button opens Sidebar Home in active Gemini tab.

## Popup Verification
- Open popup and verify:
  - Status snapshot line shows enabled/host/version.
  - Open Home button launches Home in active supported tab.
  - Settings modal opens and persists accent hue + feature toggles.
  - Escape closes settings modal.

## Accessibility Verification
- Keyboard-only navigation:
  - Tab through Home controls and all major panels.
  - Verify visible focus indicator on interactive elements.
- Dialog behavior:
  - Open DexDialog-based confirmations and verify focus is trapped.
  - Press Escape and verify close behavior when allowed.
  - Verify focus returns to invoking control after dialog closes.
- Toast announcements:
  - With screen reader active, verify non-error toasts announce via polite live region.
  - Verify error toasts announce via assertive live region.
- Watermark accessibility:
  - In Settings, reduce watermark opacity to 0 for high-contrast usage.
  - Verify readability remains acceptable at default and reduced watermark states.
