import React, { useState, useEffect, useContext } from 'react';
import Header from '@/components/common/Header';
import BottomNav from '@/components/common/BottomNav';
import TableCard from '@/components/common/tables/TableCard.jsx';
import EditTableModal from '@/components/modals/EditTableModal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus, Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { TableStorage } from '@/api/localStorageHelpers/tables';
import { GuestStorage } from '@/api/localStorageHelpers/guests';
import { OrderStorage } from '@/api/localStorageHelpers/orders';
import { AppContext } from '@/context/AppContext';
import { toast } from 'sonner';
import { ChangeRequests } from '@/api/changeRequests';

export default function Tables() {
  const [searchQuery, setSearchQuery] = useState('');
  const [editModal, setEditModal] = useState({ open: false, table: null });
  const { requiresApproval, user } = useContext(AppContext);

  const [tables, setTables] = useState([]);
  const [guests, setGuests] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load tables, guests, orders from localStorage
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [t, g, o] = await Promise.all([
          TableStorage.getAllTables(),
          GuestStorage.getAllGuests(),
          OrderStorage.getAllOrderItems(),
        ]);
        setTables(t);
        setGuests(g);
        setOrderItems(o);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredTables = tables.filter(table => {
    const matchesSearch = table.table_number?.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
                          table.section?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  }).sort((a, b) => (a.table_number || '').localeCompare(b.table_number || '', undefined, { numeric: true, sensitivity: 'base' }));

  const getTableOrderCount = (tableId) => {
    const tableGuests = guests.filter(g => g.table_id === tableId);
    const guestIds = tableGuests.map(g => g.id);
    return orderItems.filter(item => guestIds.includes(item.guest_id)).length;
  };

  const tableHasAllergens = (tableId) => {
    const tableGuests = guests.filter(g => g.table_id === tableId);
    return tableGuests.some(g => (g.allergens?.length > 0 || g.custom_allergens?.length > 0));
  };

  const handleSaveTable = async (tableData) => {
    try {
      const payload = {
        ...tableData,
        guest_count: Number.isFinite(Number(tableData.guest_count)) ? Number(tableData.guest_count) : 0,
        status: tableData.status || 'available',
      };
      let savedTable;
      if (payload.id) {
        savedTable = await TableStorage.updateTable(payload.id, payload);
      } else {
        savedTable = await TableStorage.createTable(payload);
      }
      setTables(await TableStorage.getAllTables());
      return savedTable;
    } catch (err) {
      console.error('Failed to save table:', err);
      window.alert(err?.message || 'Could not save table');
      throw err;
    }
  };

  const handleCreateGuests = async (table, guestCount) => {
    const tasks = [];
    for (let i = 1; i <= guestCount; i++) {
      tasks.push(GuestStorage.createGuest({
        table_id: table.id,
        guest_number: i,
      }));
    }
    await Promise.all(tasks);
    setGuests(await GuestStorage.getAllGuests());
  };

  const handleDeleteTable = async (table) => {
    const confirmed = window.confirm(`Delete table ${table.table_number || ''}?`);
    if (!confirmed) return;
    if (requiresApproval) {
      await ChangeRequests.submit({
        user,
        entityType: 'table',
        entityId: table.id,
        action: 'delete',
        beforeData: table,
        afterData: null,
      });
      toast.success('Deletion submitted for approval. Table will be removed after admin review.');
    } else {
      await TableStorage.deleteTable(table.id);
      setGuests((prev) => prev.filter((g) => g.table_id !== table.id));
      setOrderItems((prev) => prev.filter((o) => o.table_id !== table.id));
      setTables(await TableStorage.getAllTables());
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-24">
      <Header title="TableMaster" />

      {/* Search & Filters (with Add button) */}
      <div className="px-4 py-3 bg-white border-b border-stone-100">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tables..."
              className="pl-10 rounded-xl bg-stone-50 border-stone-200"
            />
          </div>

          <div>
            <Button 
              onClick={() => {
                setEditModal({ open: true, table: {} });
              }}
              size="sm"
              className="bg-amber-700 hover:bg-amber-800 rounded-lg"
            >
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
        </div>

      </div>

      {/* Tables Grid */}
      <div className="p-4 space-y-6">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-2 gap-3">
              {filteredTables.map(table => (
                <TableCard 
                  key={table.id} 
                  table={table}
                  orderCount={getTableOrderCount(table.id)}
                  hasAllergens={tableHasAllergens(table.id)}
                  onDelete={handleDeleteTable}
                  onEdit={() => setEditModal({ open: true, table })}
                />
              ))}
            </div>
            {filteredTables.length === 0 && (
              <div className="text-center py-12">
                <Button
                  onClick={() => {
                    setEditModal({ open: true, table: {} });
                  }}
                  className="bg-amber-700 hover:bg-amber-800 rounded-2xl px-6 py-4 text-base"
                >
                  Create New Table
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <EditTableModal
        open={editModal.open}
        onClose={() => setEditModal({ open: false, table: null })}
        table={editModal.table}
        onSave={handleSaveTable}
        onCreateGuests={handleCreateGuests}
      />

      <BottomNav />
    </div>
  );
}
