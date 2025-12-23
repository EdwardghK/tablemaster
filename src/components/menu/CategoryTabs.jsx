import React from 'react';
import { cn } from '@/utils';

const DEFAULT_CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'appetizers', label: 'Appetizers' },
  { value: 'salads', label: 'Salads' },
  { value: 'caviar', label: 'Caviar' },
  { value: 'chilled_seafood', label: 'Chilled Seafood' },
  { value: 'steaks', label: 'Steaks' },
  { value: 'main_courses', label: 'Main Courses' },
  { value: 'sides', label: 'Sides' },
  { value: 'additions', label: 'Additions' },
  { value: 'sauces', label: 'Sauces' },
];

export default function CategoryTabs({
  activeCategory = 'all',
  onCategoryChange = () => {},
  partyMenus = [],
  containerClassName = '',
  innerClassName = '',
  buttonClassName = '',
}) {
  const categories = DEFAULT_CATEGORIES;

  return (
    <div className={cn("px-4 py-3", containerClassName)}>
      <div className={cn("flex gap-2 overflow-x-auto", innerClassName)}>
        {categories.map(cat => (
          <button
            key={cat.value}
            onClick={() => onCategoryChange(cat.value)}
            className={cn(
              "px-3 py-2 rounded-xl whitespace-nowrap",
              activeCategory === cat.value ? "bg-amber-700 text-white" : "bg-stone-100 text-stone-900",
              buttonClassName
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
}
