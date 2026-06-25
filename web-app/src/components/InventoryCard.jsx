import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function ItemPhoto({ src, alt, className }) {
  const [failed, setFailed] = useState(false);
  if (src && !failed) {
    return (
      <img
        src={src} alt={alt}
        className={className}
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <div className="w-full h-full flex items-center justify-center">
      <svg className="w-10 h-10 opacity-40 text-[var(--text)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    </div>
  );
}

function StockBadge({ item }) {
  const threshold = item.lowStockThreshold ?? 5;
  if (item.quantity === 0) {
    return <span className="badge-danger px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wide">Out of Stock</span>;
  }
  if (item.quantity <= threshold) {
    return <span className="badge-warning px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wide">Low Stock</span>;
  }
  return null;
}

function StockBar({ item }) {
  const threshold = item.lowStockThreshold ?? 5;
  const max = Math.max(threshold * 3, item.quantity, 1);
  const pct = Math.min(100, (item.quantity / max) * 100);
  const barClass = item.quantity === 0 ? 'stock-bar-empty' : item.quantity <= threshold ? 'stock-bar-low' : 'stock-bar-healthy';

  return (
    <div className="w-full h-1 bg-[var(--border-strong)] rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-500 ${barClass}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function EditControls({ item, adjustQuantity, openEditModal, handleDeleteItem }) {
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
    <div className="bg-[var(--surface-raised)] rounded-xl p-3 border border-[var(--border-strong)] space-y-2.5">
      {/* Qty stepper */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => adjustQuantity(item.id, -1)}
          className="w-8 h-8 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-2)] hover:text-[var(--text)] hover:border-[var(--border-strong)] flex items-center justify-center text-base font-bold transition-colors"
        >−</button>
        <input
          type="number" min="0"
          placeholder={String(item.quantity)}
          value={directQty}
          onChange={e => setDirectQty(e.target.value)}
          onBlur={commitDirectQty}
          onKeyDown={e => e.key === 'Enter' && commitDirectQty()}
          className="field flex-1 text-center px-2 py-1.5 rounded-xl text-sm font-bold"
        />
        <button
          onClick={() => adjustQuantity(item.id, 1)}
          className="w-8 h-8 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-2)] hover:text-[var(--text)] hover:border-[var(--border-strong)] flex items-center justify-center text-base font-bold transition-colors"
        >+</button>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => openEditModal(item)}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-semibold bg-[var(--primary-glow)] text-[var(--primary)] border border-[var(--primary)]/20 hover:bg-teal-500/20 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit
        </button>
        <button
          onClick={() => handleDeleteItem(item.id, item.name)}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-semibold bg-[var(--danger-bg)] text-[var(--danger)] border border-[var(--danger-border)] hover:bg-red-500/20 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Delete
        </button>
      </div>
    </div>
  );
}

