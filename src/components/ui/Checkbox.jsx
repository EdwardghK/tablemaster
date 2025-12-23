// src/components/ui/checkbox.jsx
import React from 'react';
import { cn } from '@/utils';

export function Checkbox({ checked, onCheckedChange, className }) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={e => onCheckedChange(e.target.checked)}
      className={cn(
        "w-4 h-4 rounded border-stone-300 text-amber-700 focus:ring-amber-400",
        className
      )}
    />
  );
}
