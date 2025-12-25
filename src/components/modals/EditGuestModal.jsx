import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Checkbox } from '@/components/ui/Checkbox';
import { Badge } from '@/components/ui/Badge';
import { X, Plus } from 'lucide-react';
import { COMMON_ALLERGENS } from '@/components/common/AllergenBadge';
import { cn } from '@/utils';

export default function EditGuestModal({ open, onClose, guest, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    allergens: [],
    custom_allergens: [],
    notes: '',
    dietary_restrictions: [],
  });
  const [newCustomAllergen, setNewCustomAllergen] = useState('');
  const [showAllergens, setShowAllergens] = useState(false);

  useEffect(() => {
    if (guest) {
      setFormData({
        name: guest.name || '',
        allergens: guest.allergens || [],
        custom_allergens: guest.custom_allergens || [],
        notes: guest.notes || '',
        dietary_restrictions: guest.dietary_restrictions || [],
      });
    }
  }, [guest]);

  const toggleAllergen = (allergen) => {
    setFormData(prev => ({
      ...prev,
      allergens: prev.allergens.includes(allergen)
        ? prev.allergens.filter(a => a !== allergen)
        : [...prev.allergens, allergen]
    }));
  };

  const addCustomAllergen = () => {
    if (newCustomAllergen.trim()) {
      setFormData(prev => ({
        ...prev,
        custom_allergens: [...prev.custom_allergens, newCustomAllergen.trim()]
      }));
      setNewCustomAllergen('');
    }
  };

  const removeCustomAllergen = (allergen) => {
    setFormData(prev => ({
      ...prev,
      custom_allergens: prev.custom_allergens.filter(a => a !== allergen)
    }));
  };

  const handleSave = () => {
    onSave({ ...guest, ...formData });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-2xl bg-white dark:bg-stone-800">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-stone-900 dark:text-stone-100">
            Edit Guest {guest?.guest_number}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4 max-h-[75vh] overflow-y-auto pr-1">
          {/* Name */}
          <div className="space-y-2">
            <Label className="text-stone-700 dark:text-stone-200">Guest Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter guest name"
              className="rounded-xl bg-stone-50 dark:bg-stone-700 text-stone-900 dark:text-stone-100"
            />
          </div>

          {/* Common Allergens (expandable) */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowAllergens((prev) => !prev)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-700 text-left"
            >
              <span className="text-sm font-medium text-stone-700 dark:text-stone-200">Allergens</span>
              <span className="text-xs text-stone-500">{showAllergens ? 'Hide' : 'Show'}</span>
            </button>
            {showAllergens && (
              <div className="grid grid-cols-2 gap-2">
                {COMMON_ALLERGENS.map(allergen => (
                  <label 
                    key={allergen}
                    className={cn(
                      "flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all",
                      formData.allergens.includes(allergen) 
                        ? "border-red-400 bg-red-50 dark:bg-red-900" 
                        : "border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-500"
                    )}
                  >
                    <Checkbox 
                      checked={formData.allergens.includes(allergen)}
                      onCheckedChange={() => toggleAllergen(allergen)}
                    />
                    <span className="text-sm text-stone-700 dark:text-stone-200">{allergen}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Custom Allergens */}
          <div className="space-y-3">
            <Label className="text-stone-700 dark:text-stone-200">Custom Allergens</Label>
            <div className="flex gap-2">
              <Input
                value={newCustomAllergen}
                onChange={(e) => setNewCustomAllergen(e.target.value)}
                placeholder="Add custom allergen"
                className="rounded-xl bg-stone-50 dark:bg-stone-700 text-stone-900 dark:text-stone-100"
                onKeyDown={(e) => e.key === 'Enter' && addCustomAllergen()}
              />
              <Button 
                onClick={addCustomAllergen}
                variant="outline" 
                size="icon"
                className="rounded-xl"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {formData.custom_allergens.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.custom_allergens.map(allergen => (
                  <Badge 
                    key={allergen}
                    variant="secondary"
                    className="bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-3 py-1 flex items-center gap-1"
                  >
                    {allergen}
                    <button 
                      onClick={() => removeCustomAllergen(allergen)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-stone-700 dark:text-stone-200">Special Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any special requests or notes..."
              className="rounded-xl resize-none bg-stone-50 dark:bg-stone-700 text-stone-900 dark:text-stone-100"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-xl">
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-amber-700 hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-700 rounded-xl">
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

