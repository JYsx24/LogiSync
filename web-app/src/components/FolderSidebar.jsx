import React from 'react';
import { collection, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useConfirm } from './ConfirmDialog';
import { useToast } from './Toast';

export default function FolderSidebar({
  folders, items, activeFolderId, setActiveFolderId,
  newFolderName, setNewFolderName, handleCreateFolder, t,
}) {
  const confirm = useConfirm();
  const toast = useToast();

  const handleDeleteFolder = async (folder) => {
    const count = items.filter(i => i.folderId === folder.id).length;
    const message = count > 0
      ? `Delete "${folder.name}"? ${count} item(s) will become uncategorized.`
      : `Delete folder "${folder.name}"?`;

    const ok = await confirm(message);
    if (!ok) return;

    try {
      const batch = writeBatch(db);
      const q = query(collection(db, 'inventory'), where('folderId', '==', folder.id));
      const snap = await getDocs(q);
      snap.forEach(s => batch.update(doc(db, 'inventory', s.id), { folderId: '' }));
      batch.delete(doc(db, 'folders', folder.id));
      await batch.commit();
      if (activeFolderId === folder.id) setActiveFolderId('all');
      toast('Folder deleted');
    } catch (err) {
      console.error('Failed to delete folder:', err);
      toast('Failed to delete folder', 'error');
    }
  };

  return (
    <aside className="w-full md:w-64 shrink-0 glass-panel rounded-2xl p-5 flex flex-col justify-between self-start">
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--panel-border)]">
          <h2 className="text-sm font-bold text-[var(--text-color)] uppercase tracking-wider">{t('folders')}</h2>
          <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        </div>

        <nav className="flex flex-col space-y-1">
          {[
            { id: 'all', label: `📁 ${t('allStock')}`, count: items.length },
            { id: 'uncategorized', label: `📄 ${t('uncategorized')}`, count: items.filter(i => !i.folderId).length },
          ].map(({ id, label, count }) => (
            <button
              key={id}
              onClick={() => setActiveFolderId(id)}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-between ${
                activeFolderId === id
                  ? 'bg-indigo-500/15 border-l-2 border-indigo-500 text-indigo-300'
                  : 'hover:bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--text-color)]'
              }`}
            >
              <span>{label}</span>
              <span className="text-xs bg-[var(--input-bg)] px-2 py-0.5 rounded-md text-[var(--text-muted)]">{count}</span>
            </button>
          ))}

          <div className="pt-2 border-t border-[var(--panel-border)] space-y-1 max-h-60 overflow-y-auto">
            <p className="text-[10px] font-bold text-[var(--text-muted-dark)] uppercase px-3 py-1">{t('customFolders')}</p>
            {folders.map(folder => {
              const count = items.filter(i => i.folderId === folder.id).length;
              const active = activeFolderId === folder.id;
              return (
                <div
                  key={folder.id}
                  className={`flex items-center rounded-xl text-sm font-medium transition-colors group ${
                    active
                      ? 'bg-indigo-500/15 border-l-2 border-indigo-500 text-indigo-300'
                      : 'hover:bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--text-color)]'
                  }`}
                >
                  <button
                    onClick={() => setActiveFolderId(folder.id)}
                    className="flex-1 text-left px-3 py-2 truncate"
                  >
                    📁 {folder.name}
                  </button>
                  <span className="text-xs bg-[var(--input-bg)] px-1.5 py-0.5 rounded mr-1 text-[var(--text-muted)]">{count}</span>
                  <button
                    onClick={() => handleDeleteFolder(folder)}
                    className="p-1.5 mr-1.5 opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-red-400 transition-all rounded"
                    title="Delete folder"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        </nav>
      </div>

      <form onSubmit={handleCreateFolder} className="mt-6 pt-4 border-t border-[var(--panel-border)]">
        <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">{t('createNewFolder')}</label>
        <div className="flex gap-2">
          <input
            id="new-folder-input"
            type="text"
            placeholder={t('folderPlaceholder')}
            value={newFolderName}
            onChange={e => setNewFolderName(e.target.value)}
            className="flex-1 glass-input px-3 py-2 rounded-lg text-xs focus:outline-none text-[var(--text-color)] placeholder-[var(--text-muted)]"
          />
          <button
            id="create-folder-btn"
            type="submit"
            className="px-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-bold flex items-center justify-center transition-colors"
          >
            +
          </button>
        </div>
      </form>
    </aside>
  );
}
