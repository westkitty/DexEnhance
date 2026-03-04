export const API_BRIDGE_MESSAGE_TYPE = 'DEXENHANCE_API_INTERCEPT';

const BRIDGE_SCRIPT_ID = 'dexenhance-api-bridge';
const BRIDGE_SCRIPT_PATH = 'injected/api-bridge-main.js';

/**
 * Inject the main-world interceptor script via extension URL source.
 * This avoids inline-script CSP violations on host pages.
 */
export function injectApiBridge() {
  const target = document.head || document.documentElement;
  if (!target) return false;
  if (document.getElementById(BRIDGE_SCRIPT_ID)) return true;

  const script = document.createElement('script');
  script.id = BRIDGE_SCRIPT_ID;
  script.type = 'text/javascript';
  script.src = chrome.runtime.getURL(BRIDGE_SCRIPT_PATH);
  script.async = false;
  script.onload = () => script.remove();
  script.onerror = () => {
    console.warn('[DexEnhance] Failed to inject API bridge script.');
  };
  target.appendChild(script);
  return true;
}

/**
 * Subscribe to intercepted API metadata payloads.
 * @param {(payload: {source:string,url:string,model?:string|null,tokens?:number|null,status?:number,at?:number}) => void} callback
 */
export function subscribeToApiBridge(callback) {
  const listener = (event) => {
    if (event.source !== window) return;
    if (event.data?.type !== API_BRIDGE_MESSAGE_TYPE) return;
    callback(event.data.payload || {});
  };
  window.addEventListener('message', listener);
  return () => window.removeEventListener('message', listener);
}
