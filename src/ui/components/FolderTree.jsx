import { h } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { searchFolders } from '../../lib/domain-logic.js';
import { MESSAGE_ACTIONS, sendRuntimeMessage } from '../../lib/message-protocol.js';
import { buildDiagnostics, showDexToast } from '../runtime/dex-toast-controller.js';

async function callAction(action, payload = {}) {
  const response = await sendRuntimeMessage(action, payload);
  if (!response.ok) {
    throw new Error(response.error || `Action failed: ${action}`);
  }
  return response.data;
}

function sortByCreatedAt(a, b) {
  return (a.createdAt || 0) - (b.createdAt || 0);
}

export function FolderTree({ currentChatUrl }) {
  const [folders, setFolders] = useState([]);
  const [activeFolderId, setActiveFolderId] = useState(null);
  const [showTrash, setShowTrash] = useState(false);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [creatingIn, setCreatingIn] = useState(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [renamingId, setRenamingId] = useState(null);
  const [renamingName, setRenamingName] = useState('');
  const [confirmTrashId, setConfirmTrashId] = useState(null);
  const [confirmPermId, setConfirmPermId] = useState(null);
  const [editingContextId, setEditingContextId] = useState(null);
  const [editingContextValue, setEditingContextValue] = useState('');
  const pendingDeletesRef = useRef(new Map());

  const notifyError = (operation, err) => {
    showDexToast({
      type: 'error',
      title: 'Folder action failed',
      message: err instanceof Error ? err.message : String(err),
      diagnostics: buildDiagnostics({
        module: 'ui/FolderTree',
        operation,
        host: window.location.hostname,
        url: window.location.href,
        error: err,
      }),
    });
  };

  useEffect(() => () => {
    for (const pending of pendingDeletesRef.current.values()) {
      window.clearTimeout(pending.timerId);
    }
    pendingDeletesRef.current.clear();
  }, []);

  function collectDescendantIdsLocal(sourceFolders, rootId) {
    const byParent = new Map();
    for (const folder of sourceFolders) {
      const parentId = folder.parentId || null;
      if (!byParent.has(parentId)) byParent.set(parentId, []);
      byParent.get(parentId).push(folder.id);
    }

    const visited = new Set();
    const queue = [rootId];
    while (queue.length > 0) {
      const current = queue.shift();
      if (!current || visited.has(current)) continue;
      visited.add(current);
      for (const childId of byParent.get(current) || []) queue.push(childId);
    }
    return visited;
  }

  const visibleFolders = useMemo(() => {
    let base = folders.filter((folder) => (showTrash ? folder.deletedAt !== null : folder.deletedAt === null));
    if (search.trim()) {
      return searchFolders(base, search);
    }
    return base.sort(sortByCreatedAt);
  }, [folders, showTrash, search]);

  const childrenByParentId = useMemo(() => {
    const map = new Map();
    for (const folder of visibleFolders) {
      const parent = folder.parentId || null;
      const bucket = map.get(parent) || [];
      bucket.push(folder);
      map.set(parent, bucket);
    }
    return map;
  }, [visibleFolders]);

  async function refresh() {
    try {
      setError('');
      const [treeData, mappingData] = await Promise.all([
        callAction(MESSAGE_ACTIONS.FOLDER_TREE_GET, { includeDeleted: true }),
        callAction(MESSAGE_ACTIONS.FOLDER_GET_BY_CHAT_URL, { chatUrl: currentChatUrl }),
      ]);
      setFolders(Array.isArray(treeData?.folders) ? treeData.folders : []);
      setActiveFolderId(mappingData?.folderId || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      notifyError('folder_tree.refresh', err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, [currentChatUrl]);

  function resetInlineState() {
    setCreatingIn(null);
    setNewFolderName('');
    setRenamingId(null);
    setRenamingName('');
    setConfirmTrashId(null);
    setConfirmPermId(null);
    setActiveMenuId(null);
  }

  async function createFolder(parentId) {
    const name = newFolderName.trim();
    if (!name) return;
    try {
      await callAction(MESSAGE_ACTIONS.FOLDER_CREATE, { name, parentId });
      resetInlineState();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      notifyError('folder_create', err);
    }
  }

  async function commitRename(folder) {
    const name = renamingName.trim();
    if (!name || name === folder.name) {
      setRenamingId(null);
      setRenamingName('');
      return;
    }
    try {
      await callAction(MESSAGE_ACTIONS.FOLDER_RENAME, { id: folder.id, name });
      setRenamingId(null);
      setRenamingName('');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      notifyError('folder_rename', err);
    }
  }

  function scheduleFolderDelete(folder) {
    const source = folders.map((item) => ({ ...item, chatUrls: Array.isArray(item.chatUrls) ? [...item.chatUrls] : [] }));
    const ids = collectDescendantIdsLocal(source, folder.id);
    const now = Date.now();
    setFolders((current) => current.map((item) => ids.has(item.id) ? { ...item, deletedAt: now } : item));
    resetInlineState();

    const timerId = window.setTimeout(async () => {
      pendingDeletesRef.current.delete(folder.id);
      try {
        await callAction(MESSAGE_ACTIONS.FOLDER_DELETE, { id: folder.id });
      } catch (err) {
        setFolders(source);
        setError(err instanceof Error ? err.message : String(err));
        notifyError('folder_soft_delete.commit', err);
        showDexToast({
          type: 'error',
          title: 'Trash move rolled back',
          message: 'Folder deletion failed and was restored.',
        });
      }
    }, 5000);

    pendingDeletesRef.current.set(folder.id, { timerId, snapshot: source });

    showDexToast({
      type: 'action',
      title: 'Folder moved to trash',
      message: `"${folder.name}" will commit in 5 seconds.`,
      actions: [{
        label: 'Undo',
        onSelect: () => {
          const pending = pendingDeletesRef.current.get(folder.id);
          if (!pending) return;
          window.clearTimeout(pending.timerId);
          pendingDeletesRef.current.delete(folder.id);
          setFolders(pending.snapshot);
          showDexToast({
            type: 'success',
            title: 'Trash move undone',
            message: 'Folder restored.',
          });
        },
      }],
      durationMs: 5200,
    });
  }

  async function restoreFolder(folder) {
    try {
      await callAction(MESSAGE_ACTIONS.FOLDER_RESTORE, { id: folder.id });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      notifyError('folder_restore', err);
    }
  }

  async function permanentlyDeleteFolder(folder) {
    try {
      await callAction(MESSAGE_ACTIONS.FOLDER_DELETE_PERMANENT, { id: folder.id });
      resetInlineState();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      notifyError('folder_delete_permanent', err);
    }
  }

  async function assignCurrentChat(folder) {
    if (!currentChatUrl) return;
    try {
      await callAction(MESSAGE_ACTIONS.FOLDER_ASSIGN_CHAT, { id: folder.id, chatUrl: currentChatUrl });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      notifyError('folder_assign_chat', err);
    }
  }

  async function unassignCurrentChat() {
    if (!currentChatUrl) return;
    try {
      await callAction(MESSAGE_ACTIONS.FOLDER_UNASSIGN_CHAT, { chatUrl: currentChatUrl });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      notifyError('folder_unassign_chat', err);
    }
  }

  async function updateFolderContext(id) {
    try {
      await callAction(MESSAGE_ACTIONS.FOLDER_SET_CONTEXT, { id, context: editingContextValue });
      showDexToast({ type: 'success', title: 'Context updated', message: 'Folder knowledge base refreshed.' });
      setEditingContextId(null);
      await refresh();
    } catch (err) {
      notifyError('folder_set_context', err);
    }
  }

  function renderCreateForm(parentId) {
    return h('div', { class: 'dex-folder-inline-form' }, [
      h('input', {
        class: 'dex-input',
        placeholder: 'Folder name',
        value: newFolderName,
        autofocus: true,
        'aria-label': 'New folder name',
        onInput: (event) => setNewFolderName(event.currentTarget.value),
        onKeyDown: (event) => {
          if (event.key === 'Enter') void createFolder(parentId);
          if (event.key === 'Escape') {
            setCreatingIn(null);
            setNewFolderName('');
          }
        },
      }),
      h('div', { class: 'dex-folder-inline-actions' }, [
        h('button', {
          type: 'button',
          class: 'dex-link-btn dex-link-btn--accent',
          disabled: !newFolderName.trim(),
          onClick: () => createFolder(parentId),
        }, 'Create'),
        h('button', {
          type: 'button',
          class: 'dex-link-btn',
          onClick: () => {
            setCreatingIn(null);
            setNewFolderName('');
          },
        }, 'Cancel'),
      ]),
    ]);
  }

  function renderFolderNode(folder, depth = 0) {
    const children = childrenByParentId.get(folder.id) || [];
    const assigned = folder.id === activeFolderId;
    const menuOpen = activeMenuId === folder.id;
    const isRenaming = renamingId === folder.id;
    const confirmingTrash = confirmTrashId === folder.id;
    const confirmingPermanentDelete = confirmPermId === folder.id;

    return h('div', { key: folder.id, class: 'dex-folder-node' }, [
      h('div', { class: `dex-folder-row${assigned ? ' is-active' : ''}`, style: `--depth:${depth};` }, [
        isRenaming
          ? h('input', {
              class: 'dex-input dex-folder-rename-input',
              value: renamingName,
              autofocus: true,
              'aria-label': `Rename ${folder.name}`,
              onInput: (event) => setRenamingName(event.currentTarget.value),
              onKeyDown: (event) => {
                if (event.key === 'Enter') void commitRename(folder);
                if (event.key === 'Escape') {
                  setRenamingId(null);
                  setRenamingName('');
                }
              },
            })
          : h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } }, [
              h('span', { style: { fontSize: '16px' } }, folder.deletedAt ? '🗑️' : childrenByParentId.has(folder.id) ? '📂' : '📁'),
              h('span', { class: 'dex-folder-name', style: { fontSize: '14px' } }, folder.name),
            ]),
        !isRenaming ? h('span', { class: 'dex-tag', style: { marginLeft: 'auto' } }, `${folder.chatUrls?.length || 0} chats`) : null,
        isRenaming
          ? h('div', { class: 'dex-folder-rename-actions' }, [
              h('button', { type: 'button', class: 'dex-link-btn dex-link-btn--accent', onClick: () => commitRename(folder) }, 'Save'),
              h('button', { type: 'button', class: 'dex-link-btn', onClick: () => { setRenamingId(null); setRenamingName(''); } }, 'Cancel'),
            ])
          : h('button', {
              type: 'button',
              class: `dex-link-btn dex-folder-menu-btn${menuOpen ? ' dex-link-btn--accent' : ''}`,
              onClick: () => setActiveMenuId(menuOpen ? null : folder.id),
              'aria-label': `Actions for ${folder.name}`,
              'aria-expanded': menuOpen ? 'true' : 'false',
            }, 'Actions'),
      ]),
      confirmingTrash
        ? h('div', { class: 'dex-folder-confirm', style: `--depth:${depth};` }, [
            h('span', { class: 'dex-folder-confirm__text' }, `Move "${folder.name}" to Trash?`),
            h('div', { class: 'dex-folder-confirm__actions' }, [
              h('button', { type: 'button', class: 'dex-link-btn danger', onClick: () => scheduleFolderDelete(folder) }, 'Move to Trash'),
              h('button', { type: 'button', class: 'dex-link-btn', onClick: () => setConfirmTrashId(null) }, 'Cancel'),
            ]),
          ])
        : null,
      confirmingPermanentDelete
        ? h('div', { class: 'dex-folder-confirm dex-folder-confirm--danger', style: `--depth:${depth};` }, [
            h('span', { class: 'dex-folder-confirm__text' }, `Delete "${folder.name}" and its nested folders permanently?`),
            h('div', { class: 'dex-folder-confirm__actions' }, [
              h('button', { type: 'button', class: 'dex-link-btn danger', onClick: () => void permanentlyDeleteFolder(folder) }, 'Delete forever'),
              h('button', { type: 'button', class: 'dex-link-btn', onClick: () => setConfirmPermId(null) }, 'Cancel'),
            ]),
          ])
        : null,
      editingContextId === folder.id
        ? h('div', { class: 'dex-folder-node__context-editor', style: `--depth:${depth};` }, [
            h('p', { class: 'dex-folder-state' }, 'Knowledge added here is automatically injected when using prompts from this folder.'),
            h('textarea', {
              class: 'dex-input dex-folder-context-textarea',
              placeholder: 'System instructions or shared context...',
              value: editingContextValue,
              onInput: (event) => setEditingContextValue(event.currentTarget.value),
            }),
            h('div', { class: 'dex-folder-inline-actions' }, [
              h('button', { type: 'button', class: 'dex-link-btn dex-link-btn--accent', onClick: () => void updateFolderContext(folder.id) }, 'Save Context'),
              h('button', { type: 'button', class: 'dex-link-btn', onClick: () => setEditingContextId(null) }, 'Cancel'),
            ]),
          ])
        : null,
      menuOpen
        ? h('div', { class: 'dex-folder-actions', style: `--depth:${depth};` },
            showTrash
              ? [
                  h('button', { type: 'button', class: 'dex-link-btn', onClick: () => restoreFolder(folder) }, 'Restore'),
                  h('button', {
                    type: 'button',
                    class: 'dex-link-btn danger',
                    onClick: () => {
                      setConfirmPermId(folder.id);
                      setActiveMenuId(null);
                    },
                  }, 'Delete Forever'),
                ]
              : [
                  h('button', {
                    type: 'button',
                    class: 'dex-link-btn',
                    onClick: () => {
                      setCreatingIn(folder.id);
                      setNewFolderName('');
                      setActiveMenuId(null);
                    },
                  }, '+ Child'),
                  h('button', {
                    type: 'button',
                    class: 'dex-link-btn',
                    onClick: () => {
                      setRenamingId(folder.id);
                      setRenamingName(folder.name);
                      setActiveMenuId(null);
                    },
                  }, 'Rename'),
                  h('button', {
                    type: 'button',
                    class: 'dex-link-btn',
                    onClick: () => {
                      void assignCurrentChat(folder);
                      setActiveMenuId(null);
                    },
                  }, assigned ? 'Reassign Here' : 'Assign Here'),
                  h('button', {
                    type: 'button',
                    class: 'dex-link-btn',
                    onClick: () => {
                      setEditingContextId(folder.id);
                      setEditingContextValue(folder.context || '');
                      setActiveMenuId(null);
                    },
                  }, 'Knowledge'),
                  h('button', {
                    type: 'button',
                    class: 'dex-link-btn danger',
                    onClick: () => {
                      setConfirmTrashId(folder.id);
                      setActiveMenuId(null);
                    },
                  }, 'Trash'),
                ]
          )
        : null,
      creatingIn === folder.id ? renderCreateForm(folder.id) : null,
      children.length > 0
        ? h('div', { class: 'dex-folder-children' }, children.map((child) => renderFolderNode(child, depth + 1)))
        : null,
    ]);
  }

  return h('section', { class: 'dex-folder-tree', 'aria-label': 'Chat organization' }, [
    h('div', { class: `dex-status-card ${activeFolderId ? 'dex-status-card--glow' : ''}`, style: { marginBottom: '16px' } }, [
      h('span', { class: 'dex-status-card__label' }, 'Chat Context'),
      h('strong', { class: 'dex-status-card__value' }, activeFolderId
        ? `Organized`
        : 'Unassigned'),
      h('p', { class: 'dex-folder-state' }, activeFolderId
        ? `This conversation is safely categorized. Actions like Restore or Delete are managed below.`
        : 'This chat is drifting. Assign it to a folder to track context over time.'),
    ]),
    h('div', { class: 'dex-folder-toolbar' }, [
      h('input', {
        class: 'dex-input dex-folder-search',
        placeholder: 'Search folders…',
        value: search,
        'aria-label': 'Search folders',
        onInput: (event) => setSearch(event.currentTarget.value),
      }),
      h('button', {
        type: 'button',
        class: 'dex-link-btn dex-link-btn--accent',
        onClick: () => {
          setCreatingIn('root');
          setNewFolderName('');
        },
      }, '+ Folder'),
      h('button', {
        type: 'button',
        class: 'dex-link-btn',
        onClick: () => {
          setShowTrash((value) => !value);
          setSearch('');
        },
      }, showTrash ? 'Show Active' : 'Show Trash'),
      activeFolderId
        ? h('button', { type: 'button', class: 'dex-link-btn', onClick: () => unassignCurrentChat() }, 'Unassign Chat')
        : null,
    ]),
    creatingIn === 'root' ? renderCreateForm(null) : null,
    isLoading ? h('div', { class: 'dex-folder-state', role: 'status' }, 'Loading folders…') : null,
    error ? h('div', { class: 'dex-folder-state error', role: 'alert' }, error) : null,
    !isLoading && visibleFolders.length === 0
      ? h('div', { class: 'dex-folder-state' }, showTrash ? 'Trash is empty.' : 'No folders yet. Create one to organize this chat.')
      : null,
    h('div', { class: 'dex-folder-list' }, (childrenByParentId.get(null) || []).map((folder) => renderFolderNode(folder, 0))),
  ]);
}
