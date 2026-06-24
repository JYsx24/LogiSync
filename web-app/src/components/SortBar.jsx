import React from 'react';

const SORT_OPTIONS = [
  { value: 'name-asc',  label: 'Name A→Z'     },
  { value: 'name-desc', label: 'Name Z→A'     },
  { value: 'qty-desc',  label: 'Qty High→Low' },
  { value: 'qty-asc',   label: 'Qty Low→High' },
];

export default function SortBar({ sortKey, setSortKey }) {
  return (
    <select
      value={sortKey}
      onChange={e => setSortKey(e.target.value)}
      className="field px-3 py-2 rounded-xl text-xs font-medium cursor-pointer"
    >
      {SORT_OPTIONS.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}

export function applySort(items, sortKey) {
  const arr = [...items];
  switch (sortKey) {
    case 'name-asc':  return arr.sort((a, b) => a.name.localeCompare(b.name));
    case 'name-desc': return arr.sort((a, b) => b.name.localeCompare(a.name));
    case 'qty-asc':   return arr.sort((a, b) => a.quantity - b.quantity);
    case 'qty-desc':  return arr.sort((a, b) => b.quantity - a.quantity);
    default:          return arr;
  }
}
