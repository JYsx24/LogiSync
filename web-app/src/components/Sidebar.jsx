import React, { useState } from 'react';
import {
  collection, addDoc, updateDoc, deleteDoc,
  setDoc, doc, getDocs, query, where, writeBatch, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useConfirm } from './ConfirmDialog';
import { useToast } from './Toast';

export const FOLDER_COLORS = [
  '#14b8a6', '#38bdf8', '#818cf8', '#a78bfa',
  '#f472b6', '#fb923c', '#facc15', '#4ade80',
];

const LogoMark = ({ size = 28 }) => (
  <svg width={size} height={Math.round(size * 0.88)} viewBox="0 0 100 90" xmlns="http://www.w3.org/2000/svg">
    <polygon points="50,8 82,26 50,44 18,26" fill="#2dd4bf"/>
    <polygon points="18,26 50,44 50,80 18,62" fill="#0d9488"/>
    <polygon points="50,44 82,26 82,62 50,80" fill="#0369a1"/>
    <line x1="50" y1="8" x2="82" y2="26" stroke="rgba(255,255,255,.22)" strokeWidth="1"/>
    <line x1="50" y1="8" x2="18" y2="26" stroke="rgba(255,255,255,.11)" strokeWidth="1"/>
  </svg>
);

function ColorSwatch({ currentColor, position, onSelect }) {
  return (
    <div className="fixed z-[100] p-2.5 rounded-2xl shadow-2xl"
      style={{
        top: position.top, left: Math.min(position.left, (typeof window !== 'undefined' ? window.innerWidth : 1200) - 172),
        background: 'var(--surface-overlay)', border: '1px solid var(--border-strong)', width: 164,
      }}>
      <p className="text-[9px] font-bold text-[var(--text-3)] uppercase tracking-wider mb-2">Folder Colour</p>
      <div className="grid grid-cols-4 gap-1.5">
        {FOLDER_COLORS.map(c => (
          <button key={c} onClick={() => onSelect(c)}
            className="w-7 h-7 rounded-xl transition-all hover:scale-110 active:scale-95"
            style={{ background: c, boxShadow: currentColor === c ? `0 0 0 2px var(--sidebar-bg), 0 0 0 3.5px ${c}` : 'none' }} />
        ))}
      </div>
      <button onClick={() => onSelect(null)}
        className="mt-2 w-full py-1.5 rounded-xl text-[10px] font-semibold transition-colors hover:text-[var(--text)]"
        style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-3)' }}>
        No Colour
      </button>
    </div>
  );
}

