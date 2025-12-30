// src/components/ui/select.jsx
import React from 'react';
import { cn } from '@/utils';

export function Select({ value, onValueChange, children, className }) {
  return (
    <select
      value={value}
      onChange={e => onValueChange(e.target.value)}
      className={cn(
        "rounded-xl border border-stone-200 px-3 py-2 bg-white text-base text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-400",
        className
      )}
    >
      {children}
    </select>
  );
}

export function SelectTrigger({ children, className }) {
  return <div className={cn("cursor-pointer", className)}>{children}</div>;
}

export function SelectValue({ children, placeholder }) {
  return <span>{children || placeholder}</span>;
}

export function SelectContent({ children }) {
  return <>{children}</>;
}

export function SelectItem({ value, children }) {
  return <option value={value}>{children}</option>;
}
