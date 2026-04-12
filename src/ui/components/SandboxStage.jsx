import { h } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';

export function SandboxStage({
  visible,
  code,
  onCodeChange,
  tests,
  onTestsChange,
  onGenerateTests,
}) {
  const [isReady, setIsReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const iframeRef = useRef(null);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'SANDBOX_READY') {
        setIsReady(true);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (visible && isReady && code) {
      updateSandbox(code);
    }
  }, [visible, isReady, code]);

  function updateSandbox(newCode) {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ code: newCode }, '*');
    }
  }

  if (!visible) return null;

  return h('section', { class: 'dex-drawer-view dex-form', 'aria-label': 'Live Sandbox Stage' }, [
    h('div', { class: 'dex-status-card dex-status-card--neutral' }, [
      h('strong', null, 'Live Sandbox Stage'),
      h('p', { class: 'dex-folder-state' }, 'Real-time React/Preact rendering. Use HTM syntax.'),
    ]),

    h('div', { class: 'dex-panel-frame', style: { padding: '0', border: '1px solid var(--dex-border)', borderRadius: '8px', overflow: 'hidden', height: '300px', background: '#fff' } }, [
      h('iframe', {
        ref: iframeRef,
        src: chrome.runtime.getURL('sandbox/sandbox.html'),
        style: { width: '100%', height: '100%', border: 'none' },
        sandbox: 'allow-scripts allow-forms',
      }),
    ]),

    h('label', { class: 'dex-sidebar__label', style: { marginTop: '16px' } }, 'Code Content'),
    h('textarea', {
      class: 'dex-textarea',
      style: { minHeight: '150px', fontSize: '11px', fontFamily: 'monospace' },
      placeholder: '() => html`<div>...</div>`',
      value: code,
      onInput: (event) => onCodeChange?.(event.currentTarget.value),
    }),

    h('div', { class: 'dex-folder-actions', style: { marginTop: '8px' } }, [
      h('button', {
        type: 'button',
        class: 'dex-link-btn dex-link-btn--accent',
        onClick: () => updateSandbox(code),
      }, 'Refresh Render'),
      h('button', {
        type: 'button',
        class: 'dex-link-btn dex-link-btn--accent',
        onClick: async () => {
          if (!onGenerateTests) return;
          setLoading(true);
          try {
            const result = await onGenerateTests(code);
            onTestsChange?.(result || 'Failed to generate tests.');
          } finally {
            setLoading(false);
          }
        },
        disabled: loading,
      }, loading ? 'Generating...' : '🧪 Generate Tests'),
      h('button', {
        type: 'button',
        class: 'dex-link-btn',
        onClick: () => onCodeChange?.("() => html`<div style={{padding: '10px', background: '#f0f9ff', borderRadius: '4px'}}><h4>New Component</h4><button onClick={() => alert('Clicked!')}>Click Me</button></div>`"),
      }, 'Load Template'),
    ]),

    tests && h('div', { class: 'dex-drawer-stack', style: { marginTop: '16px' } }, [
      h('div', { class: 'dex-status-card dex-status-card--success' }, [
        h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' } }, [
          h('strong', null, 'Unit Tests (Bun Test)'),
          h('button', { 
            class: 'dex-link-btn', 
            style: { minHeight: '30px', padding: '4px 8px' }, 
            onClick: () => {
              void navigator.clipboard.writeText(tests);
              console.log('[DexEnhance] Tests copied to clipboard');
            }
          }, 'Copy'),
        ]),
        h('pre', { class: 'dex-toast__details', style: { fontSize: '11px', maxHeight: '200px', overflowY: 'auto' } }, tests),
      ]),
    ]),
  ]);
}
