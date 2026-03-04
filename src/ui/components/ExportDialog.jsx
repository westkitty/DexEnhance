import { h } from 'preact';
import { useState } from 'preact/hooks';

export function ExportDialog({ visible, onClose, onExport, iconUrl = '' }) {
  const [format, setFormat] = useState('pdf');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleExport() {
    setBusy(true);
    setError('');
    try {
      await onExport?.(format);
      onClose?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  if (!visible) return null;

  return h('div', { class: 'dex-modal-overlay' }, [
    h('section', {
      class: 'dex-modal',
      'aria-label': 'Export Conversation',
      style: iconUrl ? `--dex-watermark-url:url("${iconUrl}")` : undefined,
    }, [
      h('header', { class: 'dex-modal__header' }, [
        h('div', { class: 'dex-modal__brand' }, [
          iconUrl
            ? h('img', {
                src: iconUrl,
                alt: 'DexEnhance logo',
                class: 'dex-modal__logo',
              })
            : null,
          h('h3', { class: 'dex-modal__title' }, 'Export Conversation'),
        ]),
        h('button', { type: 'button', class: 'dex-link-btn', onClick: () => onClose?.() }, 'Close'),
      ]),
      h('div', { class: 'dex-form' }, [
        h('p', { class: 'dex-folder-state' }, 'Export this conversation for docs, sharing, or decision logs.'),
        h('label', { class: 'dex-sidebar__label' }, 'Format'),
        h(
          'select',
          {
            class: 'dex-input',
            value: format,
            onChange: (e) => setFormat(e.currentTarget.value),
          },
          [
            h('option', { value: 'pdf' }, 'PDF'),
            h('option', { value: 'docx' }, 'DOCX'),
          ]
        ),
        error ? h('div', { class: 'dex-folder-state error' }, error) : null,
        h(
          'p',
          { class: 'dex-folder-state' },
          format === 'pdf'
            ? 'PDF is ideal for sharing snapshots and read-only archives.'
            : 'DOCX is ideal for editing and adding notes with teammates.'
        ),
        h('button', { type: 'button', class: 'dex-link-btn', disabled: busy, onClick: handleExport }, busy ? 'Exporting...' : 'Export'),
      ]),
    ]),
  ]);
}
