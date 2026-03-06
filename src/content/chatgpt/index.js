import { ChatGPTAdapter } from './adapter.js';
import { initHostShell } from '../shared/init-host-shell.js';

void initHostShell({
  siteKey: 'chatgpt',
  siteLabel: 'ChatGPT',
  AdapterClass: ChatGPTAdapter,
});
