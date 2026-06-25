import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  collection, addDoc, updateDoc, doc,
  onSnapshot, query, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { useToast } from './Toast';

function TimelineEntry({ log }) {
  const date = log.timestamp?.toDate
    ? log.timestamp.toDate().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'Just now';

  const isPositive = String(log.action).startsWith('+');
  const isNegative = String(log.action).startsWith('-');
  const dotColor = isPositive ? 'bg-[var(--success)]' : isNegative ? 'bg-[var(--danger)]' : 'bg-[var(--primary)]';

  return (
    <div className="flex gap-3 relative">
      {/* Dot + line */}
      <div className="flex flex-col items-center shrink-0 pt-0.5">
        <div className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
        <div className="w-px flex-1 bg-[var(--border)] mt-1" />
      </div>
      {/* Content */}
      <div className="pb-4 min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-bold ${isPositive ? 'text-[var(--success)]' : isNegative ? 'text-[var(--danger)]' : 'text-[var(--primary)]'}`}>
            {log.action}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-2)] font-semibold">
            {log.quantity} units
          </span>
        </div>
        <div className="text-[10px] text-[var(--text-3)] mt-0.5 truncate">{log.operator}</div>
        <div className="text-[10px] text-[var(--text-3)] mt-0.5">{date}</div>
      </div>
    </div>
  );
}

