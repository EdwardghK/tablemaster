// src/components/ui/textarea.js
import React from 'react';
import { cn } from '@/utils';

export const Textarea = ({ className, ...props }) => {
  return (
    <textarea
      className={cn(
        "w-full px-3 py-2 border rounded-xl text-base text-stone-900 placeholder-stone-400 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none resize-none",
        className
      )}
      {...props}
    />
  );
};
