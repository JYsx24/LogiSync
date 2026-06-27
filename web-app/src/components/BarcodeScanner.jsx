import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { motion, AnimatePresence } from 'framer-motion';

export default function BarcodeScanner({ onClose, items, onOpenItem, onAddWithSku, t }) {
  const scannerRef = useRef(null);
  const html5QrcodeRef = useRef(null);
  const [status, setStatus] = useState('scanning'); // 'scanning' | 'found' | 'notfound' | 'error'
  const [scannedCode, setScannedCode] = useState('');
  const [foundItem, setFoundItem] = useState(null);
  const [cameraError, setCameraError] = useState('');

  useEffect(() => {
    const scanner = new Html5Qrcode('qr-reader');
    html5QrcodeRef.current = scanner;

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 180 } },
      (decodedText) => {
        scanner.stop().catch(() => {});
        const code = decodedText.trim();
        setScannedCode(code);
        const match = items.find(i =>
          (i.sku && i.sku.toLowerCase() === code.toLowerCase()) ||
          i.name.toLowerCase() === code.toLowerCase()
        );
        if (match) {
          setFoundItem(match);
          setStatus('found');
        } else {
          setStatus('notfound');
        }
      },
      () => {},
    ).catch(err => {
      setCameraError(String(err));
      setStatus('error');
    });

    return () => {
      scanner.stop().catch(() => {});
    };
  }, [items]);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/85 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.97, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.97, opacity: 0, y: 20 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden"
          style={{ background: 'var(--surface-overlay)', border: '1px solid var(--border-strong)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
            <div>
              <h2 className="text-sm font-bold text-[var(--text)]">{t('scanBarcode')}</h2>
              <p className="text-[11px] text-[var(--text-3)] mt-0.5">{t('scanBarcodeHint')}</p>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-2)] flex items-center justify-center hover:text-[var(--text)] transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Camera / Result */}
          <div className="p-5 flex flex-col gap-4">
            {/* Camera view — always rendered so html5-qrcode can attach */}
            <div
              id="qr-reader"
              ref={scannerRef}
              className={status === 'scanning' ? 'rounded-xl overflow-hidden' : 'hidden'}
              style={{ minHeight: 240 }}
            />

            {status === 'scanning' && (
              <p className="text-center text-xs text-[var(--text-3)]">{t('scanningLabel')}</p>
            )}

            {status === 'error' && (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-[var(--danger-bg)] flex items-center justify-center">
                  <svg className="w-6 h-6 text-[var(--danger)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-[var(--text)]">{t('cameraError')}</p>
                <p className="text-xs text-[var(--text-3)] max-w-xs">{cameraError || t('cameraErrorHint')}</p>
                <button onClick={onClose} className="btn-ghost px-5 py-2 text-sm font-semibold mt-1">{t('cancel')}</button>
              </div>
            )}

            {status === 'found' && foundItem && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--success-bg,#052e16)]">
                  <svg className="w-4 h-4 text-[var(--success)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-xs font-semibold text-[var(--success)]">{t('itemFound')}</span>
                </div>

                <div className="rounded-xl p-4 flex items-center gap-3"
                  style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)' }}>
                  {foundItem.photoUrl ? (
                    <img src={foundItem.photoUrl} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-[var(--input-bg)] flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-[var(--text-3)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[var(--text)] truncate">{foundItem.name}</p>
                    {foundItem.sku && <p className="text-[11px] text-[var(--text-3)] font-mono mt-0.5">{foundItem.sku}</p>}
                    <p className="text-xs text-[var(--text-2)] mt-1">{foundItem.quantity} {t('units')}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => { onClose(); onOpenItem(foundItem); }}
                    className="btn-primary flex-1 py-2.5 text-sm font-semibold">
                    {t('openItem')}
                  </button>
                  <button onClick={onClose} className="btn-ghost flex-1 py-2.5 text-sm font-semibold">
                    {t('cancel')}
                  </button>
                </div>
              </div>
            )}

            {status === 'notfound' && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--surface-raised)]">
                  <svg className="w-4 h-4 text-[var(--text-3)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs font-semibold text-[var(--text-2)]">{t('noItemFound')}</span>
                </div>

                <div className="rounded-xl p-3" style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)' }}>
                  <p className="text-[10px] text-[var(--text-3)] uppercase tracking-wider font-bold mb-1">{t('scannedCode')}</p>
                  <p className="text-sm font-mono text-[var(--text)] break-all">{scannedCode}</p>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => { onClose(); onAddWithSku(scannedCode); }}
                    className="btn-primary flex-1 py-2.5 text-sm font-semibold">
                    {t('addNewItem')}
                  </button>
                  <button onClick={onClose} className="btn-ghost flex-1 py-2.5 text-sm font-semibold">
                    {t('cancel')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
