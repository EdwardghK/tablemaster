import React from 'react';
import { cn } from '@/utils';
import { AlertTriangle } from 'lucide-react';

// Color classes for each allergen
const allergenColors = {
  'Gluten': 'bg-amber-100 text-amber-800 border-amber-200',
  'Dairy': 'bg-blue-100 text-blue-800 border-blue-200',
  'Eggs': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Fish': 'bg-cyan-100 text-cyan-800 border-cyan-200',
  'Shellfish': 'bg-red-100 text-red-800 border-red-200',
  'Tree Nuts': 'bg-orange-100 text-orange-800 border-orange-200',
  'Nuts': 'bg-orange-50 text-orange-700 border-orange-200',
  'Walnuts': 'bg-amber-100 text-amber-800 border-amber-200',
  'Peanuts': 'bg-rose-100 text-rose-800 border-rose-200',
  'Soy': 'bg-green-100 text-green-800 border-green-200',
  'Sesame': 'bg-lime-100 text-lime-800 border-lime-200',
  'Sulfites': 'bg-purple-100 text-purple-800 border-purple-200',
  'Wheat (Gluten)': 'bg-amber-100 text-amber-800 border-amber-200',
  'Seafood': 'bg-sky-100 text-sky-800 border-sky-200',
  'Allium': 'bg-stone-100 text-stone-800 border-stone-200',
  'Onion': 'bg-stone-100 text-stone-800 border-stone-200',
  'Garlic': 'bg-stone-100 text-stone-800 border-stone-200',
  'Shallot': 'bg-stone-100 text-stone-800 border-stone-200',
  'Leek': 'bg-stone-100 text-stone-800 border-stone-200',
  'Chives': 'bg-stone-100 text-stone-800 border-stone-200',
  'Scallion': 'bg-stone-100 text-stone-800 border-stone-200',
  'Citrus': 'bg-orange-100 text-orange-800 border-orange-200',
  'Pork': 'bg-pink-100 text-pink-800 border-pink-200',
  'Alcohol': 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
  'Beef': 'bg-red-50 text-red-700 border-red-200',
};

// Component
export default function AllergenBadge({ allergen, showWarning = false, size = 'sm' }) {
  const colorClass = allergenColors[allergen] || 'bg-stone-100 text-stone-700 border-stone-200';

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-medium",
        colorClass,
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
      )}
    >
      {showWarning && <AlertTriangle className="h-3 w-3" />}
      {allergen}
    </span>
  );
}

// Common allergens list for reference
export const COMMON_ALLERGENS = [
  'Alcohol',
  'Allium',
  'Beef',
  'Chives',
  'Citrus',
  'Dairy',
  'Eggs',
  'Fish',
  'Garlic',
  'Leek',
  'Nuts',
  'Onion',
  'Peanuts',
  'Pork',
  'Scallion',
  'Seafood',
  'Sesame',
  'Shallot',
  'Shellfish',
  'Soy',
  'Tree Nuts',
  'Walnuts',
  'Wheat (Gluten)',
];
