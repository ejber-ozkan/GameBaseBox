import React from 'react';
import { useTranslation } from '../i18n/I18nContext';

interface Props {
  label: string;
  value: boolean | null | undefined;
  className?: string;
}

export function StatusRow({ label, value, className = "" }: Props) {
  const { t } = useTranslation();
  if (value === null || value === undefined) return null;
  
  return (
    <div className={`flex justify-between items-center text-xs ${className}`}>
      <span className="text-gray-500">{label}</span>
      <div className={`flex items-center gap-1 font-bold ${value ? 'text-emerald-400' : 'text-rose-500/80'}`}>
        <span className="text-[10px]">{value ? '✓' : '✗'}</span>
        <span className="uppercase tracking-tighter">{value ? t('common.yes') : t('common.no')}</span>
      </div>
    </div>
  );
}
