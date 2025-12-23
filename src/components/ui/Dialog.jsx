// src/components/ui/dialog.js
import React from 'react';
import { cn } from '@/utils';

export const Dialog = ({ open, onOpenChange, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => onOpenChange(false)}>
      {React.Children.map(children, child =>
        React.cloneElement(child, { onClick: e => e.stopPropagation() })
      )}
    </div>
  );
};

export const DialogContent = ({ children, className, ...props }) => (
  <div className={cn("bg-white dark:bg-stone-900 rounded-2xl p-6 shadow-lg w-full max-w-md", className)} {...props}>
    {children}
  </div>
);

export const DialogHeader = ({ children }) => <div className="mb-4">{children}</div>;
export const DialogTitle = ({ children }) => <h2 className="text-lg font-bold text-stone-900 dark:text-white">{children}</h2>;
export const DialogFooter = ({ children }) => <div className="mt-4 flex justify-end gap-2">{children}</div>;
