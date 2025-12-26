import React, { useState, useRef } from 'react';
import { cn } from '@/utils';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import Header from '@/components/common/Header';
import BottomNav from '@/components/common/BottomNav';
import EditTableModal from '@/components/modals/EditTableModal';
import SectionManager from '@/components/common/settings/SectionManager';
import { Button } from '@/components/ui/Button';
import { Plus, Edit2, Save, Move, Users, Settings } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { TableStorage } from '@/api/localStorageHelpers/tables';

const statusColors = {
  available: 'bg-green-500',
  occupied: 'bg-amber-500',
  reserved: 'bg-blue-500',
  cleaning: 'bg-stone-400',
};

export default function FloorMap() {
  const mapRef = useRef(null);
  const [editMode, setEditMode] = useState(false);
  const [draggedTable, setDraggedTable] = useState(null);
  const [editModal, setEditModal] = useState({ open: false, table: null });
  const [sectionModal, setSectionModal] = useState(false);
  const [sectionFilter, setSectionFilter] = useState('all');

  const [tables, setTables] = useState(TableStorage.getAllTables?.() || []);
  const [sections, setSections] = useState([]); // You can implement local sections similarly
  const [guests, setGuests] = useState([]);     // Optional: add TableStorage.getAllGuests()

  const refetchTables = () => {
    setTables(TableStorage.getAllTables());
  };

  const filteredTables = sectionFilter === 'all' 
    ? tables 
    : tables.filter(t => t.section === sectionFilter);

  const handleDragStart = (e, table) => {
    if (!editMode) return;
    setDraggedTable(table);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (!draggedTable || !mapRef.current) return;

    const rect = mapRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    TableStorage.updateTable(draggedTable.id, {
      position_x: Math.max(5, Math.min(95, x)),
      position_y: Math.max(5, Math.min(95, y)),
    });

    refetchTables();
    setDraggedTable(null);
  };

  const handleSaveTable = (tableData) => {
    const savedTable = tableData.id
      ? TableStorage.updateTable(tableData.id, tableData)
      : TableStorage.createTable({ ...tableData, position_x: 50, position_y: 50 });

    refetchTables();
    return savedTable;
  };

  const handleCreateGuests = (table, guestCount) => {
    // Optional: implement guest creation in localStorage if needed
  };

  const getTableGuests = (tableId) => {
    return guests.filter(g => g.table_id === tableId);
  };

  return (
    <div className="min-h-screen bg-stone-100 pb-24">
      <Header 
        title="Floor Map" 
        subtitle={`${tables.filter(t => t.status === 'occupied').length} tables active`}
        rightAction={
          <div className="flex items-center gap-2">
            <Button
              variant={editMode ? "default" : "outline"}
              size="sm"
              onClick={() => setEditMode(!editMode)}
              className={cn("rounded-xl", editMode && "bg-amber-700 hover:bg-amber-800")}
            >
              {editMode ? <Save className="h-4 w-4 mr-1" /> : <Edit2 className="h-4 w-4 mr-1" />}
              {editMode ? 'Done' : 'Edit'}
            </Button>
            <Button 
              onClick={() => setEditModal({ open: true, table: {} })}
              size="sm"
              className="bg-amber-700 hover:bg-amber-800 rounded-xl"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      {/* Section Filter */}
      <div className="px-4 py-3 bg-white border-b border-stone-200 flex gap-2">
        <Select value={sectionFilter} onValueChange={setSectionFilter}>
          <SelectTrigger className="rounded-xl flex-1">
            <SelectValue placeholder="All Sections" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sections</SelectItem>
            {sections.map(section => (
              <SelectItem key={section.id} value={section.name}>{section.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSectionModal(true)}
          className="rounded-xl"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      {/* Edit Mode Hint */}
      {editMode && (
        <div className="mx-4 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-amber-800 text-sm">
          <Move className="h-4 w-4" />
          Drag tables to rearrange. Tap to edit details.
        </div>
      )}

      {/* Floor Map */}
      <div 
        ref={mapRef}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="relative mx-4 mt-4 bg-white rounded-2xl border-2 border-dashed border-stone-300 shadow-inner"
        style={{ height: 'calc(100vh - 280px)', minHeight: '400px' }}
      >
        {/* Grid Lines */}
        <div className="absolute inset-0 opacity-10">
          {[...Array(10)].map((_, i) => (
            <React.Fragment key={i}>
              <div className="absolute h-full w-px bg-stone-400" style={{ left: `${(i + 1) * 10}%` }} />
              <div className="absolute w-full h-px bg-stone-400" style={{ top: `${(i + 1) * 10}%` }} />
            </React.Fragment>
          ))}
        </div>

        {/* Tables */}
        {filteredTables.map(table => {
          const tableGuests = getTableGuests(table.id);
          const TableWrapper = editMode ? 'div' : Link;
          const wrapperProps = editMode ? {} : { to: createPageUrl(`TableDetails?id=${table.id}`) };

          return (
            <TableWrapper
              key={table.id}
              {...wrapperProps}
              draggable={editMode}
              onDragStart={(e) => handleDragStart(e, table)}
              onClick={() => editMode && setEditModal({ open: true, table })}
              className={cn("absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200", editMode && "cursor-move")}
              style={{ left: `${table.position_x || 50}%`, top: `${table.position_y || 50}%` }}
            >
              <div 
                className={cn("relative w-16 h-16 rounded-xl flex flex-col items-center justify-center text-white shadow-lg transition-transform", editMode && "hover:scale-110 active:scale-95")}
                style={{ backgroundColor: table.color || '#D97706' }}
              >
                <span className="font-bold text-lg">{table.table_number}</span>
                {tableGuests.length > 0 && (
                  <div className="flex items-center gap-0.5 text-xs opacity-90">
                    <Users className="h-3 w-3" />
                    {tableGuests.length}
                  </div>
                )}
              </div>
            </TableWrapper>
          );
        })}

        {filteredTables.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-stone-400">
            <div className="text-center">
              <p>No tables yet</p>
              <p className="text-sm">Tap + to add tables</p>
            </div>
          </div>
        )}
      </div>

      <SectionManager open={sectionModal} onClose={() => setSectionModal(false)} />

      <EditTableModal
        open={editModal.open}
        onClose={() => setEditModal({ open: false, table: null })}
        table={editModal.table}
        sections={sections}
        onSave={handleSaveTable}
        onCreateGuests={handleCreateGuests}
      />

      <BottomNav />
    </div>
  );
}
