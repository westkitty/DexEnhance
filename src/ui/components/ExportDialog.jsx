import { h } from 'preact';
import { useState } from 'preact/hooks';
import { PanelFrame } from './PanelFrame.jsx';

export function ExportDialog({
  visible,
  onClose,
  onExport,
  iconUrl = '',
  windowState,
  defaultWindowState,
  onWindowStateChange,
}) {
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

  return h(
    PanelFrame,
    {
      panelId: 'export',
      title: 'Export Conversation',
      iconUrl,
      panelState: windowState,
      defaultState: defaultWindowState,
      onPanelStateChange: onWindowStateChange,
      onClose,
      minWidth: 340,
      minHeight: 220,
      zIndex: 2147483647,
      showPin: true,
      showClose: true,
      allowResize: true,
    },
    [
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
    ]
  );
}
