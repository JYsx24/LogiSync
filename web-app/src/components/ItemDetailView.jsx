import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

function StockChart({ itemId, t }) {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    if (!itemId) return;
    const q = query(collection(db, 'inventory', itemId, 'history'), orderBy('timestamp', 'asc'));
    return onSnapshot(q, snap => {
      const data = snap.docs.map(d => {
        const ts = d.data().timestamp;
        const date = ts?.toDate ? ts.toDate() : new Date();
        return {
          time: date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          quantity: Number(d.data().quantity) || 0,
          rawTime: date.getTime(),
        };
      });
      setLogs(data.slice(-20));
    });
  }, [itemId]);

  if (logs.length < 2) {
    return (
      <div className="h-40 flex items-center justify-center text-sm text-[var(--text-3)]">
        {t('noHistoryYet')}
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={160}>
      <AreaChart data={logs} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
        <defs>
          <linearGradient id="stockGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.28} />
            <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="time" tick={{ fill: 'var(--text-3)', fontSize: 9 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
        <YAxis tick={{ fill: 'var(--text-3)', fontSize: 9 }} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{ background: 'var(--surface-overlay)', border: '1px solid var(--border-strong)', borderRadius: 10, fontSize: 11, color: 'var(--text)' }}
          cursor={{ stroke: 'var(--primary)', strokeWidth: 1, strokeDasharray: '3 3' }}
          formatter={val => [`${val} ${t('units')}`, t('stockChartLabel')]}
        />
        <Area type="monotone" dataKey="quantity" stroke="#14b8a6" strokeWidth={2.5}
          fill="url(#stockGrad)" dot={false} activeDot={{ r: 4, fill: '#14b8a6' }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function ItemPhoto({ src, alt }) {
  const [failed, setFailed] = useState(false);
  if (src && !failed) {
    return <img src={src} alt={alt} className="w-full h-full object-cover" onError={() => setFailed(true)} />;
  }
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--surface-raised)] to-[var(--surface)]">
      <svg className="w-20 h-20 opacity-20 text-[var(--text)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    </div>
  );
}

export default function ItemDetailView({ item, folders, adjustQuantity, openEditModal, onBack, t }) {
  const [pendingDelta, setPendingDelta] = useState(0);
  const folderName = folders.find(f => f.id === item.folderId)?.name;
  const pendingQty = item.quantity + pendingDelta;
  const threshold = item.lowStockThreshold ?? 5;

  const isOut  = pendingQty === 0;
  const isLow  = !isOut && pendingQty <= threshold;
  const statusColor  = isOut ? 'var(--danger)'  : isLow ? 'var(--warning)'  : 'var(--success)';
  const statusBg     = isOut ? 'var(--danger-bg)': isLow ? 'var(--warning-bg)': 'var(--success-bg)';
  const statusBorder = isOut ? 'var(--danger-border)': isLow ? 'var(--warning-border)': 'var(--success-border)';
  const statusText   = isOut ? t('statOutOfStock') : isLow ? t('statLowStock') : t('inStock');

  const handleConfirm = () => {
    if (pendingDelta !== 0) {
      adjustQuantity(item.id, 0, pendingQty);
      setPendingDelta(0);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <button onClick={onBack} className="text-[var(--text-3)] hover:text-[var(--text)] transition-colors">
          {t('inventoryBreadcrumb')}
        </button>
        <svg className="w-3.5 h-3.5 text-[var(--text-3)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-[var(--text)] font-medium">{item.name}</span>
      </div>

      <h1 className="text-2xl font-bold text-[var(--text)]">{t('itemDetails')}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Photo */}
        <div className="rounded-2xl overflow-hidden aspect-[4/3] lg:aspect-auto lg:min-h-[400px] glass">
          <ItemPhoto src={item.photoUrl} alt={item.name} />
        </div>

        {/* Details panel */}
        <div className="flex flex-col gap-4">
          {/* Title + SKU */}
          <div>
            <h2 className="text-3xl font-black text-[var(--text)]">{item.name}</h2>
            {item.sku && <p className="text-sm text-[var(--text-3)] mt-1">SKU: {item.sku}</p>}
          </div>

          {/* Meta chips */}
          <div className="flex flex-wrap gap-3">
            {folderName && (
              <div className="glass rounded-xl px-4 py-2.5">
                <p className="text-[9px] font-bold text-[var(--text-3)] uppercase tracking-wider mb-0.5">{t('category')}</p>
                <p className="text-sm font-bold text-[var(--text)]">{folderName}</p>
              </div>
            )}
            <div className="glass rounded-xl px-4 py-2.5">
              <p className="text-[9px] font-bold text-[var(--text-3)] uppercase tracking-wider mb-0.5">{t('storageLocation')}</p>
              <p className="text-sm font-bold text-[var(--text)]">{item.location || '—'}</p>
            </div>
            {item.price != null && item.price !== '' && (
              <div className="glass rounded-xl px-4 py-2.5">
                <p className="text-[9px] font-bold text-[var(--text-3)] uppercase tracking-wider mb-0.5">{t('price')}</p>
                <p className="text-sm font-bold text-[var(--primary)]">${Number(item.price).toFixed(2)}</p>
              </div>
            )}
          </div>

          {/* Current Stock */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-[var(--text-2)]">{t('currentStockLabel')}</p>
              <span className={`text-3xl font-black ${pendingDelta !== 0 ? 'text-[var(--primary)]' : 'text-[var(--text)]'}`}>
                {pendingQty}
              </span>
            </div>

            {/* Threshold + status chips */}
            <div className="grid grid-cols-2 gap-2.5 mb-4">
              {/* Alert threshold */}
              <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
                style={{ background: 'var(--warning-bg)', border: '1px solid var(--warning-border)' }}>
                <svg className="w-4 h-4 shrink-0" style={{ color: 'var(--warning)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-wider truncate" style={{ color: 'var(--warning)' }}>
                    {t('lowStockThreshold')}
                  </p>
                  <p className="text-base font-black tabular-nums leading-tight" style={{ color: 'var(--warning)' }}>
                    {threshold} <span className="text-xs font-semibold">{t('units')}</span>
                  </p>
                </div>
              </div>

              {/* Live status */}
              <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
                style={{ background: statusBg, border: `1px solid ${statusBorder}` }}>
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: statusColor }} />
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: statusColor }}>
                    {t('stockStatus')}
                  </p>
                  <p className="text-base font-black leading-tight" style={{ color: statusColor }}>
                    {statusText}
                  </p>
                </div>
              </div>
            </div>

            {/* Stepper */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPendingDelta(d => Math.max(d - 1, -item.quantity))}
                className="w-9 h-9 rounded-xl border border-[var(--border-strong)] bg-[var(--input-bg)] text-[var(--text-2)] hover:text-[var(--text)] flex items-center justify-center text-lg font-bold transition-colors">
                −
              </button>
              <div className="flex-1 text-center">
                {pendingDelta !== 0 && (
                  <span className={`text-xs font-semibold ${pendingDelta > 0 ? 'text-emerald-500' : 'text-[var(--danger)]'}`}>
                    {pendingDelta > 0 ? `+${pendingDelta}` : `${pendingDelta}`} {t('pendingLabel')}
                  </span>
                )}
              </div>
              <button
                onClick={() => setPendingDelta(d => d + 1)}
                className="w-9 h-9 rounded-xl border border-[var(--border-strong)] bg-[var(--input-bg)] text-[var(--text-2)] hover:text-[var(--text)] flex items-center justify-center text-lg font-bold transition-colors">
                +
              </button>
            </div>

            {pendingDelta !== 0 && (
              <div className="flex gap-2 mt-3">
                <button onClick={handleConfirm}
                  className="flex-1 py-2 rounded-xl text-sm font-bold btn-primary flex items-center justify-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                  {t('confirm')}
                </button>
                <button onClick={() => setPendingDelta(0)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold btn-ghost">
                  {t('cancel')}
                </button>
              </div>
            )}
          </div>

          {/* Stock History */}
          <div className="glass rounded-2xl p-5">
            <p className="text-sm font-semibold text-[var(--text-2)] mb-4">{t('stockHistory')}</p>
            <StockChart itemId={item.id} t={t} />
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button onClick={() => openEditModal(item)}
              className="flex-1 btn-primary py-3 text-sm font-bold flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              {t('editItem')}
            </button>
            <button
              className="flex-1 py-3 text-sm font-bold rounded-xl border border-[var(--border-strong)] text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-raised)] transition-colors flex items-center justify-center gap-2"
              onClick={() => openEditModal(item)}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              {t('transferStock')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
