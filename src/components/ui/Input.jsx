// src/components/ui/input.js
import React from 'react';
import { cn } from '@/utils';

export const Input = ({ className, ...props }) => {
  return (
    <input
      className={cn(
        "w-full px-3 py-2 border rounded-xl text-base text-stone-900 placeholder-stone-400 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none",
        className
      )}
      {...props}
    />
  );
};
