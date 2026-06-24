import React from 'react';

const STATS_CONFIG = [
  {
    key: 'skus',
    label: 'Total SKUs',
    color: 'text-indigo-400',
    iconBg: 'bg-indigo-500/15 border-indigo-500/20',
    icon: (
      <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    key: 'units',
    label: 'Total Units',
    color: 'text-violet-400',
    iconBg: 'bg-violet-500/15 border-violet-500/20',
    icon: (
      <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    key: 'low',
    label: 'Low Stock',
    color: 'text-amber-400',
    iconBg: 'bg-amber-500/15 border-amber-500/20',
    icon: (
      <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  {
    key: 'out',
    label: 'Out of Stock',
    color: 'text-red-400',
    iconBg: 'bg-red-500/15 border-red-500/20',
    icon: (
      <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
    ),
  },
];

export default function DashboardStats({ items }) {
  const values = {
    skus: items.length,
    units: items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0),
    low: items.filter(i => i.quantity > 0 && i.quantity <= (i.lowStockThreshold ?? 5)).length,
    out: items.filter(i => i.quantity === 0).length,
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {STATS_CONFIG.map(stat => (
        <div key={stat.key} className="glass rounded-2xl p-4 flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${stat.iconBg}`}>
            {stat.icon}
          </div>
          <div>
            <div className={`text-xl font-black leading-none ${stat.color}`}>{values[stat.key]}</div>
            <div className="text-[10px] text-[var(--text-3)] font-semibold mt-0.5 leading-tight">{stat.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
