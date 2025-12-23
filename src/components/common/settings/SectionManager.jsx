import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const SECTION_COLORS = [
  '#D97706', '#DC2626', '#16A34A', '#2563EB', '#7C3AED', '#DB2777', '#0891B2', '#65A30D'
];

export default function SectionManager({ open, onClose }) {
  const [sections, setSections] = useState([]);
  const [editSection, setEditSection] = useState(null);
  const [formData, setFormData] = useState({ name: '', color: '#D97706', description: '' });

  // Load sections from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('sections');
    if (saved) {
      setSections(JSON.parse(saved));
    }
  }, []);

  // Save sections to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('sections', JSON.stringify(sections));
  }, [sections]);

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error('Section name is required');
      return;
    }

    if (editSection) {
      // Update existing section
      setSections(prev =>
        prev.map(sec => (sec.id === editSection.id ? { ...sec, ...formData } : sec))
      );
      toast.success('Section updated');
    } else {
      // Add new section
      const newSection = { id: Date.now(), ...formData };
      setSections(prev => [...prev, newSection]);
      toast.success('Section added');
    }

    setFormData({ name: '', color: '#D97706', description: '' });
    setEditSection(null);
  };

  const handleEdit = (section) => {
    setEditSection(section);
    setFormData({
      name: section.name,
      color: section.color,
      description: section.description || ''
    });
  };

  const handleDelete = (id) => {
    if (confirm('Delete this section?')) {
      setSections(prev => prev.filter(sec => sec.id !== id));
      toast.success('Section deleted');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Manage Sections</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Add/Edit Form */}
          <div className="p-4 bg-stone-50 rounded-xl space-y-4">
            <div className="space-y-2">
              <Label>Section Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Patio, Main Floor, VIP"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {SECTION_COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-8 h-8 rounded-lg transition-all ${
                      formData.color === color
                        ? 'ring-2 ring-offset-2 ring-stone-900 scale-110'
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <Button
              onClick={handleSave}
              className="w-full bg-amber-700 hover:bg-amber-800 rounded-xl"
            >
              <Plus className="h-4 w-4 mr-2" />
              {editSection ? 'Update Section' : 'Add Section'}
            </Button>

            {editSection && (
              <Button
                variant="outline"
                onClick={() => {
                  setEditSection(null);
                  setFormData({ name: '', color: '#D97706', description: '' });
                }}
                className="w-full rounded-xl"
              >
                Cancel Edit
              </Button>
            )}
          </div>

          {/* Sections List */}
          <div className="space-y-2">
            {sections.map(section => (
              <div
                key={section.id}
                className="flex items-center justify-between p-3 bg-white rounded-xl border border-stone-200"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg"
                    style={{ backgroundColor: section.color }}
                  />
                  <span className="font-medium">{section.name}</span>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(section)}
                    className="h-8 w-8 rounded-lg"
                  >
                    <Edit2 className="h-4 w-4 text-stone-500" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(section.id)}
                    className="h-8 w-8 rounded-lg"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}

            {sections.length === 0 && (
              <p className="text-center text-stone-500 py-4">
                No sections yet. Add your first section above.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-xl">
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
