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

  async function createFolder(parentId = null) {
    const name = window.prompt('Folder name');
    if (!name) return;
    try {
      await callAction(MESSAGE_ACTIONS.FOLDER_CREATE, { name, parentId });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function renameFolder(folder) {
    const name = window.prompt('Rename folder', folder.name);
    if (!name || name.trim() === folder.name) return;
    try {
      await callAction(MESSAGE_ACTIONS.FOLDER_RENAME, { id: folder.id, name });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function deleteFolder(folder) {
    const ok = window.confirm(`Move "${folder.name}" to Trash?`);
    if (!ok) return;
    try {
      await callAction(MESSAGE_ACTIONS.FOLDER_DELETE, { id: folder.id });
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
    const ok = window.confirm(`Permanently delete "${folder.name}" and all nested folders?`);
    if (!ok) return;
    try {
      await callAction(MESSAGE_ACTIONS.FOLDER_DELETE_PERMANENT, { id: folder.id });
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
      await callAction(MESSAGE_ACTIONS.FOLDER_UNASSIGN_CHAT, {
        chatUrl: currentChatUrl,
      });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  function renderFolderNode(folder, depth = 0) {
    const children = childrenByParentId.get(folder.id) || [];
    const assigned = folder.id === activeFolderId;

    return h('div', { key: folder.id, class: 'dex-folder-node' }, [
      h(
        'div',
        {
          class: `dex-folder-row${assigned ? ' is-active' : ''}`,
          style: `--depth:${depth};`,
        },
        [
          h('span', { class: 'dex-folder-name' }, folder.name),
          h('span', { class: 'dex-folder-count' }, `${folder.chatUrls?.length || 0}`),
        ]
      ),
      h(
        'div',
        {
          class: 'dex-folder-actions',
          style: `--depth:${depth};`,
        },
        showTrash
          ? [
              h(
                'button',
                { type: 'button', class: 'dex-link-btn', onClick: () => restoreFolder(folder) },
                'Restore'
              ),
              h(
                'button',
                { type: 'button', class: 'dex-link-btn danger', onClick: () => permanentlyDeleteFolder(folder) },
                'Delete'
              ),
            ]
          : [
              h(
                'button',
                { type: 'button', class: 'dex-link-btn', onClick: () => createFolder(folder.id) },
                '+ Child'
              ),
              h(
                'button',
                { type: 'button', class: 'dex-link-btn', onClick: () => renameFolder(folder) },
                'Rename'
              ),
              h(
                'button',
                { type: 'button', class: 'dex-link-btn', onClick: () => assignCurrentChat(folder) },
                assigned ? 'Reassign' : 'Assign Here'
              ),
              h(
                'button',
                { type: 'button', class: 'dex-link-btn danger', onClick: () => deleteFolder(folder) },
                'Trash'
              ),
            ]
      ),
      children.length > 0
        ? h(
            'div',
            { class: 'dex-folder-children' },
            children.map((child) => renderFolderNode(child, depth + 1))
          )
        : null,
    ]);
  }

  return h('div', { class: 'dex-folder-tree' }, [
    h('div', { class: 'dex-folder-toolbar' }, [
      h('button', { type: 'button', class: 'dex-link-btn', onClick: () => createFolder(null) }, '+ Folder'),
      h(
        'button',
        { type: 'button', class: 'dex-link-btn', onClick: () => setShowTrash((value) => !value) },
        showTrash ? 'Show Active' : 'Show Trash'
      ),
      activeFolderId
        ? h('button', { type: 'button', class: 'dex-link-btn', onClick: () => unassignCurrentChat() }, 'Unassign Chat')
        : null,
    ]),
    isLoading ? h('div', { class: 'dex-folder-state' }, 'Loading folders...') : null,
    error ? h('div', { class: 'dex-folder-state error' }, error) : null,
    !isLoading && visibleFolders.length === 0
      ? h('div', { class: 'dex-folder-state' }, showTrash ? 'Trash is empty.' : 'No folders yet.')
      : null,
    h(
      'div',
      { class: 'dex-folder-list' },
      (childrenByParentId.get(null) || []).map((folder) => renderFolderNode(folder, 0))
    ),
  ]);
}
