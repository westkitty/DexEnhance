import { GeminiAdapter } from './adapter.js';
import { initHostShell } from '../shared/init-host-shell.js';

void initHostShell({
  siteKey: 'gemini',
  siteLabel: 'Gemini',
  AdapterClass: GeminiAdapter,
});