export default function InventoryCard({ item, folders, adjustQuantity, openEditModal, handleDeleteItem, isGridView, t }) {
  const [isEditing, setIsEditing] = useState(false);
  const folderName = folders.find(f => f.id === item.folderId)?.name;

  /* ── List view ── */
  if (!isGridView) {
    return (
      <motion.div layout transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="glass rounded-xl overflow-hidden relative"
        style={{ borderColor: 'var(--border-strong)' }}
      >
        <div className="flex items-center gap-3 p-3 pr-12">
          {/* Thumb */}
          <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-[var(--surface-raised)]">
            <ItemPhoto src={item.photoUrl} alt={item.name} className="w-full h-full object-cover" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-[var(--text)] leading-tight truncate">{item.name}</h3>
              <StockBadge item={item} />
            </div>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="text-[11px] text-[var(--text-2)] flex items-center gap-1">
                <svg className="w-3 h-3 shrink-0 text-[var(--text-3)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {item.location}
              </span>
              {folderName && (
                <span className="text-[10px] px-2 py-0.5 rounded-lg bg-[var(--primary-glow)] border border-[var(--primary)]/15 text-[var(--primary)] font-semibold">
                  {folderName}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-sm font-black text-[var(--text)]">{item.quantity}</span>
              <span className="text-[11px] text-[var(--text-3)]">{t('units')}</span>
              <StockBar item={item} />
            </div>
          </div>
        </div>

        {/* Edit toggle */}
        <button
          onClick={() => setIsEditing(!isEditing)}
          className={`absolute top-3 right-3 w-8 h-8 rounded-xl flex items-center justify-center transition-all border ${
            isEditing ? 'bg-[var(--primary)] border-[var(--primary)] text-white shadow-md' : 'bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--text-3)] hover:text-[var(--text)]'
          }`}
        >
          {isEditing
            ? <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
            : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
          }
        </button>

        <AnimatePresence initial={false}>
          {isEditing && (
            <motion.div key="list-ctrl" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden">
              <div className="mx-3 mb-3">
                <EditControls item={item} adjustQuantity={adjustQuantity} openEditModal={openEditModal} handleDeleteItem={handleDeleteItem} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  /* ── Grid view ── */
  return (
    <motion.div layout transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="glass rounded-2xl overflow-hidden flex flex-col transition-colors duration-300"
      style={{ borderColor: 'var(--border-strong)' }}
    >
      {/* Photo */}
      <div className="h-44 relative overflow-hidden shrink-0" style={{ background: 'var(--surface-raised)' }}>
        <ItemPhoto src={item.photoUrl} alt={item.name} className="w-full h-full object-cover" />
        {/* Location pill */}
        <div className="absolute top-2.5 right-2.5 px-2.5 py-1 bg-black/55 backdrop-blur-sm rounded-lg border border-white/10 text-[10px] font-bold tracking-wide text-white/85 max-w-[60%] truncate">
          {item.location}
        </div>
        {/* Stock alert overlay */}
        {item.quantity === 0 && (
          <div className="absolute bottom-2.5 left-2.5 px-2 py-1 bg-red-600/85 backdrop-blur-sm rounded-lg border border-red-400/30 text-[9px] font-bold uppercase tracking-wide text-white">
            Out of Stock
          </div>
        )}
        {item.quantity > 0 && item.quantity <= (item.lowStockThreshold ?? 5) && (
          <div className="absolute bottom-2.5 left-2.5 px-2 py-1 bg-amber-500/85 backdrop-blur-sm rounded-lg border border-amber-400/30 text-[9px] font-bold uppercase tracking-wide text-white">
            Low Stock
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col p-4 gap-3">
        <div>
          <h3 className="text-sm font-bold text-[var(--text)] leading-snug mb-1 line-clamp-1">{item.name}</h3>
          {folderName && (
            <span className="inline-block px-2 py-0.5 rounded-lg bg-[var(--primary-glow)] border border-[var(--primary)]/15 text-[10px] text-[var(--primary)] font-semibold">
              {folderName}
            </span>
          )}
        </div>

        {/* Qty + bar */}
        <div className="mt-auto pt-3 border-t border-[var(--border)] space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-[var(--text-3)] font-semibold block">{t('inStock')}</span>
              <span className="text-xl font-black text-[var(--text)]">{item.quantity} <span className="text-xs font-normal text-[var(--text-3)]">{t('units')}</span></span>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                isEditing
                  ? 'bg-[var(--primary)] border-[var(--primary)] text-white shadow-md'
                  : 'btn-ghost'
              }`}
            >
              {isEditing ? t('closeEdit') : t('editState')}
            </button>
          </div>
          <StockBar item={item} />
        </div>

        {/* Edit controls */}
        <AnimatePresence initial={false}>
          {isEditing && (
            <motion.div key="grid-ctrl" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
              <EditControls item={item} adjustQuantity={adjustQuantity} openEditModal={openEditModal} handleDeleteItem={handleDeleteItem} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
