import React from 'react';

export default function DashboardStats({ items }) {
  const totalSkus = items.length;
  const totalUnits = items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
  const lowStock = items.filter(i => i.quantity > 0 && i.quantity <= (i.lowStockThreshold ?? 5)).length;
  const outOfStock = items.filter(i => i.quantity === 0).length;

  const stats = [
    { label: 'Total SKUs',    value: totalSkus,   color: 'text-indigo-400',  bg: 'bg-indigo-500/10' },
    { label: 'Total Units',   value: totalUnits,  color: 'text-violet-400',  bg: 'bg-violet-500/10' },
    { label: 'Low Stock',     value: lowStock,    color: 'text-amber-400',   bg: 'bg-amber-500/10'  },
    { label: 'Out of Stock',  value: outOfStock,  color: 'text-red-400',     bg: 'bg-red-500/10'    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map(stat => (
        <div key={stat.label} className={`glass-panel rounded-xl p-3 text-center border border-[var(--panel-border)] ${stat.bg}`}>
          <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
          <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold mt-0.5">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
