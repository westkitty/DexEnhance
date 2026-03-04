import themeCss from './styles/theme.css?inline';

/**
 * Detect host page light/dark mode.
 * @returns {'light'|'dark'}
 */
export function detectHostTheme() {
  const root = document.documentElement;
  const body = document.body;
  const classText = `${root?.className || ''} ${body?.className || ''}`.toLowerCase();
  const dataTheme = `${root?.getAttribute('data-theme') || ''} ${body?.getAttribute('data-theme') || ''}`.toLowerCase();
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches === true;

  if (classText.includes('dark') || dataTheme.includes('dark')) return 'dark';
  if (classText.includes('light') || dataTheme.includes('light')) return 'light';
  return prefersDark ? 'dark' : 'light';
}

/**
 * Create/reuse a Shadow DOM mount for DexEnhance UI.
 * @param {{site: string, id?: string}} options
 */
export function createShadowRenderer(options) {
  const site = options?.site || 'unknown';
  const hostId = options?.id || `dex-enhance-root-${site}`;
  const mountTarget = document.body || document.documentElement;
  if (!mountTarget) {
    throw new Error('No valid mount target for Shadow DOM renderer.');
  }

  let host = document.getElementById(hostId);
  if (!(host instanceof HTMLElement)) {
    host = document.createElement('div');
    host.id = hostId;
    host.setAttribute('data-dex-site', site);
    host.style.position = 'fixed';
    host.style.inset = '0';
    host.style.zIndex = '2147483600';
    host.style.pointerEvents = 'none';
    mountTarget.appendChild(host);
  }

  const shadowRoot = host.shadowRoot || host.attachShadow({ mode: 'open' });

  let themeStyle = shadowRoot.querySelector('style[data-dex-theme]');
  if (!(themeStyle instanceof HTMLStyleElement)) {
    themeStyle = document.createElement('style');
    themeStyle.setAttribute('data-dex-theme', 'true');
    themeStyle.textContent = themeCss;
    shadowRoot.appendChild(themeStyle);
  }

  let mountPoint = shadowRoot.getElementById('dex-app');
  if (!(mountPoint instanceof HTMLElement)) {
    mountPoint = document.createElement('div');
    mountPoint.id = 'dex-app';
    shadowRoot.appendChild(mountPoint);
  }

  const applyTheme = () => {
    host.setAttribute('data-theme', detectHostTheme());
  };
  applyTheme();

  const themeObserver = new MutationObserver(() => {
    applyTheme();
  });

  if (document.documentElement) {
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme'],
    });
  }
  if (document.body) {
    themeObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ['class', 'data-theme'],
    });
  }

  const mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)');
  const mediaHandler = () => applyTheme();
  mediaQuery?.addEventListener?.('change', mediaHandler);

  return {
    host,
    shadowRoot,
    mountPoint,
    destroy() {
      themeObserver.disconnect();
      mediaQuery?.removeEventListener?.('change', mediaHandler);
      host.remove();
    },
  };
}