export default function AddEditModal({ isOpen, onClose, editingItem, folders, user, activeFolderId, t }) {
  const toast = useToast();

  const [itemName, setItemName] = useState('');
  const [itemLocation, setItemLocation] = useState('');
  const [itemQuantity, setItemQuantity] = useState('');
  const [itemPhotoFile, setItemPhotoFile] = useState(null);
  const [itemPhotoUrl, setItemPhotoUrl] = useState('');
  const [itemFolderId, setItemFolderId] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState('');
  const [saving, setSaving] = useState(false);
  const [historyLogs, setHistoryLogs] = useState([]);

  useEffect(() => {
    if (!isOpen) return;
    if (editingItem) {
      setItemName(editingItem.name);
      setItemLocation(editingItem.location);
      setItemQuantity('');
      setItemPhotoFile(null);
      setItemPhotoUrl(editingItem.photoUrl || '');
      setItemFolderId(editingItem.folderId || '');
      setLowStockThreshold('');
    } else {
      setItemName('');
      setItemLocation('');
      setItemQuantity('');
      setItemPhotoFile(null);
      setItemPhotoUrl('');
      setItemFolderId(activeFolderId !== 'all' && activeFolderId !== 'uncategorized' ? activeFolderId : '');
      setLowStockThreshold('');
    }
  }, [isOpen, editingItem, activeFolderId]);

  useEffect(() => {
    if (!editingItem) { setHistoryLogs([]); return; }
    const historyRef = collection(db, 'inventory', editingItem.id, 'history');
    const q = query(historyRef, orderBy('timestamp', 'desc'));
    return onSnapshot(q, snap => setHistoryLogs(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [editingItem]);

  const logChange = async (itemId, quantity, action) => {
    await addDoc(collection(db, 'inventory', itemId, 'history'), {
      quantity: Number(quantity), timestamp: serverTimestamp(), operator: user.email, action,
    });
  };

  const uploadImage = async (file) => {
    const fileRef = ref(storage, `photos/${Date.now()}_${file.name}`);
    await uploadBytes(fileRef, file);
    return getDownloadURL(fileRef);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!itemName || !itemLocation) return;
    setSaving(true);
    try {
      let photoUrlToSave = itemPhotoUrl;
      if (itemPhotoFile) photoUrlToSave = await uploadImage(itemPhotoFile);

      const qtyToSave = itemQuantity !== '' ? Number(itemQuantity) : (editingItem?.quantity ?? 0);
      const thresholdToSave = lowStockThreshold !== '' ? Number(lowStockThreshold) : (editingItem?.lowStockThreshold ?? 5);

      const data = {
        name: itemName, location: itemLocation, quantity: qtyToSave,
        photoUrl: photoUrlToSave || '',
        folderId: itemFolderId, lowStockThreshold: thresholdToSave, uid: user.uid,
      };

      if (editingItem) {
        await updateDoc(doc(db, 'inventory', editingItem.id), data);
        await logChange(editingItem.id, qtyToSave, 'Details Modified');
        toast('Stock updated');
      } else {
        const newRef = await addDoc(collection(db, 'inventory'), data);
        await logChange(newRef.id, qtyToSave, 'SKU Registered');
        toast('Stock registered');
      }
      onClose();
    } catch (err) {
      console.error('Failed to save:', err);
      toast('Error saving stock', 'error');
    } finally {
      setSaving(false);
    }
  };

  const FieldLabel = ({ children }) => (
    <label className="block text-[10px] font-bold text-[var(--text-2)] uppercase tracking-wider mb-1.5">{children}</label>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/85 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.97, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.97, opacity: 0, y: 20 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col sm:flex-row max-h-[90dvh]"
            style={{ background: 'var(--surface-overlay)', border: '1px solid var(--border-strong)' }}
          >
            {/* Form panel */}
            <form onSubmit={handleSave} className="flex-1 flex flex-col overflow-y-auto">
              <div className="p-6 flex-1 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
                  <div>
                    <h2 className="text-sm font-bold text-[var(--text)]">
                      {editingItem ? t('editingStock') : t('registerSKU')}
                    </h2>
                    {editingItem && (
                      <p className="text-[11px] text-[var(--text-3)] mt-0.5">{editingItem.name}</p>
                    )}
                  </div>
                  <button type="button" onClick={onClose}
                    className="w-8 h-8 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-2)] hover:text-[var(--text)] flex items-center justify-center transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Name */}
                <div>
                  <FieldLabel>{t('itemName')}</FieldLabel>
                  <input id="modal-name-input" type="text" required placeholder={t('itemName')}
                    value={itemName} onChange={e => setItemName(e.target.value)}
                    className="field w-full px-4 py-2.5 text-sm" />
                </div>

                {/* Location */}
                <div>
                  <FieldLabel>{t('storageLocation')}</FieldLabel>
                  <input id="modal-location-input" type="text" required placeholder={t('storageLocation')}
                    value={itemLocation} onChange={e => setItemLocation(e.target.value)}
                    className="field w-full px-4 py-2.5 text-sm" />
                </div>

                {/* Qty + threshold */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FieldLabel>{t('quantity')}</FieldLabel>
                    <input id="modal-quantity-input" type="number" min="0"
                      placeholder={editingItem ? String(editingItem.quantity) : '0'}
                      value={itemQuantity} onChange={e => setItemQuantity(e.target.value)}
                      className="field w-full px-4 py-2.5 text-sm" />
                  </div>
                  <div>
                    <FieldLabel>{t('lowStockThreshold')}</FieldLabel>
                    <input type="number" min="0"
                      placeholder={editingItem ? String(editingItem.lowStockThreshold ?? 5) : '5'}
                      value={lowStockThreshold} onChange={e => setLowStockThreshold(e.target.value)}
                      className="field w-full px-4 py-2.5 text-sm" />
                  </div>
                </div>

                {/* Folder */}
                <div>
                  <FieldLabel>{t('associateFolder')}</FieldLabel>
                  <select id="modal-folder-select" value={itemFolderId}
                    onChange={e => setItemFolderId(e.target.value)}
                    className="field w-full px-4 py-2.5 text-sm">
                    <option value="">{t('uncategorized')}</option>
                    {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>

                {/* Photo */}
                <div>
                  <FieldLabel>{t('stockPhoto')}</FieldLabel>
                  <label className="flex items-center gap-3 p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] cursor-pointer hover:border-[var(--border-strong)] transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-[var(--text-3)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium text-[var(--text-2)] block">
                        {itemPhotoFile ? itemPhotoFile.name : itemPhotoUrl ? t('photoUrlActive') : 'Choose an image…'}
                      </span>
                      <span className="text-[10px] text-[var(--text-3)]">PNG, JPG, WEBP</span>
                    </div>
                    <input id="modal-photo-file" type="file" accept="image/*"
                      onChange={e => setItemPhotoFile(e.target.files[0])}
                      className="sr-only" />
                  </label>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 pt-0 flex gap-3 border-t border-[var(--border)]">
                <button type="button" onClick={onClose} className="btn-ghost flex-1 py-2.5 text-sm font-semibold">
                  {t('cancel')}
                </button>
                <button id="modal-submit-btn" type="submit" disabled={saving}
                  className="btn-primary flex-1 py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                  {saving && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                  {t('commitStock')}
                </button>
              </div>
            </form>

            {/* History panel */}
            <div className="w-full sm:w-64 border-t sm:border-t-0 sm:border-l border-[var(--border)] flex flex-col max-h-72 sm:max-h-none"
              style={{ background: 'var(--surface-raised)' }}>
              <div className="px-5 py-4 border-b border-[var(--border)]">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-2)]">{t('changeLogHistory')}</h3>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4">
                {!editingItem ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-6">
                    <div className="w-8 h-8 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] flex items-center justify-center mb-2">
                      <svg className="w-4 h-4 text-[var(--text-3)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-xs text-[var(--text-3)]">{t('createSKUToLog')}</p>
                  </div>
                ) : historyLogs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-6">
                    <p className="text-xs text-[var(--text-3)]">{t('noChangesLogged')}</p>
                  </div>
                ) : (
                  <div>
                    {historyLogs.map((log, i) => (
                      <div key={log.id} className={i === historyLogs.length - 1 ? '[&>div>div:last-child]:hidden' : ''}>
                        <TimelineEntry log={log} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
