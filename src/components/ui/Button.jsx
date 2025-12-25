// src/components/ui/button.jsx
import React from 'react';
import { cn } from '@/utils';

export const Button = ({ children, className, variant = 'default', size = 'default', ...props }) => {
  const base = "inline-flex items-center justify-center rounded-xl font-semibold transition-all focus:outline-none";
  const variants = {
    default: "bg-amber-700 text-white hover:bg-amber-800",
    outline: "border border-stone-300 bg-white text-stone-900 hover:bg-stone-50",
    ghost: "bg-transparent hover:bg-stone-100",
  };
  const sizes = {
    default: "h-10 px-4 text-sm",
    icon: "p-2",
  };
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  );
};
