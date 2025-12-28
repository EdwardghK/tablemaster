// File: src/components/common/Header.jsx

import React, { useContext, useEffect, useState } from 'react';
import { ChevronLeft, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from '@/utils';
import DarkModeToggle from './DarkModeToggle';
import { AppContext } from '@/context/AppContext';
import { supabase } from '@/supabase';

export default function Header({ 
  title, 
  subtitle,
  backTo, 
  rightAction,
  className 
}) {
  const { user, profile, isAdmin } = useContext(AppContext);
  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email ||
    null;
  const [inboxCount, setInboxCount] = useState(0);

  useEffect(() => {
    if (!isAdmin) {
      setInboxCount(0);
      return;
    }
    let active = true;
    (async () => {
      try {
        const { count: editCount } = await supabase
          .from("edit_requests")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending");
        const { count: changeCount } = await supabase
          .from("change_requests")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending");
        if (!active) return;
        setInboxCount((editCount || 0) + (changeCount || 0));
      } catch (err) {
        if (!active) return;
        console.warn("Inbox count fetch failed:", err);
        setInboxCount(0);
      }
    })();
    return () => {
      active = false;
    };
  }, [isAdmin]);

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
        <div className="flex items-center gap-3">
          {isAdmin ? (
            <Link
              to={createPageUrl('admin/inbox')}
              className="relative p-2 rounded-full hover:bg-stone-100 dark:hover:bg-[#16213c] transition-colors"
              aria-label="Admin inbox"
            >
              <Mail className="h-5 w-5 text-stone-700 dark:text-[#e7eefc]" />
              {inboxCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-600 border border-white dark:border-stone-800" />
              )}
            </Link>
          ) : null}
          {displayName ? (
            <span className="text-sm font-medium text-stone-700 dark:text-[#e7eefc] truncate max-w-[140px]">
              {displayName}
            </span>
          ) : null}
          <DarkModeToggle />
          {rightAction}
        </div>
      </div>
    </header>
  );
}
