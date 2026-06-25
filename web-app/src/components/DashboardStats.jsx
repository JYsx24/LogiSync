import React from 'react';

const STATS_CONFIG = [
  {
    key: 'skus',
    labelKey: 'statTotalSKUs',
    color: 'text-[#14b8a6]',
    iconBg: 'bg-teal-500/12 border-teal-500/20',
    icon: (
      <svg className="w-4 h-4 text-[#14b8a6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    key: 'units',
    labelKey: 'statTotalUnits',
    color: 'text-sky-400',
    iconBg: 'bg-sky-500/12 border-sky-500/20',
    icon: (
      <svg className="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    key: 'low',
    labelKey: 'statLowStock',
    color: 'text-amber-400',
    iconBg: 'bg-amber-500/12 border-amber-500/20',
    icon: (
      <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  {
    key: 'out',
    labelKey: 'statOutOfStock',
    color: 'text-rose-400',
    iconBg: 'bg-rose-500/12 border-rose-500/20',
    icon: (
      <svg className="w-4 h-4 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
    ),
  },
];

export default function DashboardStats({ items, compact = false, t }) {
  const values = {
    skus: items.length,
    units: items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0),
    low: items.filter(i => i.quantity > 0 && i.quantity <= (i.lowStockThreshold ?? 5)).length,
    out: items.filter(i => i.quantity === 0).length,
  };

  if (compact) {
    return (
      <div className="glass rounded-xl px-4 py-2.5 flex items-center gap-1">
        {STATS_CONFIG.map((stat, i) => (
          <React.Fragment key={stat.key}>
            {i > 0 && <div className="w-px h-5 bg-[var(--border-strong)] mx-3" />}
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 ${stat.iconBg}`}>
                {stat.icon}
              </div>
              <span className={`text-sm font-black leading-none ${stat.color}`}>{values[stat.key]}</span>
              <span className="text-[10px] text-[var(--text-3)] font-semibold uppercase tracking-wider hidden sm:block">{t(stat.labelKey)}</span>
            </div>
          </React.Fragment>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {STATS_CONFIG.map(stat => (
        <div key={stat.key} className="glass rounded-2xl p-5 relative flex flex-col gap-3">
          <div className={`w-9 h-9 rounded-xl border flex items-center justify-center self-start ${stat.iconBg}`}>
            {stat.icon}
          </div>
          <div>
            <div className={`text-3xl font-black leading-none tracking-tight ${stat.color}`}>
              {values[stat.key]}
            </div>
            <div className="text-[11px] text-[var(--text-3)] font-medium mt-1.5 uppercase tracking-wider">
              {t(stat.labelKey)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
