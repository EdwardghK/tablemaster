// File: src/components/common/BottomNav.jsx

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutGrid, UtensilsCrossed, Sparkles, Hammer, User } from 'lucide-react';
import { cn, createPageUrl } from '@/utils';

const navItems = [
  { name: 'Expo', icon: Sparkles, page: 'expo' },
  { name: 'Tables', icon: LayoutGrid, page: '' },
  { name: 'Menu', icon: UtensilsCrossed, page: 'menu' },
  { name: 'Builder', icon: Hammer, page: 'menu-builder' },
  { name: 'Profile', icon: User, page: 'profile' },
];

export default function BottomNav() {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 px-2 pb-safe z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          // Active when path matches exactly or as a segment, not by substring
          const target = item.page ? `/${item.page}` : '/';
          const isActive =
            currentPath === target ||
            currentPath === `${target}/` ||
            (item.page && currentPath.startsWith(`${target}/`));
          return (
            <Link
              key={item.name}
              to={createPageUrl(item.page)}
              className={cn(
                "flex flex-col items-center justify-center w-20 py-2 rounded-xl transition-all duration-200",
                isActive 
                  ? "text-amber-700 bg-amber-50" 
                  : "text-stone-400 hover:text-stone-600 hover:bg-stone-50"
              )}
            >
              <item.icon className={cn("h-5 w-5 mb-1", isActive && "stroke-[2.5px]")} />
              <span className={cn(
                "text-xs font-medium tracking-wide",
                isActive && "font-semibold"
              )}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
