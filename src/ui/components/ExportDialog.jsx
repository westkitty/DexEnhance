import { h } from 'preact';
import { useState } from 'preact/hooks';
import { ContextualHint } from './ContextualHint.jsx';
import { buildDiagnostics, showDexToast } from '../runtime/dex-toast-controller.js';

export function ExportDialog({ visible, onExport }) {
  const [format, setFormat] = useState('pdf');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('empty');

  async function handleExport() {
    setBusy(true);
    setError('');
    setStatus('loading');
    try {
      await onExport?.(format);
      setStatus('success');
      showDexToast({
        type: 'success',
        title: 'Export complete',
        message: `Conversation exported as ${format.toUpperCase()}.`,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus('error');
      showDexToast({
        type: 'error',
        title: 'Export failed',
        message: err instanceof Error ? err.message : String(err),
        diagnostics: buildDiagnostics({
          module: 'ui/ExportDialog',
          operation: 'conversation_export',
          host: window.location.hostname,
          url: window.location.href,
          error: err,
        }),
      });
    } finally {
      setBusy(false);
    }
  }

  if (!visible) return null;

  return h('section', { class: 'dex-drawer-view dex-form', 'aria-label': 'Export conversation' }, [
    h(ContextualHint, {
      hintId: 'export-module',
      visible: true,
      title: 'Export hint',
      message: 'PDF is best for fixed snapshots. DOCX is best when you plan to annotate or edit later.',
    }),
    h('p', { class: 'dex-form__desc' }, 'Export the active conversation for docs, sharing, or decision logs.'),
    h('div', { class: `dex-state-panel dex-state-panel--${status}` }, [
      h('strong', null, 'Export state'),
      h('p', { class: 'dex-folder-state' },
        status === 'loading'
          ? 'Loading export…'
          : status === 'success'
            ? `Success: ${format.toUpperCase()} download started.`
            : status === 'error'
              ? 'Error: export failed.'
              : 'Empty state: choose a format and export the current conversation.'
      ),
    ]),
    h('label', { class: 'dex-sidebar__label' }, 'Format'),
    h('select', {
      class: 'dex-input',
      value: format,
      onChange: (event) => setFormat(event.currentTarget.value),
    }, [
      h('option', { value: 'pdf' }, 'PDF'),
      h('option', { value: 'docx' }, 'DOCX'),
    ]),
    error ? h('div', { class: 'dex-form__error' }, error) : null,
    h('p', { class: 'dex-form__hint' },
      format === 'pdf'
        ? 'PDF is ideal for sharing snapshots and read-only archives.'
        : 'DOCX is ideal for editing and adding notes with teammates.'
    ),
    h('button', {
      type: 'button',
      class: 'dex-link-btn dex-link-btn--accent',
      disabled: busy,
      onClick: handleExport,
    }, busy ? 'Exporting…' : 'Export'),
  ]);
}
