import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { MESSAGE_ACTIONS, sendRuntimeMessage } from '../../lib/message-protocol.js';

function storageKeyForHint(hintId) {
  return `contextualHintAck:${hintId}`;
}

export function ContextualHint({ hintId, title, message, visible = true }) {
  const [checked, setChecked] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setDismissed(false);
    setChecked(false);

    const key = storageKeyForHint(hintId);
    void sendRuntimeMessage(MESSAGE_ACTIONS.STORAGE_GET_ONE, { key })
      .then((response) => {
        if (!response.ok) {
          setAcknowledged(false);
          setChecked(true);
          return;
        }
        setAcknowledged(response.data === true);
        setChecked(true);
      })
      .catch(() => {
        setAcknowledged(false);
        setChecked(true);
      });
  }, [hintId, visible]);

  if (!visible || !checked || acknowledged || dismissed) {
    return null;
  }

  const persistAck = async () => {
    const key = storageKeyForHint(hintId);
    const response = await sendRuntimeMessage(MESSAGE_ACTIONS.STORAGE_SET, {
      items: {
        [key]: true,
      },
    });
    if (response.ok) {
      setAcknowledged(true);
      setDismissed(true);
      return;
    }
    setDismissed(true);
  };

  return h('aside', { class: 'dex-contextual-hint', role: 'note', 'aria-label': `${title} hint` }, [
    h('strong', { class: 'dex-contextual-hint__title' }, title),
    h('p', { class: 'dex-contextual-hint__message' }, message),
    h('div', { class: 'dex-folder-actions' }, [
      h('button', {
        type: 'button',
        class: 'dex-link-btn',
        onClick: () => setDismissed(true),
      }, 'Dismiss'),
      h('button', {
        type: 'button',
        class: 'dex-link-btn dex-link-btn--accent',
        onClick: () => { void persistAck(); },
      }, 'Don\'t show again'),
    ]),
  ]);
}
