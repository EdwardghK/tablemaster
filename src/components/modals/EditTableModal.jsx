import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  });

  useEffect(() => {
    if (table) {
      setFormData({
        table_number: table.table_number || '',
        guest_count: table.guest_count || 0,
        color: table.color || '#D97706',
        notes: table.notes || '',
      });
    }
  }, [table]);

  const handleSave = async () => {
    const savedTable = await onSave({ ...table, ...formData });
    if (!table?.id && formData.guest_count > 0 && onCreateGuests) {
      onCreateGuests(savedTable, formData.guest_count);
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-2xl bg-white dark:bg-stone-800">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-stone-900 dark:text-stone-100">
            {table?.id ? 'Edit Table' : 'Add Table'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
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
              type="number"
              min="0"
              value={formData.guest_count}
              onChange={(e) => setFormData({ ...formData, guest_count: parseInt(e.target.value) || 0 })}
              className="rounded-xl bg-stone-50 dark:bg-stone-700 text-stone-900 dark:text-stone-100"
            />
          </div>

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
                />
              ))}
            </div>
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
