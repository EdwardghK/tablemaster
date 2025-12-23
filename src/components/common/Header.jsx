// File: src/components/common/Header.jsx

import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from '@/utils';
import DarkModeToggle from './DarkModeToggle';

export default function Header({ 
  title, 
  subtitle,
  backTo, 
  rightAction,
  className 
}) {
  return (
    <header className={cn(
      "sticky top-0 z-40 bg-white/80 dark:bg-[#0c1528cc] backdrop-blur-xl border-b border-stone-100 dark:border-[#16213c]",
      className
    )}>
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2 flex-1">
          {backTo && (
            <Link 
              to={createPageUrl(backTo)}
              className="p-2 -ml-2 rounded-full hover:bg-stone-100 transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-stone-600" />
          </Link>
        )}
        <div>
            <h1 className="text-lg font-semibold text-black dark:text-[#e7eefc] tracking-tight">{title}</h1>
            {subtitle && (
              <p className="text-xs text-stone-500 dark:text-stone-300">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DarkModeToggle />
          {rightAction}
        </div>
      </div>
    </header>
  );
}