export default function Sidebar({
  user, displayName, currentTab, setCurrentTab,
  folders, items, activeFolderId, setActiveFolderId,
  newFolderName, setNewFolderName, handleCreateFolder,
  handleLogout, t, mobileOpen, onMobileClose,
  onClearSelectedItem,
}) {
  const confirm = useConfirm();
  const toast = useToast();
  const [foldersExpanded, setFoldersExpanded] = useState(true);
  const [colorPickerFolderId, setColorPickerFolderId] = useState(null);
  const [swatchPos, setSwatchPos] = useState({ top: 0, left: 0 });

  const handleDeleteFolder = async (folder) => {
    const count = items.filter(i => i.folderId === folder.id).length;
    const msg = count > 0
      ? `Delete "${folder.name}"? ${count} item(s) will become uncategorized.`
      : `Delete folder "${folder.name}"?`;
    const ok = await confirm(msg);
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
      toast('Failed to delete folder', 'error');
    }
  };

  const handleColorChange = async (folderId, color) => {
    try {
      await updateDoc(doc(db, 'folders', folderId), { color: color ?? null });
      setColorPickerFolderId(null);
    } catch { toast('Failed to update colour', 'error'); }
  };

  const openColorPicker = (e, folderId) => {
    e.stopPropagation();
    if (colorPickerFolderId === folderId) { setColorPickerFolderId(null); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    setSwatchPos({ top: rect.bottom + 6, left: rect.left - 8 });
    setColorPickerFolderId(folderId);
  };

  const navigate = (tab) => {
    setCurrentTab(tab);
    onClearSelectedItem?.();
    onMobileClose?.();
  };

  const navItems = [
    {
      id: 'dashboard', label: t('dashboard'),
      icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
    },
    {
      id: 'profile', label: t('profile'),
      icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    },
    {
      id: 'settings', label: t('settings'),
      icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z',
    },
  ];

  const sidebarContent = (
    <aside className="flex flex-col h-full" style={{ background: 'var(--sidebar-bg)' }}>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-[var(--border)] shrink-0">
        <LogoMark size={28} />
        <span className="font-bold text-[15px] text-[var(--text)] tracking-tight">LogiSync</span>
      </div>

      {/* User info */}
      <div className="px-3 py-3 border-b border-[var(--border)] shrink-0">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors select-none">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-500 to-sky-500 flex items-center justify-center text-white text-xs font-bold uppercase shrink-0">
            {displayName.charAt(0)}
          </div>
          <span className="text-sm font-semibold text-[var(--text)] flex-1 truncate">{displayName}</span>
          <svg className="w-4 h-4 text-[var(--text-3)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Primary nav */}
      <nav className="px-3 py-3 flex flex-col gap-0.5 shrink-0">
        {navItems.map(({ id, label, icon }) => {
          const active = currentTab === id;
          return (
            <button key={id} onClick={() => navigate(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${active ? 'bg-white/10 text-white' : 'text-[var(--text-3)] hover:bg-white/5 hover:text-[var(--text-2)]'}`}>
              <svg className={`w-4 h-4 shrink-0 ${active ? 'text-[var(--primary)]' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon} />
              </svg>
              {label}
            </button>
          );
        })}
      </nav>

      {/* Folders section */}
      <div className="flex-1 overflow-y-auto px-3 pb-3" style={{ scrollbarWidth: 'none' }}>
        <button onClick={() => setFoldersExpanded(v => !v)}
          className="w-full flex items-center justify-between px-3 py-2 mb-1 text-left">
          <span className="text-[10px] font-bold text-[var(--text-3)] uppercase tracking-widest">Folders</span>
          <svg className={`w-3.5 h-3.5 text-[var(--text-3)] transition-transform ${foldersExpanded ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {foldersExpanded && (
          <>
            {/* All Stock */}
            <button onClick={() => { setActiveFolderId('all'); navigate('dashboard'); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all ${activeFolderId === 'all' && currentTab === 'dashboard' ? 'bg-white/10 text-white font-medium' : 'text-[var(--text-3)] hover:bg-white/5 hover:text-[var(--text-2)]'}`}>
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span className="flex-1 truncate">All Stock</span>
              <span className="text-[10px] opacity-60 font-medium">{items.length}</span>
            </button>

            {/* Uncategorized */}
            <button onClick={() => { setActiveFolderId('uncategorized'); navigate('dashboard'); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all ${activeFolderId === 'uncategorized' && currentTab === 'dashboard' ? 'bg-white/10 text-white font-medium' : 'text-[var(--text-3)] hover:bg-white/5 hover:text-[var(--text-2)]'}`}>
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="flex-1 truncate">Uncategorized</span>
              <span className="text-[10px] opacity-60 font-medium">{items.filter(i => !i.folderId).length}</span>
            </button>

            {/* Custom folders */}
            {folders.map(folder => {
              const count = items.filter(i => i.folderId === folder.id).length;
              const active = activeFolderId === folder.id && currentTab === 'dashboard';
              const color = folder.color || null;
              return (
                <div key={folder.id} className="group relative flex items-center">
                  <button onClick={e => openColorPicker(e, folder.id)}
                    className="shrink-0 ml-3 w-2.5 h-2.5 rounded-full transition-all hover:scale-125"
                    style={{ background: color || 'var(--border-strong)', boxShadow: color ? `0 0 5px ${color}70` : 'none' }} />
                  <button onClick={() => { setActiveFolderId(folder.id); navigate('dashboard'); }}
                    className={`flex-1 flex items-center gap-2 px-2 py-2 rounded-xl text-sm transition-all ml-1 ${active ? 'bg-white/10 text-white font-medium' : 'text-[var(--text-3)] hover:bg-white/5 hover:text-[var(--text-2)]'}`}>
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={color ? { color } : {}}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    <span className="flex-1 truncate">{folder.name}</span>
                    <span className="text-[10px] opacity-60 font-medium">{count}</span>
                  </button>
                  <button onClick={() => handleDeleteFolder(folder)}
                    className="mr-1 p-1 rounded-lg opacity-0 group-hover:opacity-100 text-[var(--text-3)] hover:text-[var(--danger)] transition-all">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              );
            })}

            {/* New folder input */}
            <form onSubmit={handleCreateFolder} className="flex gap-1.5 mt-2 px-1">
              <input id="new-folder-input" type="text"
                placeholder="New folder…"
                value={newFolderName} onChange={e => setNewFolderName(e.target.value)}
                className="field flex-1 px-3 py-1.5 text-xs rounded-xl"
                style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.08)' }}
              />
              <button id="create-folder-btn" type="submit"
                className="w-8 h-8 flex items-center justify-center rounded-xl shrink-0 transition-all hover:opacity-80"
                style={{ background: 'var(--primary)', color: '#09090b' }}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </form>
          </>
        )}
      </div>

      {/* Sign Out */}
      <div className="px-3 py-3 border-t border-[var(--border)] shrink-0">
        <button onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-[var(--text-3)] hover:bg-[var(--danger-bg)] hover:text-[var(--danger)]">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign Out
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:block w-60 shrink-0" />
      <div className="hidden lg:flex fixed top-0 left-0 bottom-0 w-60 z-40 flex-col border-r border-[var(--border)]"
        style={{ background: 'var(--sidebar-bg)' }}>
        {sidebarContent}
      </div>

      {/* Mobile overlay + drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onMobileClose} />
          <div className="relative w-72 flex flex-col border-r border-[var(--border)]"
            style={{ background: 'var(--sidebar-bg)', zIndex: 51 }}>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Color picker */}
      {colorPickerFolderId && (
        <>
          <div className="fixed inset-0 z-[90]" onClick={() => setColorPickerFolderId(null)} />
          <ColorSwatch
            currentColor={folders.find(f => f.id === colorPickerFolderId)?.color || null}
            position={swatchPos}
            onSelect={c => handleColorChange(colorPickerFolderId, c)}
          />
        </>
      )}
    </>
  );
}
