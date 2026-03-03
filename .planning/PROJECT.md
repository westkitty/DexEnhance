# DexEnhance — Project Context

## What This Is

DexEnhance is a Manifest V3 Brave Browser extension that augments ChatGPT (`chatgpt.com`) and Google Gemini (`gemini.google.com`) with cross-site productivity tooling. It adds folder-based chat organization, a smart FIFO message queue, a shared prompt library, and universal conversation export — all operating entirely locally with no external dependencies, fully compatible with Brave Shields.

## Core Value

A single extension that makes both ChatGPT and Gemini dramatically more productive by adding organization, workflow automation, and data portability that neither platform offers natively — with zero compromise on privacy.

## Requirements

### Validated (confirmed working in production)
_None yet — greenfield project._

### Active (in scope for v1)
See `.planning/REQUIREMENTS.md` for full list. Key areas:
- Infrastructure & Build (INFRA-01–05)
- Service Worker & Messaging (CORE-01–04)
- DOM Adapter Layer (ADAPT-01–05)
- Shadow DOM UI Framework (UI-01–05)
- Feature Implementations (FEAT-01–13)
- API Interception (API-01–03)

### Out of Scope for v1
- External server, API, or user authentication
- Firefox or Safari support
- Mobile browser support
- Chrome Web Store submission
- Prompt import/export (JSON)
- Conversation search across cached chats
- Keyboard shortcut customization
- Multi-model A/B prompt testing

## Context

Both ChatGPT and Gemini operate on separate domains, making cross-site state sharing impossible via standard localStorage. Brave's Shields aggressively block third-party requests, CDN resources, and tracking vectors. The extension must be entirely self-contained: bundled assets, service-worker-mediated state, and runtime injection only from within the extension package.

The user's primary development environment is macOS Apple Silicon (M1+). Bun/Vite is the preferred build toolchain for ARM64 performance.

## Constraints

| Constraint | Detail |
|---|---|
| Extension API | Manifest V3 only — no deprecated MV2 APIs |
| External resources | Zero CDN / remote assets — everything bundled at build time |
| Brave Shields | No cross-origin fetch for assets, no remote fonts, no fingerprinting vectors |
| User data | All data local via `chrome.storage.local` — no accounts, no sync servers |
| Build tooling | Vite on macOS Apple Silicon (arm64); Bun preferred as package manager |
| Language | JavaScript (ES modules); Preact for UI components |
| Distribution | Private sharing via zip/crx — no Web Store submission for v1 |

## Key Decisions

| Decision | Choice | Reason | Phase |
|---|---|---|---|
| Extension API | Manifest V3 | Required for Brave; future-proof | 1 |
| Build tool | Vite | Fast ARM64; handles MV3 multi-entry output | 1 |
| Package manager | Bun | Fastest on Apple Silicon | 1 |
| UI framework | Preact + Shadow DOM | Lightweight (~3KB); CSS isolation from host pages | 4 |
| State store | `chrome.storage.local` via service worker | Cross-domain; persistent; no Brave Shield issues | 2 |
| API interception | Inline script (main-world) → postMessage | Only MV3-safe way to intercept fetch/XHR response bodies | 9 |
| DOM abstraction | Adapter pattern (ChatInterface) | Insulates all feature code from brittle per-site selectors | 3 |
| UI isolation | Shadow DOM #shadow-root | Prevents host page CSS leaking into injected components | 4 |
| Blob generation | Content script context | Avoids extension API permission issues with downloads | 8 |

---
_Last updated: 2026-03-03 | Phase: 0 (Pre-execution)_
