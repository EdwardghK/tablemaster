// src/components/ui/badge.js
import React from 'react';
import { cn } from '@/utils';

export const Badge = ({ children, className, variant = 'default', ...props }) => {
  const variants = {
    default: "bg-stone-200 text-stone-800",
    secondary: "bg-amber-100 text-amber-800",
  };
  return (
    <span className={cn("inline-flex items-center px-2 py-1 rounded-full text-xs font-medium", variants[variant], className)} {...props}>
      {children}
    </span>
  );
};
