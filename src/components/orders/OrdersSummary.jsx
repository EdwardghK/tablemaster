import React from 'react';
import { cn } from '@/utils';
import { Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OrderSummary({ 
  orderItems, 
  onRemoveItem,
  isVisible,
  onToggle 
}) {
  const total = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (!orderItems.length) return null;

  return (
    <div className={cn(
      "fixed bottom-20 left-0 right-0 z-40 transition-transform duration-300",
      isVisible ? "translate-y-0" : "translate-y-[calc(100%-60px)]"
    )}>
      {/* Toggle Handle */}
      <button 
        onClick={onToggle}
        className="mx-auto flex items-center justify-center w-12 h-6 bg-stone-900 rounded-t-xl"
      >
        <div className="w-8 h-1 bg-stone-600 rounded-full" />
      </button>

      <div className="bg-stone-900 dark:bg-stone-800 rounded-t-3xl px-4 pt-4 pb-6 max-h-[50vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold text-lg">Current Order</h3>
          <span className="text-amber-400 font-bold">${total.toFixed(2)}</span>
        </div>

        {/* Items */}
        <div className="space-y-3 mb-4">
          {orderItems.map((item, index) => (
            <div 
              key={index}
              className={cn(
                "flex items-start gap-3 p-3 rounded-xl transition-colors",
                item.allergen_warning ? "bg-red-900/30 dark:bg-red-800/40" : "bg-stone-800 dark:bg-stone-700"
              )}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">{item.quantity}x</span>
                  <span className="text-white">{item.menu_item_name}</span>
                  {item.allergen_warning && (
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                  )}
                </div>
                {item.modifications?.length > 0 && (
                  <p className="text-stone-400 dark:text-stone-300 text-sm mt-1">
                    {item.modifications.join(', ')}
                  </p>
                )}
                {item.custom_notes && (
                  <p className="text-stone-500 dark:text-stone-400 text-xs mt-1 italic">
                    "{item.custom_notes}"
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-amber-400 font-medium">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
                <button 
                  onClick={() => onRemoveItem(index)}
                  className="p-1.5 rounded-full hover:bg-stone-700 dark:hover:bg-stone-600 transition-colors"
                >
                  <Trash2 className="h-4 w-4 text-stone-400 dark:text-stone-200" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
