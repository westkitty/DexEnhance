import { h } from 'preact';
import { useEffect, useState, useRef } from 'preact/hooks';

export function SelectionHUD({ 
  onAction, 
  visible, 
  x, 
  y, 
  selectionText 
}) {
  if (!visible || !selectionText) return null;

  const hudRef = useRef(null);

  // Quick actions mapping
  const actions = [
    { id: 'summarize', label: 'Summarize', icon: '📝', prompt: 'Summarize the selected text concisely.' },
    { id: 'explain', label: 'Explain', icon: '💡', prompt: 'Explain the following concept like I am a senior engineer.' },
    { id: 'fix', label: 'Fix Grammar', icon: '✨', prompt: 'Fix the grammar and clarity of this text.' },
    { id: 'curate', label: 'Curate', icon: '📎', prompt: 'Save this to my semantic clipboard as an important reference.' },
  ];

  return h('div', {
    ref: hudRef,
    id: 'dex-selection-hud',
    class: 'dex-selection-hud-container',
    style: {
      position: 'absolute',
      left: `${x}px`,
      top: `${y - 45}px`, // Place slightly above the selection
      zIndex: 9999999,
      pointerEvents: 'auto',
    }
  }, [
    h('div', { class: 'dex-hud-bar' }, 
      actions.map(action => h('button', {
        key: action.id,
        class: 'dex-hud-action-btn',
        title: action.label,
        onClick: (e) => {
          e.preventDefault();
          e.stopPropagation();
          onAction(action, selectionText);
        }
      }, [
        h('span', { class: 'dex-hud-icon' }, action.icon),
        h('span', { class: 'dex-hud-label' }, action.label)
      ]))
    )
  ]);
}
