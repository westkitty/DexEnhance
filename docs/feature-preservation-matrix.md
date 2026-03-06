# DexEnhance Feature Preservation Matrix (2026-03-06)

This matrix is the regression contract for the solid-state shell refactor. Every preserved feature must remain reachable, keyboard-usable, and verifiable after the UI migration.

| Feature | Current Entrypoint | Current Owner | Post-Refactor Entrypoint | Accessibility Requirement | Verification Method | Regression Risk |
|---|---|---|---|---|---|---|
| Welcome onboarding handoff | `WelcomeHandoffModal` | `src/ui/components/WelcomeHandoffModal.jsx`, host content scripts | Welcome modal -> corner launcher -> command palette | Dialog semantics, focusable CTA, Escape-safe close behavior | Manual host verification + interaction test | High |
| Persistent launcher | FAB | `src/ui/components/FAB.jsx` | `DexLauncher` corner anchor | Keyboard focus, Enter/Space activation, visible label | Manual host verification | High |
| Command navigation | Sidebar/FAB menu | `Sidebar.jsx`, `FAB.jsx` | `CommandPalette` | `Cmd/Ctrl+K`, arrow navigation, Enter execute, Escape close | Unit + manual host verification | High |
| Prompt library CRUD | Sidebar button -> floating panel | `PromptLibrary.jsx`, `service_worker.js` prompt handlers | Command palette -> drawer view | Search, form controls, inline validation, keyboard submit/cancel | Manual host verification | High |
| Prompt variable substitution | Prompt card -> overlay variable form | `PromptLibrary.jsx` | Inline accordion beneath active prompt | Keyboard reachability, labeled inputs, focus retention | Interaction test + manual | High |
| Folder tree organization | Sidebar body | `FolderTree.jsx`, `service_worker.js` folder handlers | Drawer prompt/folder workspace | Keyboard access to actions, inline edit forms, live error reporting | Manual host verification | High |
| Folder create/rename/trash/restore/delete | Folder row menus + dialog | `FolderTree.jsx`, `service_worker.js` | Inline controls + optimistic toasts | No mouse-only menus, Undo for reversible actions, explicit irreversible labeling | Manual host verification | High |
| Chat assign/unassign | Sidebar folder tree | `FolderTree.jsx` | Drawer folder workspace | Keyboard-operable buttons | Manual host verification | Medium |
| Queue capture while generating | Composer interception | `queue-controller.js` | Unchanged runtime, surfaced in drawer | No UI-only dependency | Unit + manual host verification | High |
| Queue management | Sidebar embedded queue panel | `QueueManager.jsx` | Drawer queue view | Keyboard actions, labeled status, inline error banner visibility | Interaction test + manual | High |
| Prompt optimizer | Sidebar/FAB -> floating modal | `PromptOptimizerModal.jsx` | Drawer optimizer view | Reachable controls, labeled textarea/select, keyboard actions | Manual host verification | Medium |
| AI refinement modes | Optimizer modal | `PromptOptimizerModal.jsx`, `service_worker.js` | Drawer optimizer view | Same as above | Manual host verification | Medium |
| Semantic Clipboard inject | Sidebar/FAB action | content scripts + semantic clipboard client | Command palette action | Keyboard invocable action + error toast readability | Manual host verification | Medium |
| Semantic Clipboard ingest | Background ingest timer | content scripts + semantic clipboard client | Unchanged runtime | No regression in host observation loop | Manual host verification | Medium |
| Pop-out canvas / live render | Sidebar action | popout controller + background | Command palette action | Keyboard invocable action | Manual host verification | Medium |
| Export PDF/DOCX | Sidebar/FAB -> floating dialog | `ExportDialog.jsx`, exporter | Drawer export view | Labeled select/button, keyboard export | Manual host verification | Medium |
| Token/model visibility | Floating token overlay | `TokenOverlay.jsx`, API bridge | Drawer status bar | Passive readable status, screen-reader text | Manual host verification | Medium |
| Adapter/worker diagnostics | Sidebar status panel | `StatusPanel.jsx`, content scripts | Drawer banner + status bar + palette commands | Buttons keyboard reachable, banner semantics, copy confirmation | Manual host verification | High |
| Re-inject UI / reload adapter | Sidebar status actions | `StatusPanel.jsx`, content scripts | Drawer status controls + palette commands | Keyboard buttons, non-blocking feedback | Manual host verification | Medium |
| Toast feedback + Undo | Global toast viewport | `dex-toast-controller.js`, `DexToastViewport.jsx` | Same viewport, broader Undo coverage | Live regions, keyboard-accessible actions, timed expiry | Unit + manual accessibility verification | High |
| Popup open-home | Popup button | `src/popup/index.js` | Same button -> launcher/palette path | Button keyboard reachable, status message readable | Popup e2e/manual | Medium |
| Popup settings | Popup settings modal | `src/popup/index.js`, `src/popup/index.html` | Popup solid-state settings panel | Keyboard dialog handling | Popup e2e/manual | Medium |
| Popup tour access | Popup affordance | popup UI/tour flow | Preserved popup access path | Keyboard reachable affordance | Popup e2e/manual | Low |
| Feature module toggles | Popup settings | `feature-settings.js`, popup | Same popup settings | Checkbox semantics, persistence feedback | Popup e2e/manual | Medium |
| Cross-site host parity | ChatGPT + Gemini content scripts | `src/content/chatgpt/index.js`, `src/content/gemini/index.js` | Mirrored shell implementation | Same keyboard and focus behavior on both hosts | Manual verification on both sites | High |
