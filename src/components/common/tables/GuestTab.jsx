import React from 'react';
import { cn } from '@/utils';
import { User, AlertCircle, Settings } from 'lucide-react';

export default function GuestTab({ guest, isActive = false, onClick, hasAllergens = false, onEdit, orderCount = 0 }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative inline-flex items-center gap-2 min-w-[110px] px-3 py-2 rounded-full text-sm font-semibold border transition-colors duration-200 shrink-0 whitespace-nowrap",
        isActive
          ? "bg-amber-700 text-white border-amber-700 shadow-sm"
          : "bg-white text-stone-700 border-stone-200 hover:bg-stone-100 dark:bg-stone-800 dark:text-stone-100 dark:border-stone-700"
      )}
    >
      <div className="flex items-center gap-2 overflow-hidden flex-1">
        <User className="h-4 w-4 flex-shrink-0" />
        <span className="font-medium text-sm whitespace-normal break-words">
          {guest.name || `s${guest.guest_number}`}
        </span>
      </div>

      {hasAllergens && (
        <div className={cn(
          "absolute -top-1 -right-1 p-0.5 rounded-full pointer-events-none",
          isActive ? "bg-red-500" : "bg-red-100"
        )}>
          <AlertCircle className={cn(
            "h-3 w-3",
            isActive ? "text-white" : "text-red-600"
          )} />
        </div>
      )}

      {orderCount > 0 && (
        <div className={cn(
          "absolute -bottom-1 -right-1 min-w-[20px] h-5 px-1.5 text-xs flex items-center justify-center rounded-full pointer-events-none",
          isActive ? "bg-amber-600 text-white" : "bg-amber-100 text-amber-800"
        )}>
          {orderCount}
        </div>
      )}

      {isActive && (
        <div
          role="button"
          tabIndex={0}
          onClick={(e) => { e.stopPropagation(); onEdit?.(guest); }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              onEdit?.(guest);
            }
          }}
          className={cn(
            "opacity-100 transition-opacity p-1 rounded-full ml-auto",
            "text-white"
          )}
          aria-label="Edit guest"
        >
          <Settings className="h-4 w-4" />
        </div>
      )}
    </button>
  );
}
