import { h } from 'preact';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { MESSAGE_ACTIONS, sendRuntimeMessage } from '../../lib/message-protocol.js';

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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Inline UI state — replaces all window.prompt / window.confirm
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [creatingIn, setCreatingIn] = useState(null); // null | 'root' | folderId
  const [newFolderName, setNewFolderName] = useState('');
  const [renamingId, setRenamingId] = useState(null);
  const [renamingName, setRenamingName] = useState('');
  const [confirmTrashId, setConfirmTrashId] = useState(null);
  const [confirmPermId, setConfirmPermId] = useState(null);

  const visibleFolders = useMemo(() => {
    return folders
      .filter((folder) => (showTrash ? folder.deletedAt !== null : folder.deletedAt === null))
      .sort(sortByCreatedAt);
  }, [folders, showTrash]);

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
    }
  }

  async function deleteFolder(folder) {
    try {
      await callAction(MESSAGE_ACTIONS.FOLDER_DELETE, { id: folder.id });
      resetInlineState();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function restoreFolder(folder) {
    try {
      await callAction(MESSAGE_ACTIONS.FOLDER_RESTORE, { id: folder.id });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function permanentlyDeleteFolder(folder) {
    try {
      await callAction(MESSAGE_ACTIONS.FOLDER_DELETE_PERMANENT, { id: folder.id });
      resetInlineState();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function assignCurrentChat(folder) {
    if (!currentChatUrl) return;
    try {
      await callAction(MESSAGE_ACTIONS.FOLDER_ASSIGN_CHAT, {
        id: folder.id,
        chatUrl: currentChatUrl,
      });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function unassignCurrentChat() {
    if (!currentChatUrl) return;
    try {
      await callAction(MESSAGE_ACTIONS.FOLDER_UNASSIGN_CHAT, { chatUrl: currentChatUrl });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
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
        onInput: (e) => setNewFolderName(e.currentTarget.value),
        onKeyDown: (e) => {
          if (e.key === 'Enter') void createFolder(parentId);
          if (e.key === 'Escape') { setCreatingIn(null); setNewFolderName(''); }
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
          onClick: () => { setCreatingIn(null); setNewFolderName(''); },
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
    const confirmingPerm = confirmPermId === folder.id;

    return h('div', { key: folder.id, class: 'dex-folder-node' }, [
      // Row: name | count | ⋯
      h('div', {
        class: `dex-folder-row${assigned ? ' is-active' : ''}`,
        style: `--depth:${depth};`,
      }, [
        isRenaming
          ? h('input', {
              class: 'dex-input dex-folder-rename-input',
              value: renamingName,
              autofocus: true,
              'aria-label': `Rename ${folder.name}`,
              onInput: (e) => setRenamingName(e.currentTarget.value),
              onKeyDown: (e) => {
                if (e.key === 'Enter') void commitRename(folder);
                if (e.key === 'Escape') { setRenamingId(null); setRenamingName(''); }
              },
            })
          : h('span', { class: 'dex-folder-name' }, folder.name),

        !isRenaming
          ? h('span', { class: 'dex-folder-count' }, `${folder.chatUrls?.length || 0}`)
          : null,

        isRenaming
          ? h('div', { class: 'dex-folder-rename-actions' }, [
              h('button', {
                type: 'button',
                class: 'dex-link-btn dex-link-btn--panel dex-link-btn--accent',
                onClick: () => commitRename(folder),
              }, 'Save'),
              h('button', {
                type: 'button',
                class: 'dex-link-btn dex-link-btn--panel',
                onClick: () => { setRenamingId(null); setRenamingName(''); },
              }, 'Cancel'),
            ])
          : h('button', {
              type: 'button',
              class: `dex-link-btn dex-link-btn--panel dex-folder-menu-btn${menuOpen ? ' dex-link-btn--accent' : ''}`,
              onClick: () => setActiveMenuId(menuOpen ? null : folder.id),
              title: 'Folder actions',
              'aria-label': `Actions for ${folder.name}`,
              'aria-expanded': menuOpen ? 'true' : 'false',
            }, '⋯'),
      ]),

      // Inline confirm: move to trash
      confirmingTrash
        ? h('div', { class: 'dex-folder-confirm', style: `--depth:${depth};` }, [
            h('span', { class: 'dex-folder-confirm__text' }, `Move "${folder.name}" to Trash?`),
            h('div', { class: 'dex-folder-confirm__actions' }, [
              h('button', {
                type: 'button',
                class: 'dex-link-btn danger',
                onClick: () => deleteFolder(folder),
              }, 'Move to Trash'),
              h('button', {
                type: 'button',
                class: 'dex-link-btn',
                onClick: () => setConfirmTrashId(null),
              }, 'Cancel'),
            ]),
          ])
        : null,

      // Inline confirm: permanent delete
      confirmingPerm
        ? h('div', { class: 'dex-folder-confirm', style: `--depth:${depth};` }, [
            h('span', { class: 'dex-folder-confirm__text' }, `Permanently delete "${folder.name}" and all nested folders?`),
            h('div', { class: 'dex-folder-confirm__actions' }, [
              h('button', {
                type: 'button',
                class: 'dex-link-btn danger',
                onClick: () => permanentlyDeleteFolder(folder),
              }, 'Delete Forever'),
              h('button', {
                type: 'button',
                class: 'dex-link-btn',
                onClick: () => setConfirmPermId(null),
              }, 'Cancel'),
            ]),
          ])
        : null,

      // Action menu (revealed by ⋯)
      menuOpen
        ? h('div', { class: 'dex-folder-actions', style: `--depth:${depth};` },
            showTrash
              ? [
                  h('button', {
                    type: 'button',
                    class: 'dex-link-btn',
                    onClick: () => restoreFolder(folder),
                  }, 'Restore'),
                  h('button', {
                    type: 'button',
                    class: 'dex-link-btn danger',
                    onClick: () => { setConfirmPermId(folder.id); setActiveMenuId(null); },
                  }, 'Delete Forever'),
                ]
              : [
                  h('button', {
                    type: 'button',
                    class: 'dex-link-btn',
                    onClick: () => { setCreatingIn(folder.id); setNewFolderName(''); setActiveMenuId(null); },
                  }, '+ Child'),
                  h('button', {
                    type: 'button',
                    class: 'dex-link-btn',
                    onClick: () => { setRenamingId(folder.id); setRenamingName(folder.name); setActiveMenuId(null); },
                  }, 'Rename'),
                  h('button', {
                    type: 'button',
                    class: 'dex-link-btn',
                    onClick: () => { void assignCurrentChat(folder); setActiveMenuId(null); },
                  }, assigned ? 'Reassign Here' : 'Assign Here'),
                  h('button', {
                    type: 'button',
                    class: 'dex-link-btn danger',
                    onClick: () => { setConfirmTrashId(folder.id); setActiveMenuId(null); },
                  }, 'Trash'),
                ]
          )
        : null,

      // Inline create form for child folder
      creatingIn === folder.id ? renderCreateForm(folder.id) : null,

      children.length > 0
        ? h('div', { class: 'dex-folder-children' },
            children.map((child) => renderFolderNode(child, depth + 1))
          )
        : null,
    ]);
  }

  return h('div', { class: 'dex-folder-tree' }, [
    h('div', { class: 'dex-folder-toolbar' }, [
      h('button', {
        type: 'button',
        class: 'dex-link-btn',
        onClick: () => { setCreatingIn('root'); setNewFolderName(''); },
      }, '+ Folder'),
      h('button', {
        type: 'button',
        class: 'dex-link-btn',
        onClick: () => setShowTrash((v) => !v),
      }, showTrash ? 'Show Active' : 'Show Trash'),
      activeFolderId
        ? h('button', {
            type: 'button',
            class: 'dex-link-btn',
            onClick: () => unassignCurrentChat(),
          }, 'Unassign Chat')
        : null,
    ]),

    creatingIn === 'root' ? renderCreateForm(null) : null,

    isLoading ? h('div', { class: 'dex-folder-state', role: 'status' }, 'Loading folders…') : null,
    error ? h('div', { class: 'dex-folder-state error', role: 'alert' }, error) : null,
    !isLoading && visibleFolders.length === 0
      ? h('div', { class: 'dex-folder-state' }, showTrash ? 'Trash is empty.' : 'No folders yet. Click + Folder to create one.')
      : null,

    h('div', { class: 'dex-folder-list' },
      (childrenByParentId.get(null) || []).map((folder) => renderFolderNode(folder, 0))
    ),
  ]);
}
