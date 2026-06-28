import React from 'react';

interface Props {
  label: string;
  value: boolean | null | undefined;
  className?: string;
}

export function StatusRow({ label, value, className = "" }: Props) {
  if (value === null || value === undefined) return null;
  
  return (
    <div className={`flex justify-between items-center text-xs ${className}`}>
      <span className="text-gray-500">{label}</span>
      <div className={`flex items-center gap-1 font-bold ${value ? 'text-emerald-400' : 'text-rose-500/80'}`}>
        <span className="text-[10px]">{value ? '✓' : '✗'}</span>
        <span className="uppercase tracking-tighter">{value ? 'Yes' : 'No'}</span>
      </div>
    </div>
  );
}
