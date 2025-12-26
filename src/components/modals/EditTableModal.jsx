import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { cn } from '@/utils';

const TABLE_COLORS = [
  '#D97706', '#DC2626', '#16A34A', '#2563EB', '#7C3AED', '#DB2777', '#0891B2', '#65A30D'
];

export default function EditTableModal({ open, onClose, table, sections, onSave, onCreateGuests }) {
  const [formData, setFormData] = useState({
    table_number: '',
    guest_count: 0,
    color: '#D97706',
    notes: '',
    budget_total: '',
    budget_per_guest: '',
    tax_rate: '13',
    budget_include_tax: false,
  });
  const [showOptions, setShowOptions] = useState(false);

  useEffect(() => {
    if (table) {
      setFormData({
        table_number: table.table_number || '',
        guest_count: table.guest_count || 0,
        color: table.color || '#D97706',
        notes: table.notes || '',
        budget_total: table.budget_total || '',
        budget_per_guest: table.budget_per_guest || '',
        tax_rate: (table.tax_rate ?? '13').toString(),
        budget_include_tax: !!table.budget_include_tax,
      });
      setShowOptions(true);
    } else {
      setShowOptions(false);
    }
  }, [table]);

  const handleSave = async () => {
    const payload = {
      ...table,
      ...formData,
      budget_total: formData.budget_total === '' ? '' : Number(formData.budget_total),
      budget_per_guest: formData.budget_per_guest === '' ? '' : Number(formData.budget_per_guest),
      tax_rate: formData.tax_rate === '' ? '' : Number(formData.tax_rate),
      budget_include_tax: !!formData.budget_include_tax,
    };
    const savedTable = await onSave(payload);
    if (!table?.id && formData.guest_count > 0 && onCreateGuests) {
      onCreateGuests(savedTable, formData.guest_count);
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-2xl bg-white dark:bg-stone-800 max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-stone-900 dark:text-stone-100">
            {table?.id ? 'Edit Table' : 'Add Table'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4 flex-1 overflow-y-auto">
          {/* Table Number */}
          <div className="space-y-2">
            <Label className="text-stone-700 dark:text-stone-200">Table Number/Name</Label>
            <Input
              value={formData.table_number}
              onChange={(e) => setFormData({ ...formData, table_number: e.target.value })}
              placeholder="Enter table number"
              className="rounded-xl bg-stone-50 dark:bg-stone-700 text-stone-900 dark:text-stone-100"
            />
          </div>

          {/* Guest Count */}
          <div className="space-y-2">
            <Label className="text-stone-700 dark:text-stone-200">Number of Guests</Label>
            <Input
              type="tel"
              inputMode="numeric"
              min="0"
              value={formData.guest_count === 0 ? '' : formData.guest_count}
              onFocus={() => {
                if (formData.guest_count === 0) {
                  setFormData({ ...formData, guest_count: '' });
                }
              }}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/\\D/g, '');
                const numeric = cleaned === '' ? '' : parseInt(cleaned, 10);
                setFormData({ ...formData, guest_count: numeric });
              }}
              className="rounded-xl bg-stone-50 dark:bg-stone-700 text-stone-900 dark:text-stone-100"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-stone-700 dark:text-stone-200">Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any notes about this table..."
              className="rounded-xl resize-none bg-stone-50 dark:bg-stone-700 text-stone-900 dark:text-stone-100"
              rows={2}
            />
          </div>

          {/* Optional settings */}
          <div className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50">
            <button
              type="button"
              className="flex w-full items-center justify-between px-4 py-3 text-left text-stone-800 dark:text-stone-100"
              onClick={() => setShowOptions(!showOptions)}
              aria-expanded={showOptions}
            >
              <span className="font-medium">Optional settings</span>
              <span className="text-sm text-stone-500 dark:text-stone-300">
                {showOptions ? 'Hide' : 'Show'}
              </span>
            </button>

            {showOptions && (
              <div className="space-y-4 border-t border-stone-200 dark:border-stone-700 px-4 py-4">
                {/* Color */}
                <div className="space-y-2">
                  <Label className="text-stone-700 dark:text-stone-200">Table Color</Label>
                  <div className="flex gap-2 flex-wrap">
                    {TABLE_COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => setFormData({ ...formData, color })}
                        className={cn(
                          "w-10 h-10 rounded-xl transition-all",
                          formData.color === color 
                            ? "ring-2 ring-offset-2 ring-stone-900 dark:ring-stone-200 scale-110" 
                            : "hover:scale-105"
                        )}
                        style={{ backgroundColor: color }}
                        aria-label={`Choose ${color}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Budget */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-stone-700 dark:text-stone-200">Budget (total)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.budget_total}
                      onChange={(e) => setFormData({ ...formData, budget_total: e.target.value })}
                      placeholder="e.g., 200"
                      className="rounded-xl bg-stone-50 dark:bg-stone-700 text-stone-900 dark:text-stone-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-stone-700 dark:text-stone-200">Budget per guest</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.budget_per_guest}
                      onChange={(e) => setFormData({ ...formData, budget_per_guest: e.target.value })}
                      placeholder="e.g., 50"
                      className="rounded-xl bg-stone-50 dark:bg-stone-700 text-stone-900 dark:text-stone-100"
                    />
                  </div>
                </div>

                {/* Tax settings */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-stone-700 dark:text-stone-200">Tax rate (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.tax_rate}
                      onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
                      placeholder="e.g., 13"
                      className="rounded-xl bg-stone-50 dark:bg-stone-700 text-stone-900 dark:text-stone-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-stone-700 dark:text-stone-200">Budget includes tax?</Label>
                    <div className="flex items-center gap-2 h-10">
                      <input
                        type="checkbox"
                        checked={formData.budget_include_tax}
                        onChange={(e) => setFormData({ ...formData, budget_include_tax: e.target.checked })}
                        className="h-4 w-4"
                      />
                      <span className="text-sm text-stone-700 dark:text-stone-200">Yes</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-xl">
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-amber-700 hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-700 rounded-xl">
            {table?.id ? 'Save Changes' : 'Add Table'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
