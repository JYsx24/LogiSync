import React from 'react';
import { collection, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useConfirm } from './ConfirmDialog';
import { useToast } from './Toast';

function FolderIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  );
}

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

  const NavButton = ({ id, label, icon, count }) => {
    const active = activeFolderId === id;
    return (
      <button
        onClick={() => setActiveFolderId(id)}
        className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2.5 nav-item ${active ? 'active' : ''}`}
      >
        {icon}
        <span className="flex-1 truncate">{label}</span>
        <span className={`text-[10px] px-2 py-0.5 rounded-lg font-semibold ${active ? 'bg-indigo-500/20 text-indigo-300' : 'bg-[var(--input-bg)] text-[var(--text-3)]'}`}>
          {count}
        </span>
      </button>
    );
  };

  return (
    <aside className="w-full lg:w-60 shrink-0 self-start">
      <div className="glass rounded-2xl p-4 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] flex items-center justify-center">
            <FolderIcon className="w-3.5 h-3.5 text-[var(--text-2)]" />
          </div>
          <h2 className="text-xs font-bold text-[var(--text-2)] uppercase tracking-wider">{t('folders')}</h2>
        </div>

        {/* Built-in nav */}
        <nav className="flex flex-col gap-1">
          <NavButton
            id="all" label={t('allStock')} count={items.length}
            icon={<svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>}
          />
          <NavButton
            id="uncategorized" label={t('uncategorized')} count={items.filter(i => !i.folderId).length}
            icon={<svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
          />
        </nav>

        {/* Custom folders */}
        {folders.length > 0 && (
          <div className="border-t border-[var(--border)] pt-4">
            <p className="text-[10px] font-bold text-[var(--text-3)] uppercase tracking-wider px-1 mb-2">{t('customFolders')}</p>
            <div className="flex flex-col gap-1 max-h-56 overflow-y-auto">
              {folders.map(folder => {
                const count = items.filter(i => i.folderId === folder.id).length;
                const active = activeFolderId === folder.id;
                return (
                  <div key={folder.id} className={`group flex items-center rounded-xl nav-item ${active ? 'active' : ''}`}>
                    <button
                      onClick={() => setActiveFolderId(folder.id)}
                      className="flex-1 flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium truncate"
                    >
                      <FolderIcon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{folder.name}</span>
                      <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-lg font-semibold shrink-0 ${active ? 'bg-indigo-500/20 text-indigo-300' : 'bg-[var(--input-bg)] text-[var(--text-3)]'}`}>
                        {count}
                      </span>
                    </button>
                    <button
                      onClick={() => handleDeleteFolder(folder)}
                      className="mr-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 text-[var(--text-3)] hover:text-[var(--danger)] hover:bg-[var(--danger-bg)] transition-all"
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
          </div>
        )}

        {/* New folder form */}
        <div className="border-t border-[var(--border)] pt-4">
          <label className="block text-[10px] font-bold text-[var(--text-3)] uppercase tracking-wider mb-2">{t('createNewFolder')}</label>
          <form onSubmit={handleCreateFolder} className="flex gap-2">
            <input
              id="new-folder-input" type="text"
              placeholder={t('folderPlaceholder')}
              value={newFolderName} onChange={e => setNewFolderName(e.target.value)}
              className="field flex-1 px-3 py-2 text-xs rounded-xl"
            />
            <button
              id="create-folder-btn" type="submit"
              className="btn-primary w-9 h-9 flex items-center justify-center rounded-xl shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
