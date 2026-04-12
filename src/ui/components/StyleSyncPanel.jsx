import { h } from 'preact';
import { useState } from 'preact/hooks';
import { MESSAGE_ACTIONS, sendRuntimeMessage } from '../../lib/message-protocol.js';

const STYLE_PRESETS = [
  { 
    id: 'gaia-glass', 
    label: 'Gaia Glass', 
    description: 'Deep translucent surface with subtle blur.',
    css: 'background: rgba(23, 33, 46, 0.72);\nbackdrop-filter: blur(12px) saturate(180%);\nborder: 1px solid rgba(255, 255, 255, 0.08);\nbox-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);',
    tailwind: 'bg-slate-900/70 backdrop-blur-xl border border-white/10 shadow-2xl'
  },
  { 
    id: 'deep-space', 
    label: 'Deep Space', 
    description: 'Bioluminescent gradient for planetary UIs.',
    css: 'background: radial-gradient(circle at top left, #1a2a6c, #b21f1f, #fdbb2d);\n-webkit-background-clip: padding-box;\nbackground-clip: padding-box;',
    tailwind: 'bg-gradient-to-br from-blue-900 via-red-900 to-yellow-600'
  },
  { 
    id: 'soft-neon', 
    label: 'Soft Neon', 
    description: 'Glow effect for primary actions.',
    css: 'box-shadow: 0 0 20px rgba(124, 194, 255, 0.4);\nborder-color: var(--dex-accent);\nbackground: var(--dex-surface-contrast);',
    tailwind: 'shadow-[0_0_20px_rgba(124,194,255,0.4)] border-blue-400 bg-slate-800'
  }
];

export function StyleSyncPanel({ visible }) {
  const [request, setRequest] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  if (!visible) return null;

  async function handleGenerate() {
    if (!request.trim()) return;
    setLoading(true);
    setError('');
    try {
      // We use the hidden-tab optimizer to generate "pure CSS/Tailwind" without conversational fluff
      const prompt = `Generate modern CSS and Tailwind classes for this design request: "${request}". 
      Return JSON format: { "css": "...", "tailwind": "..." }. 
      Style goals: high-fidelity, premium, beautiful.`;
      
      const response = await sendRuntimeMessage(MESSAGE_ACTIONS.OPTIMIZER_REFINE_HIDDEN_TAB, {
        site: 'chatgpt', // Default to chatgpt for style generation
        prompt
      });

      if (!response.ok) throw new Error(response.error);
      
      // Try to parse JSON from the response
      const text = response.data?.refinedPrompt || '';
      
      // Attempt robust JSON extraction
      let parsed = null;
      try {
        // Strip markdown code blocks if present
        const cleanText = text.replace(/```json|```/g, '').trim();
        const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.warn('[DexEnhance] Failed to parse StyleSync JSON, falling back to heuristic extraction.');
      }

      if (parsed && (parsed.css || parsed.tailwind)) {
        setResult(parsed);
      } else {
        // Heuristic fallback: if we can't parse JSON, try to find lines that look like CSS or tailwind
        const cssLines = text.match(/background:.*|border:.*|box-shadow:.*/g);
        setResult({ 
          css: cssLines ? cssLines.join('\n') : text, 
          tailwind: 'Custom Style' 
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed.');
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(text) {
    void navigator.clipboard.writeText(text);
    // In a real app we'd show a toast here, but for brevity we'll just log
    console.log('[DexEnhance] Copied to clipboard');
  }

  return h('section', { class: 'dex-drawer-view dex-form', 'aria-label': 'StyleSync Generator' }, [
    h('div', { class: 'dex-status-card dex-status-card--neutral' }, [
      h('strong', null, 'Tailwind Style-Sync'),
      h('p', { class: 'dex-folder-state' }, 'Generate high-fidelity CSS and utility classes for your React components.'),
    ]),

    h('label', { class: 'dex-sidebar__label' }, 'Design Request'),
    h('textarea', {
      class: 'dex-textarea',
      style: { minHeight: '80px' },
      placeholder: 'e.g. "Create a glassmorphic sidebar with deep blue accents"',
      value: request,
      onInput: (e) => setRequest(e.currentTarget.value)
    }),

    h('div', { class: 'dex-folder-actions' }, [
      h('button', {
        type: 'button',
        class: 'dex-link-btn dex-link-btn--accent',
        disabled: loading || !request.trim(),
        onClick: handleGenerate
      }, loading ? 'Imagining…' : 'Generate Styles'),
    ]),

    error && h('p', { class: 'dex-folder-state error' }, error),

    result && h('div', { class: 'dex-drawer-stack', style: { marginTop: '16px' } }, [
      h('div', { class: 'dex-status-card dex-status-card--success' }, [
        h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' } }, [
          h('strong', null, 'Generated CSS'),
          h('button', { class: 'dex-link-btn', style: { minHeight: '30px', padding: '4px 8px' }, onClick: () => copyToClipboard(result.css) }, 'Copy'),
        ]),
        h('pre', { class: 'dex-toast__details', style: { fontSize: '12px' } }, result.css),
        
        h('hr', { style: { margin: '12px 0', border: '0', borderTop: '1px solid var(--dex-border)' } }),

        h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' } }, [
          h('strong', null, 'Tailwind Classes'),
          h('button', { class: 'dex-link-btn', style: { minHeight: '30px', padding: '4px 8px' }, onClick: () => copyToClipboard(result.tailwind) }, 'Copy'),
        ]),
        h('code', { style: { fontSize: '13px', color: 'var(--dex-accent)' } }, result.tailwind),
      ]),
    ]),

    h('label', { class: 'dex-sidebar__label', style: { marginTop: '20px' } }, 'Design Presets'),
    h('div', { class: 'dex-drawer-stack' }, 
      STYLE_PRESETS.map(preset => h('article', { 
        key: preset.id, 
        class: 'dex-status-card dex-status-card--neutral',
        style: { cursor: 'pointer' },
        onClick: () => setResult(preset)
      }, [
        h('div', { style: { display: 'flex', justifyContent: 'space-between' } }, [
          h('strong', null, preset.label),
          h('span', { class: 'dex-folder-state', style: { fontSize: '10px' } }, 'Preset'),
        ]),
        h('p', { class: 'dex-prompt-card__body', style: { fontSize: '12px' } }, preset.description)
      ]))
    )
  ]);
}
