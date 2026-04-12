import { h } from 'preact';

/**
 * PersonaAvatar Component
 * Renders an animated SVG character for model personification.
 * 
 * @param {string} model - 'gemini', 'chatgpt', or 'dex'
 * @param {boolean} isGenerating - whether the AI is active
 * @param {string} emotion - 'happy', 'neutral', 'analytical', 'error'
 * @param {string} size - 'small', 'medium', 'large'
 */
export function PersonaAvatar({ 
  model = 'dex', 
  isGenerating = false, 
  emotion = 'neutral',
  size = 'medium' 
}) {
  const stateClass = isGenerating ? 'is-thinking' : `is-${emotion}`;
  const modelClass = `dex-avatar--${model}`;
  
  return h('div', { 
    class: `dex-avatar ${modelClass} ${stateClass} dex-avatar--${size}`,
    'aria-hidden': 'true'
  }, [
    model === 'gemini' && h('svg', { viewBox: '0 0 100 100', class: 'dex-avatar__svg' }, [
      h('defs', null, [
        h('linearGradient', { id: 'gemini-grad', x1: '0%', y1: '0%', x2: '100%', y2: '100%' }, [
          h('stop', { offset: '0%', 'stop-color': '#4e8cff' }),
          h('stop', { offset: '100%', 'stop-color': '#9b59ff' }),
        ])
      ]),
      h('path', { 
        class: 'dex-avatar__core',
        d: 'M50 10 L60 40 L90 50 L60 60 L50 90 L40 60 L10 50 L40 40 Z',
        fill: 'url(#gemini-grad)'
      }),
      h('circle', { class: 'dex-avatar__eye-l', cx: '42', cy: '48', r: '3', fill: 'white' }),
      h('circle', { class: 'dex-avatar__eye-r', cx: '58', cy: '48', r: '3', fill: 'white' }),
    ]),

    model === 'chatgpt' && h('svg', { viewBox: '0 0 100 100', class: 'dex-avatar__svg' }, [
      h('circle', { class: 'dex-avatar__bg', cx: '50', cy: '50', r: '45', fill: '#10a37f', opacity: '0.1' }),
      h('circle', { class: 'dex-avatar__core', cx: '50', cy: '50', r: '20', fill: '#10a37f' }),
      h('g', { class: 'dex-avatar__rings' }, [
        h('circle', { cx: '50', cy: '50', r: '30', fill: 'none', stroke: '#10a37f', 'stroke-width': '2' }),
        h('circle', { cx: '50', cy: '50', r: '38', fill: 'none', stroke: '#10a37f', 'stroke-width': '1', 'stroke-dasharray': '5,5' }),
      ]),
      h('circle', { class: 'dex-avatar__eye-l', cx: '45', cy: '50', r: '2', fill: 'white' }),
      h('circle', { class: 'dex-avatar__eye-r', cx: '55', cy: '50', r: '2', fill: 'white' }),
    ]),

    model === 'dex' && h('svg', { viewBox: '0 0 100 100', class: 'dex-avatar__svg' }, [
      h('rect', { class: 'dex-avatar__core', x: '25', y: '30', width: '50', height: '40', rx: '10', fill: '#333' }),
      h('rect', { class: 'dex-avatar__mouth', x: '40', y: '58', width: '20', height: '4', rx: '2', fill: '#666' }),
      h('circle', { class: 'dex-avatar__eye-l', cx: '40', cy: '45', r: '4', fill: '#00ffcc' }),
      h('circle', { class: 'dex-avatar__eye-r', cx: '60', cy: '45', r: '4', fill: '#00ffcc' }),
      h('path', { d: 'M50 30 L50 20 L55 15', stroke: '#666', 'stroke-width': '3', fill: 'none' }),
    ])
  ]);
}
