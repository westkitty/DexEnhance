import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { MESSAGE_ACTIONS, sendRuntimeMessage } from '../../lib/message-protocol.js';

export function CheckpointManager({ 
  visible,
  currentUrl,
  onRestore,
}) {
  const [checkpoints, setCheckpoints] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && currentUrl) {
      void refreshCheckpoints();
    }
  }, [visible, currentUrl]);

  async function refreshCheckpoints() {
    setLoading(true);
    try {
      const response = await sendRuntimeMessage(MESSAGE_ACTIONS.CONVERSATION_LIST_CHECKPOINTS, { url: currentUrl });
      if (response.ok) {
        setCheckpoints(Array.isArray(response.data) ? response.data : []);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this checkpoint?')) return;
    const response = await sendRuntimeMessage(MESSAGE_ACTIONS.CONVERSATION_DELETE_CHECKPOINT, { id });
    if (response.ok) {
      void refreshCheckpoints();
    }
  }

  if (!visible) return null;

  return h('section', { class: 'dex-drawer-view dex-form', 'aria-label': 'Checkpoint Manager' }, [
    h('div', { class: 'dex-status-card dex-status-card--neutral' }, [
      h('strong', null, 'Local Checkpoints'),
      h('p', { class: 'dex-folder-state' }, 'Restore your conversation to a previous point-in-time.'),
    ]),

    loading && h('p', { class: 'dex-folder-state' }, 'Loading checkpoints...'),
    
    !loading && checkpoints.length === 0 && h('div', { class: 'dex-prompt-card' }, [
      h('p', { class: 'dex-prompt-card__body', style: { textAlign: 'center', padding: '20px' } }, 'No checkpoints saved for this conversation yet.'),
    ]),

    h('div', { class: 'dex-drawer-stack' }, 
      checkpoints.map(cp => h('article', { 
        key: cp.id, 
        class: 'dex-status-card dex-status-card--neutral',
      }, [
        h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' } }, [
          h('div', null, [
            h('strong', null, cp.title || `Checkpoint #${cp.id}`),
            h('div', { class: 'dex-folder-state', style: { fontSize: '10px' } }, new Date(cp.timestamp).toLocaleString()),
          ]),
          h('div', { class: 'dex-folder-inline-actions' }, [
            h('button', { 
              class: 'dex-link-btn dex-link-btn--accent', 
              style: { minHeight: '30px', padding: '4px 8px' },
              onClick: () => onRestore?.(cp)
            }, 'Restore'),
            h('button', { 
              class: 'dex-link-btn danger', 
              style: { minHeight: '30px', padding: '4px 8px' },
              onClick: () => handleDelete(cp.id)
            }, 'Delete'),
          ]),
        ]),
        h('p', { class: 'dex-prompt-card__body', style: { fontSize: '11px', marginTop: '8px', opacity: 0.8 } }, 
          `${cp.turns?.length || 0} turns saved. Contains code snapshots and reasoning.`
        )
      ]))
    )
  ]);
}
