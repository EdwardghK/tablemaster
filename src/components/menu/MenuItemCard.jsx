// File: src/components/menu/MenuItemCard.jsx

import React, { useState } from 'react';
import { cn } from '@/utils';
import { Check, AlertTriangle, Plus, Minus, Pencil } from 'lucide-react';
import AllergenBadge from '@/components/common/AllergenBadge';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';

export default function MenuItemCard({ 
  item, 
  guestAllergens = [], 
  showAllergenBadges = true,
  onAddToOrder,
  onRemoveFromOrder,
  onUpdateQuantity,
  onEditSelected,
  selectedOrderItem,
  selectedQuantity = 0,
  isSelected = false,
  isExpanded = false,
  onToggleExpand
}) {
  const [quantity, setQuantity] = useState(1);
  const [selectedMods, setSelectedMods] = useState([]);
  const [customNotes, setCustomNotes] = useState('');
  const [doneness, setDoneness] = useState('Medium Rare');
  const [carve, setCarve] = useState(false);

  const matchingAllergens = item.allergens?.filter(a => 
    guestAllergens.includes(a)
  ) || [];
  
  const hasAllergenWarning = matchingAllergens.length > 0;
  // Support both legacy "common_modifications" and new "common_mods" from menu items
  const modsList = item.common_modifications || item.common_mods || [];
  const hasOptions = (modsList.length > 0) || item.category === 'steaks' || item.category === 'main';

  const handleCardClick = () => {
    if (isSelected) {
      onRemoveFromOrder(item.id);
    } else if (!hasOptions) {
      onAddToOrder({
        menu_item_id: item.id,
        menu_item_name: item.name,
        quantity: 1,
        modifications: [],
        custom_notes: '',
        price: item.price,
        allergen_warning: hasAllergenWarning,
      });
    } else {
      onToggleExpand(isExpanded ? null : item.id);
    }
  };

  const handleAdd = (e) => {
    e.stopPropagation();
    const mods = [...selectedMods];
    if (item.category === 'steaks') {
      mods.push(`Doneness: ${doneness}`);
      if (carve) mods.push('Carve');
    }

    onAddToOrder({
      menu_item_id: item.id,
      menu_item_name: item.name,
      quantity,
      modifications: mods,
      custom_notes: customNotes,
      price: item.price,
      allergen_warning: hasAllergenWarning,
    });
    setQuantity(1);
    setSelectedMods([]);
    setCustomNotes('');
    onToggleExpand(null);
  };

  const toggleMod = (mod) => {
    setSelectedMods(prev => 
      prev.includes(mod) ? prev.filter(m => m !== mod) : [...prev, mod]
    );
  };

  return (
    <div className={cn(
      "bg-white dark:bg-stone-800 rounded-2xl border-2 transition-all duration-200",
      isExpanded
        ? "border-amber-400 shadow-lg"
        : isSelected
          ? "border-amber-500 bg-amber-50 dark:bg-amber-900"
          : "border-stone-200 dark:border-stone-700",
      hasAllergenWarning && "border-red-300 bg-red-50/60 dark:border-red-500 dark:bg-red-900/30 ring-2 ring-red-200"
    )}>
      <button 
        onClick={handleCardClick}
        className="w-full p-4 text-left"
      >
        <div className="flex items-start gap-3">
          {item.image_url && (
            <img 
              src={item.image_url} 
              alt={item.name}
              className="w-16 h-16 rounded-xl object-cover"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-stone-900 dark:text-stone-100">{item.name}</h3>
              <div className="flex items-center gap-2">
              <div className="flex items-center gap-3 justify-start">
                {isSelected && onEditSelected ? (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onEditSelected(selectedOrderItem || item); }}
                    className="p-1 rounded-full hover:bg-stone-100 text-amber-700"
                      aria-label="Modify item"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  ) : null}
                  {isSelected ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onUpdateQuantity?.(item.id, Math.max(0, (selectedQuantity || 1) - 1)); }}
                        className="p-1 rounded-full hover:bg-stone-100"
                      >
                        <Minus className="h-4 w-4 text-stone-600" />
                      </button>
                      <div className="font-semibold text-stone-900 dark:text-stone-100">{selectedQuantity || 1}</div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onUpdateQuantity?.(item.id, (selectedQuantity || 0) + 1); }}
                        className="p-1 rounded-full hover:bg-stone-100"
                      >
                        <Plus className="h-4 w-4 text-stone-600" />
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
            {item.description && (
              <p className="text-sm text-stone-500 dark:text-stone-300 mt-1 line-clamp-2">{item.description}</p>
            )}
            
            {showAllergenBadges && item.allergens?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {item.allergens.map(a => (
                  <AllergenBadge 
                    key={a} 
                    allergen={a} 
                    showWarning={matchingAllergens.includes(a)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
        
        {hasAllergenWarning && (
          <div className="flex items-center gap-2 mt-3 p-2.5 bg-red-50 dark:bg-red-900 rounded-xl text-red-700 dark:text-red-200 text-sm">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>Contains allergens: {matchingAllergens.join(', ')}</span>
          </div>
        )}
      </button>

      {isExpanded && !isSelected && (
        <div className="px-4 pb-4 border-t border-stone-100 dark:border-stone-700 pt-4 space-y-4">
          {/* Quantity Control */}
          <div className="flex items-center justify-between">
            <span className="font-medium text-stone-700 dark:text-stone-200">Quantity</span>
            <div className="flex items-center gap-3 bg-stone-100 dark:bg-stone-700 rounded-full p-1">
              <button 
                onClick={(e) => { e.stopPropagation(); setQuantity(Math.max(1, quantity - 1)); }}
                className="p-1.5 rounded-full hover:bg-stone-200 dark:hover:bg-stone-600 transition-colors"
              >
                <Minus className="h-4 w-4 text-stone-600 dark:text-stone-300" />
              </button>
              <span className="w-8 text-center font-bold text-stone-900 dark:text-stone-100">{quantity}</span>
              <button 
                onClick={(e) => { e.stopPropagation(); setQuantity(quantity + 1); }}
                className="p-1.5 rounded-full hover:bg-stone-200 dark:hover:bg-stone-600 transition-colors"
              >
                <Plus className="h-4 w-4 text-stone-600 dark:text-stone-300" />
              </button>
            </div>
          </div>

          {/* Modifications */}
          {modsList.length > 0 && (
            <div className="space-y-2">
              <span className="font-medium text-stone-700 dark:text-stone-200 text-sm">Modifications</span>
              <div className="grid grid-cols-2 gap-2">
                {modsList.map(mod => (
                  <label 
                    key={mod}
                    onClick={(e) => e.stopPropagation()}
                    className={cn(
                      "flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all",
                      selectedMods.includes(mod) 
                        ? "border-amber-400 bg-amber-50 dark:bg-amber-900" 
                        : "border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-500"
                    )}
                  >
                    <Checkbox 
                      checked={selectedMods.includes(mod)}
                      onCheckedChange={() => toggleMod(mod)}
                    />
                    <span className="text-sm text-stone-700 dark:text-stone-200">{mod}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Custom Notes / Doneness for steaks */}
          <div className="space-y-2">
            {item.category === 'steaks' && (
              <div className="space-y-1">
                <span className="font-medium text-stone-700 dark:text-stone-200 text-sm">Doneness</span>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {['Rare','Medium Rare','Medium','Medium Well','Well Done'].map(level => (
                    <label
                      key={level}
                      className="flex items-center gap-2 p-2 rounded-lg border border-stone-200 dark:border-stone-700 cursor-pointer hover:border-stone-300 dark:hover:border-stone-500"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="radio"
                        name={`doneness-${item.id}`}
                        checked={doneness === level}
                        onChange={() => setDoneness(level)}
                      />
                      <span>{level}</span>
                    </label>
                  ))}
                </div>
                <label
                  className="flex items-center gap-2 text-sm p-2 rounded-lg border border-stone-200 dark:border-stone-700 cursor-pointer hover:border-stone-300 dark:hover:border-stone-500"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Checkbox checked={carve} onCheckedChange={(v) => setCarve(!!v)} />
                  <span>Carve / Slice</span>
                </label>
              </div>
            )}
            <div className="space-y-1">
              <span className="font-medium text-stone-700 dark:text-stone-200 text-sm">
                {item.category === 'steaks' ? 'Special Instructions' : 'Special Instructions'}
              </span>
              <Textarea
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                placeholder={item.category === 'steaks' ? "E.g., no bacon, no croutons" : "E.g., extra sauce, no garnish..."}
                className="resize-none rounded-xl"
                rows={2}
              />
            </div>
          </div>

          {/* Add Button */}
          <Button 
            onClick={handleAdd}
            className="w-full bg-amber-700 hover:bg-amber-800 text-white dark:bg-amber-600 dark:hover:bg-amber-700 rounded-xl h-12 text-base font-semibold"
          >
            <Check className="h-5 w-5 mr-2" />
            Add to Order · ${(item.price * quantity).toFixed(2)}
          </Button>
        </div>
      )}
    </div>
  );
}
