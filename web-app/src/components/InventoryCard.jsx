import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConfirm } from './ConfirmDialog';

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1553413719-8758712747d5?auto=format&fit=crop&w=300&q=80';

function StockBadge({ item }) {
  const threshold = item.lowStockThreshold ?? 5;
  if (item.quantity === 0) {
    return (
      <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide bg-red-500/20 border border-red-500/30 text-red-400">
        Out of Stock
      </span>
    );
  }
  if (item.quantity <= threshold) {
    return (
      <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide bg-amber-500/20 border border-amber-500/30 text-amber-400">
        Low Stock
      </span>
    );
  }
  return null;
}

function EditControls({ item, adjustQuantity, openEditModal, handleDeleteItem, t }) {
  const [directQty, setDirectQty] = useState('');

  const commitDirectQty = () => {
    const parsed = parseInt(directQty, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      const delta = parsed - item.quantity;
      if (delta !== 0) adjustQuantity(item.id, delta, parsed);
    }
    setDirectQty('');
  };

  return (
    <div className="bg-[var(--input-bg)] rounded-xl p-3 border border-[var(--input-border)] space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => adjustQuantity(item.id, -1)}
            className="w-8 h-8 bg-[var(--panel-bg)] hover:bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--text-color)] rounded-lg flex items-center justify-center font-bold text-base transition-colors border border-[var(--input-border)]"
          >−</button>
          <input
            type="number"
            min="0"
            placeholder={String(item.quantity)}
            value={directQty}
            onChange={e => setDirectQty(e.target.value)}
            onBlur={commitDirectQty}
            onKeyDown={e => e.key === 'Enter' && commitDirectQty()}
            className="w-16 text-center glass-input px-2 py-1 rounded-lg text-xs font-bold focus:outline-none"
          />
          <button
            onClick={() => adjustQuantity(item.id, 1)}
            className="w-8 h-8 bg-[var(--panel-bg)] hover:bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--text-color)] rounded-lg flex items-center justify-center font-bold text-base transition-colors border border-[var(--input-border)]"
          >+</button>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => openEditModal(item)}
            className="p-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 rounded-lg transition-colors border border-indigo-500/10"
            title="Edit details"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => handleDeleteItem(item.id, item.name)}
            className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors border border-red-500/10"
            title="Remove Stock"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function InventoryCard({ item, folders, adjustQuantity, openEditModal, handleDeleteItem, isGridView, t }) {
  const [isEditing, setIsEditing] = useState(false);
  const folderName = folders.find(f => f.id === item.folderId)?.name || t('uncategorized');

  if (!isGridView) {
    return (
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="glass-panel rounded-xl overflow-hidden shadow-sm relative"
      >
        <div className="flex items-center gap-3 p-2.5 pr-12">
          <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-[var(--input-bg)]">
            <img
              src={item.photoUrl}
              alt={item.name}
              className="w-full h-full object-cover"
              onError={e => { e.target.onerror = null; e.target.src = FALLBACK_IMG; }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-sm font-bold text-[var(--text-color)] truncate leading-tight">{item.name}</h3>
              <StockBadge item={item} />
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-[11px] text-[var(--text-muted)] truncate flex items-center gap-0.5">
                <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {item.location}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 font-semibold uppercase tracking-wide shrink-0">{folderName}</span>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[10px] text-[var(--text-muted-dark)] uppercase tracking-wide font-semibold">{t('inStock')}:</span>
              <span className="text-sm font-black text-[var(--text-color)]">{item.quantity}</span>
              <span className="text-[10px] text-[var(--text-muted)]">{t('units')}</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsEditing(!isEditing)}
          className={`absolute top-2 right-2 w-8 h-8 rounded-lg flex items-center justify-center transition-all border ${
            isEditing
              ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
              : 'bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--text-muted)] hover:text-[var(--text-color)]'
          }`}
        >
          {isEditing
            ? <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
            : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
          }
        </button>

        <AnimatePresence initial={false}>
          {isEditing && (
            <motion.div
              key="list-controls"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="mx-2.5 mb-2.5">
                <EditControls item={item} adjustQuantity={adjustQuantity} openEditModal={openEditModal} handleDeleteItem={handleDeleteItem} t={t} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="glass-panel rounded-2xl overflow-hidden shadow-lg hover:shadow-indigo-500/5 duration-300 flex flex-col relative"
    >
      <div className="h-44 bg-[var(--input-bg)] relative flex items-center justify-center overflow-hidden shrink-0">
        <img
          src={item.photoUrl}
          alt={item.name}
          className="w-full h-full object-cover"
          onError={e => { e.target.onerror = null; e.target.src = FALLBACK_IMG; }}
        />
        <div className="absolute top-3 right-3 px-2.5 py-1 bg-black/60 backdrop-blur-sm rounded-lg border border-white/10 text-[10px] uppercase font-bold tracking-wider text-indigo-300">
          {item.location}
        </div>
        {item.quantity === 0 && (
          <div className="absolute bottom-3 left-3 px-2 py-0.5 bg-red-600/80 backdrop-blur-sm rounded text-[9px] font-bold uppercase tracking-wide text-white border border-red-400/30">
            Out of Stock
          </div>
        )}
        {item.quantity > 0 && item.quantity <= (item.lowStockThreshold ?? 5) && (
          <div className="absolute bottom-3 left-3 px-2 py-0.5 bg-amber-500/80 backdrop-blur-sm rounded text-[9px] font-bold uppercase tracking-wide text-white border border-amber-400/30">
            Low Stock
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-between p-2">
        <div className="mb-2">
          <h3 className="text-base font-bold text-[var(--text-color)] mb-1 line-clamp-1">{item.name}</h3>
          <p className="text-xs text-[var(--text-muted)] flex items-center mb-1">
            <svg className="w-3.5 h-3.5 mr-1 text-[var(--text-muted-dark)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {item.location}
          </p>
          <span className="inline-block px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[10px] text-indigo-500 font-semibold uppercase tracking-wider">
            {folderName}
          </span>
        </div>

        <div className="flex flex-col border-t border-[var(--panel-border)] pt-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted-dark)] font-semibold block">{t('inStock')}</span>
              <span className="text-xl font-black text-[var(--text-color)]">{item.quantity} <span className="text-xs font-normal text-[var(--text-muted)]">{t('units')}</span></span>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                isEditing
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/10'
                  : 'bg-[var(--input-bg)] hover:bg-[var(--panel-bg)] border-[var(--input-border)] text-[var(--text-muted)]'
              }`}
            >
              {isEditing ? t('closeEdit') : t('editState')}
            </button>
          </div>

          <AnimatePresence initial={false}>
            {isEditing && (
              <motion.div
                initial={{ height: 0, opacity: 0, marginTop: 0 }}
                animate={{ height: 'auto', opacity: 1, marginTop: 12 }}
                exit={{ height: 0, opacity: 0, marginTop: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <EditControls item={item} adjustQuantity={adjustQuantity} openEditModal={openEditModal} handleDeleteItem={handleDeleteItem} t={t} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
