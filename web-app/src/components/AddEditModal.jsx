import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  collection, addDoc, updateDoc, doc,
  onSnapshot, query, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { useToast } from './Toast';

export default function AddEditModal({ isOpen, onClose, editingItem, folders, user, activeFolderId, t }) {
  const toast = useToast();

  const [itemName, setItemName] = useState('');
  const [itemLocation, setItemLocation] = useState('');
  const [itemQuantity, setItemQuantity] = useState(0);
  const [itemPhotoFile, setItemPhotoFile] = useState(null);
  const [itemPhotoUrl, setItemPhotoUrl] = useState('');
  const [itemFolderId, setItemFolderId] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  const [saving, setSaving] = useState(false);
  const [historyLogs, setHistoryLogs] = useState([]);

  useEffect(() => {
    if (!isOpen) return;
    if (editingItem) {
      setItemName(editingItem.name);
      setItemLocation(editingItem.location);
      setItemQuantity(editingItem.quantity);
      setItemPhotoFile(null);
      setItemPhotoUrl(editingItem.photoUrl || '');
      setItemFolderId(editingItem.folderId || '');
      setLowStockThreshold(editingItem.lowStockThreshold ?? 5);
    } else {
      setItemName('');
      setItemLocation('');
      setItemQuantity(0);
      setItemPhotoFile(null);
      setItemPhotoUrl('');
      setItemFolderId(activeFolderId !== 'all' && activeFolderId !== 'uncategorized' ? activeFolderId : '');
      setLowStockThreshold(5);
    }
  }, [isOpen, editingItem, activeFolderId]);

  useEffect(() => {
    if (!editingItem) { setHistoryLogs([]); return; }
    const historyRef = collection(db, 'inventory', editingItem.id, 'history');
    const q = query(historyRef, orderBy('timestamp', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setHistoryLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [editingItem]);

  const logChange = async (itemId, quantity, action) => {
    await addDoc(collection(db, 'inventory', itemId, 'history'), {
      quantity: Number(quantity),
      timestamp: serverTimestamp(),
      operator: user.email,
      action,
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

      const data = {
        name: itemName,
        location: itemLocation,
        quantity: Number(itemQuantity),
        photoUrl: photoUrlToSave || 'https://images.unsplash.com/photo-1553413719-8758712747d5?auto=format&fit=crop&w=300&q=80',
        folderId: itemFolderId,
        lowStockThreshold: Number(lowStockThreshold),
        uid: user.uid,
      };

      if (editingItem) {
        await updateDoc(doc(db, 'inventory', editingItem.id), data);
        await logChange(editingItem.id, itemQuantity, 'Details Modified');
        toast('Stock updated');
      } else {
        const newRef = await addDoc(collection(db, 'inventory'), data);
        await logChange(newRef.id, itemQuantity, 'SKU Registered');
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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-[var(--panel-border)] flex flex-col md:flex-row"
            style={{ background: 'var(--modal-bg)' }}
          >
            {/* Form */}
            <form onSubmit={handleSave} className="p-6 space-y-4 flex-1">
              <div className="pb-3 border-b border-[var(--panel-border)]">
                <h2 className="text-base font-bold text-[var(--text-color)]">
                  {editingItem ? t('editingStock') : t('registerSKU')}
                </h2>
              </div>

              <div className="space-y-3">
                {[
                  { id: 'modal-name-input', label: t('itemName'), type: 'text', value: itemName, onChange: e => setItemName(e.target.value), placeholder: t('itemName'), required: true },
                  { id: 'modal-location-input', label: t('storageLocation'), type: 'text', value: itemLocation, onChange: e => setItemLocation(e.target.value), placeholder: t('storageLocation'), required: true },
                ].map(field => (
                  <div key={field.id}>
                    <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">{field.label}</label>
                    <input
                      id={field.id}
                      type={field.type}
                      required={field.required}
                      placeholder={field.placeholder}
                      value={field.value}
                      onChange={field.onChange}
                      className="w-full glass-input px-4 py-2 rounded-lg text-[var(--text-color)] placeholder-[var(--text-muted)] focus:outline-none text-sm"
                    />
                  </div>
                ))}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">{t('quantity')}</label>
                    <input
                      id="modal-quantity-input"
                      type="number"
                      required
                      min="0"
                      value={itemQuantity}
                      onChange={e => setItemQuantity(e.target.value)}
                      className="w-full glass-input px-4 py-2 rounded-lg text-[var(--text-color)] focus:outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">{t('lowStockThreshold')}</label>
                    <input
                      type="number"
                      min="0"
                      value={lowStockThreshold}
                      onChange={e => setLowStockThreshold(e.target.value)}
                      className="w-full glass-input px-4 py-2 rounded-lg text-[var(--text-color)] focus:outline-none text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">{t('associateFolder')}</label>
                  <select
                    id="modal-folder-select"
                    value={itemFolderId}
                    onChange={e => setItemFolderId(e.target.value)}
                    className="w-full glass-input px-4 py-2 rounded-lg text-[var(--text-color)] bg-[var(--input-bg)] focus:outline-none text-sm"
                  >
                    <option value="">{t('uncategorized')}</option>
                    {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">{t('stockPhoto')}</label>
                  <input
                    id="modal-photo-file"
                    type="file"
                    accept="image/*"
                    onChange={e => setItemPhotoFile(e.target.files[0])}
                    className="w-full text-xs text-[var(--text-muted)] file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-[var(--input-bg)] file:text-[var(--text-color)] hover:file:bg-[var(--panel-bg)] file:cursor-pointer"
                  />
                  {itemPhotoUrl && !itemPhotoFile && (
                    <div className="text-[10px] text-[var(--text-muted-dark)] mt-1">{t('photoUrlActive')}</div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--panel-border)] flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2 bg-[var(--input-bg)] hover:bg-[var(--panel-bg)] text-[var(--text-muted)] font-semibold rounded-lg text-sm transition-colors border border-[var(--input-border)]"
                >
                  {t('cancel')}
                </button>
                <button
                  id="modal-submit-btn"
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-800 text-white font-semibold rounded-lg text-sm shadow-lg shadow-indigo-500/15 transition-colors flex items-center justify-center"
                >
                  {saving
                    ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : t('commitStock')}
                </button>
              </div>
            </form>

            {/* History sidebar */}
            <div className="w-full md:w-72 bg-[var(--input-bg)] border-t md:border-t-0 md:border-l border-[var(--panel-border)] p-6 flex flex-col">
              <div className="flex justify-between items-center pb-3 border-b border-[var(--panel-border)] mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">{t('changeLogHistory')}</h3>
                <button onClick={onClose} className="text-[var(--text-muted-dark)] hover:text-[var(--text-color)]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {!editingItem ? (
                <div className="flex-1 flex items-center justify-center text-center text-[var(--text-muted-dark)] text-xs py-8">
                  {t('createSKUToLog')}
                </div>
              ) : historyLogs.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-center text-[var(--text-muted)] text-xs py-8">
                  {t('noChangesLogged')}
                </div>
              ) : (
                <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                  {historyLogs.map(log => {
                    const logDate = log.timestamp?.toDate
                      ? log.timestamp.toDate().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                      : 'Just Now';
                    return (
                      <div key={log.id} className="p-3 bg-[var(--panel-bg)] rounded-xl border border-[var(--panel-border)] text-[11px] space-y-1">
                        <div className="flex items-center justify-between text-indigo-500 font-bold">
                          <span>{log.action}</span>
                          <span className="text-[var(--text-color)] bg-indigo-500/20 px-1.5 py-0.5 rounded text-[9px]">{log.quantity} Qty</span>
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)] truncate">By: {log.operator}</div>
                        <div className="text-[9px] text-[var(--text-muted-dark)] text-right">{logDate}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
