import { h } from 'preact';
import { useMemo, useState } from 'preact/hooks';
import { WindowFrame } from './WindowFrame.jsx';

const DEFAULT_STEPS = [
  { id: 'welcome', title: 'Welcome', body: 'DexEnhance starts with the logo-first welcome and a launcher that stays recoverable.' },
  { id: 'prompts', title: 'Prompts', body: 'Prompt Library includes visible variable substitution, resolved preview, insert, queue, and send.' },
  { id: 'queue', title: 'Queue', body: 'Queue stays visible with pending count, active state, remove, clear, and FIFO flow.' },
  { id: 'context', title: 'Context', body: 'Semantic Clipboard ingests local context, ranks chunks, and inserts a generated preamble.' },
  { id: 'export', title: 'Export', body: 'Export keeps branded deterministic filenames for PDF and DOCX.' },
  { id: 'settings', title: 'Settings', body: 'HUD controls let you tune hue, transparency, FAB behavior, token overlay mode, and recovery actions.' },
];

export function FeatureTour({
  visible,
  panelState,
  collapsed = false,
  pinned = false,
  onPanelStateCommit,
  onToggleCollapse,
  onTogglePin,
  onClose,
  onComplete,
  onOpenView,
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const step = useMemo(() => DEFAULT_STEPS[Math.max(0, Math.min(stepIndex, DEFAULT_STEPS.length - 1))], [stepIndex]);

  if (!visible) return null;

  return h(WindowFrame, {
    visible,
    panelId: 'tour',
    title: 'Quick Tour',
    subtitle: `Step ${stepIndex + 1} of ${DEFAULT_STEPS.length}`,
    panelState,
    collapsed,
    pinned,
    onPanelStateCommit,
    onToggleCollapse,
    onTogglePin,
    onClose,
  }, h('div', { class: 'dex-tour' }, [
    h('div', { class: 'dex-tour__progress', 'aria-label': 'Tour progress' },
      DEFAULT_STEPS.map((item, index) => h('span', {
        key: item.id,
        class: `dex-tour__dot${index === stepIndex ? ' is-active' : ''}`,
      }))
    ),
    h('article', { class: 'dex-status-card dex-status-card--neutral' }, [
      h('strong', null, step.title),
      h('p', { class: 'dex-prompt-card__body' }, step.body),
    ]),
    h('div', { class: 'dex-folder-actions' }, [
      h('button', { type: 'button', class: 'dex-link-btn', onClick: () => setStepIndex((current) => Math.max(0, current - 1)), disabled: stepIndex === 0 }, 'Back'),
      step.id !== 'welcome'
        ? h('button', { type: 'button', class: 'dex-link-btn', onClick: () => onOpenView?.(step.id === 'context' ? 'context' : step.id === 'prompts' ? 'prompts' : step.id) }, 'Open Feature')
        : null,
      stepIndex === DEFAULT_STEPS.length - 1
        ? h('button', { type: 'button', class: 'dex-link-btn dex-link-btn--accent', onClick: () => onComplete?.() }, 'Finish Tour')
        : h('button', { type: 'button', class: 'dex-link-btn dex-link-btn--accent', onClick: () => setStepIndex((current) => Math.min(DEFAULT_STEPS.length - 1, current + 1)) }, 'Next'),
    ]),
  ]));
}
