import React, { useState, useEffect, useContext, useRef } from 'react';
import { cn } from '@/utils';
import BottomNav from '@/components/common/BottomNav';
import GuestTab from '@/components/common/tables/GuestTab';
import CategoryTabs from '@/components/menu/CategoryTabs';
import MenuItemCard from '@/components/menu/MenuItemCard';
import EditGuestModal from '@/components/modals/EditGuestModal';
import EditTableModal from '@/components/modals/EditTableModal';
import { Button } from '@/components/ui/Button';
import { Settings, UserPlus, ShoppingCart, List, AlertTriangle, Trash2, Pencil, Plus } from 'lucide-react';
import DarkModeToggle from '@/components/common/DarkModeToggle';
import { Skeleton } from '@/components/ui/skeleton';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { TableStorage } from '@/api/localStorageHelpers/tables';
import { GuestStorage } from '@/api/localStorageHelpers/guests';
import { MenuStorage } from '@/api/localStorageHelpers/menu';
import { OrderStorage } from '@/api/localStorageHelpers/orders';
import { AppContext } from '@/context/AppContext';

export default function TableDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const tableId = urlParams.get('id');

  const { menuItems: ctxMenuItems } = useContext(AppContext);

  const [table, setTable] = useState(null);
  const [guests, setGuests] = useState([]);
  const [menuItems, setMenuItems] = useState(ctxMenuItems || []);
  const [prefixedMenus, setPrefixedMenus] = useState([]);
  const [menuSource, setMenuSource] = useState('default');
  const [partyMenus, setPartyMenus] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [activeGuestId, setActiveGuestId] = useState(null);
  const [activeTab, setActiveTab] = useState('menu');
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedItem, setExpandedItem] = useState(null);
  const [collapsedCourses, setCollapsedCourses] = useState({});
  const [editGuestModal, setEditGuestModal] = useState({ open: false, guest: null });
  const [editTableModal, setEditTableModal] = useState(false);
  const [editOrderModal, setEditOrderModal] = useState({ open: false, item: null, notes: '', mods: [] });
  const courseOptions = ['Unassigned', 'Course 1', 'Course 2', 'Course 3', 'Course 4', 'Course 5'];
  const touchStartX = useRef(null);

  // Load table info
  useEffect(() => {
    if (!tableId) return;
    const t = TableStorage.getTable(tableId);
    setTable(t);
  }, [tableId]);

  // Load guests
  useEffect(() => {
    if (!tableId) return;
    const gs = GuestStorage.getGuests(tableId);
    setGuests(gs);
    if (gs.length > 0 && !activeGuestId) setActiveGuestId(gs[0].id);
  }, [tableId]);

  // Load menu items (initial) and sync with context updates
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const items = await MenuStorage.getMenuItems();
        if (mounted) setMenuItems(items || []);
      } catch (err) {
        console.error('Failed to load menu items:', err);
        if (mounted) setMenuItems([]);
      }

      try {
        if (typeof MenuStorage.getPartyMenus === 'function') {
          const parties = await MenuStorage.getPartyMenus();
          if (mounted) setPartyMenus(parties || []);
        } else if (mounted) {
          setPartyMenus([]);
        }
      } catch (err) {
        console.error('Failed to load party menus:', err);
        if (mounted) setPartyMenus([]);
      }

      try {
        if (typeof MenuStorage.getPrefixedMenus === 'function') {
          const pref = await MenuStorage.getPrefixedMenus();
          if (mounted) setPrefixedMenus(pref || []);
        }
      } catch (err) {
        console.error('Failed to load prefixed menus:', err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setMenuItems(ctxMenuItems || []);
  }, [ctxMenuItems]);

  // Load existing orders
  useEffect(() => {
    if (!tableId) return;
    const items = OrderStorage.getOrderItemsByTable(tableId);
    setOrderItems(items);
  }, [tableId]);

  const activeGuest = guests.find(g => g.id === activeGuestId);
  const guestAllergens = [
    ...(activeGuest?.allergens || []),
    ...(activeGuest?.custom_allergens || [])
  ];

  const taxRatePercent = table?.tax_rate === '' || table?.tax_rate === undefined ? 13 : Number(table.tax_rate) || 0;
  const taxRate = taxRatePercent / 100;
  const tableBudgetTotal = Number(table?.budget_total) || 0;
  const tableBudgetPerGuest = Number(table?.budget_per_guest) || 0;
  const guestCount = guests.length || Number(table?.guest_count) || 0;
  const effectiveBudget = tableBudgetTotal || (tableBudgetPerGuest && guestCount ? tableBudgetPerGuest * guestCount : 0);
  const tableOrderTotal = orderItems.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (item.quantity || 1),
    0
  );
  const taxAmount = tableOrderTotal * taxRate;
  const totalWithTax = tableOrderTotal + taxAmount;
  const compareTotal = table?.budget_include_tax ? totalWithTax : tableOrderTotal;
  const budgetExceeded = effectiveBudget > 0 && compareTotal > effectiveBudget;
  const budgetRemaining = effectiveBudget > 0 ? effectiveBudget - compareTotal : null;

  const guestOrderItems = orderItems.filter(i => i.guest_id === activeGuestId);

  const filteredMenuItems = menuItems.filter(item => {
    if (activeCategory === 'all') return true;
    if (activeCategory.startsWith('party_')) return false;
    if (item.is_unavailable) return false;
    return item.category === activeCategory;
  }).sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }));

  const findMenuItemForOrderItem = (orderItem) => {
    if (!orderItem) return null;
    const targetId = orderItem.menu_item_id ?? orderItem.id;
    const byId = targetId
      ? menuItems.find((mi) => `${mi.id}` === `${targetId}`)
      : null;
    if (byId) return byId;
    if (orderItem.menu_item_name) {
      const nameLower = (orderItem.menu_item_name || '').toLowerCase();
      return menuItems.find((mi) => (mi.name || '').toLowerCase() === nameLower) || null;
    }
    return null;
  };

  const handleAddGuest = () => {
    const newGuestNumber = guests.length + 1;
    const newGuest = GuestStorage.createGuest({
      table_id: tableId,
      guest_number: newGuestNumber,
    });
    TableStorage.updateTable(tableId, { guest_count: newGuestNumber, status: 'occupied' });
    setGuests(prev => [...prev, newGuest]);
    setTable(TableStorage.getTable(tableId));
  };

  const handleSaveGuest = (guestData) => {
    GuestStorage.updateGuest(guestData.id, guestData);
    setGuests(GuestStorage.getGuests(tableId));
  };

  const handleSaveTable = (tableData) => {
    TableStorage.updateTable(tableData.id, tableData);
    setTable(TableStorage.getTable(tableData.id));
  };

  const handleAddToOrder = (itemData) => {
    const orderItem = OrderStorage.createOrderItem({
      ...itemData,
      table_id: tableId,
      guest_id: activeGuestId,
      status: 'pending',
    });
    setOrderItems(prev => [...prev, orderItem]);
    toast.success(`Added ${itemData.menu_item_name}`);
  };

  const handleRemoveFromOrder = (menuItemId) => {
    const item = orderItems.find(i => i.menu_item_id === menuItemId && i.guest_id === activeGuestId);
    if (item) {
      OrderStorage.deleteOrderItem(item.id);
      setOrderItems(prev => prev.filter(i => i.id !== item.id));
      toast.success('Item removed');
    }
  };

  const handleRemoveItem = (index) => {
    const item = orderItems[index];
    if (item) OrderStorage.deleteOrderItem(item.id);
    setOrderItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateCourse = (orderItemId, course) => {
    OrderStorage.updateOrderItem(orderItemId, { course });
    setOrderItems(prev => prev.map(i => i.id === orderItemId ? { ...i, course } : i));
  };

  const openEditOrder = (item) => {
    setEditOrderModal({
      open: true,
      item,
      notes: item.custom_notes || '',
      mods: item.modifications || [],
    });
  };

  const saveEditOrder = () => {
    const item = editOrderModal.item;
    if (!item) return;
    OrderStorage.updateOrderItem(item.id, { custom_notes: editOrderModal.notes, modifications: editOrderModal.mods || [] });
    setOrderItems(prev => prev.map(i => i.id === item.id ? { ...i, custom_notes: editOrderModal.notes, modifications: editOrderModal.mods || [] } : i));
    setEditOrderModal({ open: false, item: null, notes: '', mods: [] });
    toast.success('Item updated');
  };

  if (!table) {
    return (
      <div className="min-h-screen bg-stone-50 pb-24">
        <Skeleton className="h-14 w-full" />
        <div className="p-4 space-y-4">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-24">
      {/* Main content: stacked full-width sections */}
      <div className="px-0 pb-4 space-y-6">
        {/* Guests */}
        <div className="w-full sticky top-0 z-50 bg-stone-50 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800">
          {/* Table header (sticky) */}
          <div className="px-4 flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="p-1 text-stone-700 hover:text-stone-900"
                aria-label="Go back"
              >
                &lt;
              </button>
              <div>
                <h3 className="text-lg font-semibold text-stone-900">Table {table?.table_number}</h3>
                {table?.section ? <p className="text-xs text-stone-500">Section: {table.section}</p> : null}
                {effectiveBudget > 0 && (
                  <p className={cn(
                    "text-xs",
                    budgetExceeded ? "text-red-600" : "text-stone-500"
                  )}>
                    Budget {budgetExceeded ? "exceeded" : "limit"}: ${effectiveBudget.toFixed(2)} | Spent: ${compareTotal.toFixed(2)} {table?.budget_include_tax ? "(with tax)" : "(pre-tax)"}
                    {budgetRemaining !== null && !budgetExceeded && ` | Remaining: $${budgetRemaining.toFixed(2)}`}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <DarkModeToggle />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-stone-900"
                onClick={(e) => { e.stopPropagation(); setEditTableModal(true); }}
                onTouchStart={(e) => { e.stopPropagation(); setEditTableModal(true); }}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Sticky guest tabs only */}
        <div className="w-full sticky top-[56px] z-40 px-4 bg-stone-50 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 py-1">
          <div className="flex items-center gap-2 py-1">
            <div className="flex-1 flex gap-2 overflow-x-auto">
              {guests.map((g) => {
                const count = orderItems.filter(i => i.guest_id === g.id).reduce((s, it) => s + (it.quantity || 1), 0);
                return (
                  <GuestTab
                    key={g.id}
                    guest={g}
                    isActive={g.id === activeGuestId}
                    onClick={() => setActiveGuestId(g.id)}
                    hasAllergens={(g.allergens?.length || g.custom_allergens?.length) > 0}
                    onEdit={(guest) => setEditGuestModal({ open: true, guest })}
                    orderCount={count}
                  />
                );
              })}
            </div>
            <Button
              type="button"
              size="icon"
              onClick={handleAddGuest}
              className="shrink-0 rounded-full bg-amber-700 hover:bg-amber-800 text-white w-10 h-10"
              aria-label="Add guest"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Menu */}
        <div className="w-full px-4">
          <div className="flex items-center justify-between py-2 bg-stone-50 dark:bg-stone-900">
            <h3 className="font-semibold text-stone-900">
              Menu{activeGuest ? ` | s${activeGuest.guest_number || ''}` : ''}
            </h3>
            <div className="flex items-center gap-2">
              <Select
                value={menuSource}
                onValueChange={setMenuSource}
                className="rounded-lg text-sm px-2 py-1 border border-stone-200"
              >
                <option value="default">Default Menu</option>
                {prefixedMenus.map((m) => (
                  <option key={m.id} value={m.id}>{m.name || 'Pre-Fixed Menu'}</option>
                ))}
              </Select>
              <div className="text-sm text-stone-500">
                {menuSource === 'default'
                  ? `${filteredMenuItems.length} items`
                  : `${prefixedMenus.find((m) => m.id === menuSource)?.courses?.length || 0} courses`}
              </div>
            </div>
          </div>

          {menuSource === 'default' && (
            <div className="sticky top-[104px] z-30 py-3 bg-stone-50 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800">
              <CategoryTabs
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
                partyMenus={partyMenus}
                containerClassName="px-4 py-0"
                innerClassName="flex gap-2 overflow-x-auto w-full"
                buttonClassName="px-3 py-2 rounded-xl capitalize whitespace-nowrap text-stone-900"
              />
            </div>
          )}

            {menuSource === 'default' ? (
              <div
                className="mt-3 space-y-4"
                onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
                onTouchEnd={(e) => {
                  if (touchStartX.current === null) return;
                  const delta = e.changedTouches[0].clientX - touchStartX.current;
                  const threshold = 40;
                  if (Math.abs(delta) > threshold) {
                    const sortedGuests = [...guests].sort((a, b) => (a.guest_number || 0) - (b.guest_number || 0));
                    const currentIndex = sortedGuests.findIndex(g => g.id === activeGuestId);
                    if (delta < 0 && currentIndex < sortedGuests.length - 1) {
                      setActiveGuestId(sortedGuests[currentIndex + 1]?.id);
                    } else if (delta > 0 && currentIndex > 0) {
                      setActiveGuestId(sortedGuests[currentIndex - 1]?.id);
                    }
                  }
                  touchStartX.current = null;
                }}
              >
                {Object.entries(
                  filteredMenuItems.reduce((acc, item) => {
                    const key = item.category || item.category_slug || 'other';
                    acc[key] = acc[key] || [];
                    acc[key].push(item);
                    return acc;
                  }, {})
                ).map(([cat, items]) => (
                  <div key={cat} className="space-y-2">
                    <h3 className="font-semibold text-stone-900 capitalize px-1">{cat}</h3>
                    <div className="space-y-2">
                      {items.map(item => {
                        const existing = guestOrderItems.find(i => i.menu_item_id === item.id);
                        const isSelected = !!existing;
                        const selectedQuantity = existing?.quantity || 0;

                        return (
                          <MenuItemCard
                            key={item.id}
                            item={item}
                            guestAllergens={guestAllergens}
                            isSelected={isSelected}
                            selectedQuantity={selectedQuantity}
                            selectedOrderItem={existing}
                            onEditSelected={openEditOrder}
                            isExpanded={expandedItem === item.id}
                            onToggleExpand={(id) => setExpandedItem(id)}
                            onAddToOrder={(data) => {
                              if (!activeGuestId) {
                                toast.error('Select a guest first');
                                return;
                              }
                              const orderItem = OrderStorage.createOrderItem({
                                ...data,
                                table_id: tableId,
                                guest_id: activeGuestId,
                                status: 'pending',
                              });
                              setOrderItems(prev => [...prev, orderItem]);
                              toast.success(`Added ${data.menu_item_name}`);
                            }}
                            onRemoveFromOrder={(menuItemId) => {
                              if (!activeGuestId) return;
                              const itemToRemove = guestOrderItems.find(i => i.menu_item_id === menuItemId);
                              if (!itemToRemove) return;
                              OrderStorage.deleteOrderItem(itemToRemove.id);
                              setOrderItems(prev => prev.filter(i => i.id !== itemToRemove.id));
                              toast.success('Removed item');
                            }}
                            onUpdateQuantity={(menuItemId, qty) => {
                              if (!activeGuestId) return;
                              const itemToUpdate = guestOrderItems.find(i => i.menu_item_id === menuItemId);
                              if (!itemToUpdate) return;
                              if (qty <= 0) {
                                OrderStorage.deleteOrderItem(itemToUpdate.id);
                                setOrderItems(prev => prev.filter(i => i.id !== itemToUpdate.id));
                              } else {
                                OrderStorage.updateOrderItem(itemToUpdate.id, { quantity: qty });
                                setOrderItems(prev => prev.map(i => i.id === itemToUpdate.id ? { ...i, quantity: qty } : i));
                              }
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
            <div
              className="mt-3 space-y-3"
              onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
              onTouchEnd={(e) => {
                if (touchStartX.current === null) return;
                const delta = e.changedTouches[0].clientX - touchStartX.current;
                const threshold = 40;
                if (Math.abs(delta) > threshold) {
                  const sortedGuests = [...guests].sort((a, b) => (a.guest_number || 0) - (b.guest_number || 0));
                  const currentIndex = sortedGuests.findIndex(g => g.id === activeGuestId);
                  if (delta < 0 && currentIndex < sortedGuests.length - 1) {
                    setActiveGuestId(sortedGuests[currentIndex + 1]?.id);
                  } else if (delta > 0 && currentIndex > 0) {
                    setActiveGuestId(sortedGuests[currentIndex - 1]?.id);
                  }
                }
                touchStartX.current = null;
              }}
            >
              {(() => {
                const selected = prefixedMenus.find(m => m.id === menuSource);
                if (!selected) return <p className="text-sm text-stone-500">No menu selected.</p>;
                return (selected.courses || []).map(course => (
                  <div key={course.course} className="border border-stone-200 rounded-xl p-3">
                    {(() => {
                      const existingCourse = guestOrderItems.find(i => i.course === course.course);
                      const isCollapsed = collapsedCourses[activeGuestId]?.[course.course] ?? false;
                      const selectedLabel = existingCourse?.menu_item_name
                        ? ` — ${existingCourse.menu_item_name}`
                        : "";
                      return (
                        <>
                          <button
                            type="button"
                            className="w-full flex items-center justify-between text-left gap-2"
                            onClick={() =>
                              setCollapsedCourses(prev => ({
                                ...prev,
                                [activeGuestId]: {
                                  ...(prev[activeGuestId] || {}),
                                  [course.course]: !isCollapsed,
                                },
                              }))
                            }
                          >
                            <h4 className="font-semibold text-sm">
                              {course.course}
                              <span className="text-xs text-stone-500">{selectedLabel}</span>
                            </h4>
                            <span className="text-xs text-stone-500">
                              {isCollapsed ? 'Tap to edit' : `${course.items?.length || 0} options`}
                            </span>
                          </button>
                          {!isCollapsed && (
                            <div className="mt-2 space-y-2">
                              {(course.items || []).map(item => {
                                const fullItem = menuItems.find((mi) => mi.id === item.id);
                                if (fullItem?.is_unavailable) return null;
                                const existingForCourse = guestOrderItems.find(i => i.course === course.course);
                                const isSelected = existingForCourse?.menu_item_id === item.id;
                                const selectedQuantity = isSelected ? (existingForCourse?.quantity || 0) : 0;
                                const syntheticItem = {
                                  id: item.id,
                                  name: item.name,
                                  category: fullItem?.category || fullItem?.category_slug || item.category || (course.course.toLowerCase().includes('steak') ? 'steaks' : course.course),
                                  price: 0,
                                  description: '',
                                  allergens: fullItem?.allergens || item.allergens || [],
                                };
                                return (
                                  <MenuItemCard
                                    key={`${course.course}-${item.id}`}
                                    item={syntheticItem}
                                    guestAllergens={guestAllergens}
                                    showAllergenBadges={false}
                                    isSelected={isSelected}
                                    selectedQuantity={selectedQuantity}
                                    selectedOrderItem={isSelected ? existingForCourse : null}
                                    onEditSelected={openEditOrder}
                                    isExpanded={expandedItem === syntheticItem.id}
                                    onToggleExpand={(id) => setExpandedItem(id)}
                                    onAddToOrder={(data) => {
                                      if (!activeGuestId) {
                                        toast.error('Select a guest first');
                                        return;
                                      }
                                      const existing = guestOrderItems.find(i => i.course === course.course);
                                      if (existing) {
                                        OrderStorage.deleteOrderItem(existing.id);
                                        setOrderItems(prev => prev.filter(i => i.id !== existing.id));
                                      }
                                      const orderItem = OrderStorage.createOrderItem({
                                        ...data,
                                        table_id: tableId,
                                        guest_id: activeGuestId,
                                        status: 'pending',
                                        course: course.course,
                                      });
                                      setOrderItems(prev => [...prev, orderItem]);
                                      setCollapsedCourses(prev => ({
                                        ...prev,
                                        [activeGuestId]: {
                                          ...(prev[activeGuestId] || {}),
                                          [course.course]: true,
                                        },
                                      }));
                                      toast.success(`Added ${data.menu_item_name}`);
                                    }}
                                    onRemoveFromOrder={(menuItemId) => {
                                      if (!activeGuestId) return;
                                      const itemToRemove = guestOrderItems.find(i => i.course === course.course);
                                      if (!itemToRemove) return;
                                      OrderStorage.deleteOrderItem(itemToRemove.id);
                                      setOrderItems(prev => prev.filter(i => i.id !== itemToRemove.id));
                                      setCollapsedCourses(prev => ({
                                        ...prev,
                                        [activeGuestId]: {
                                          ...(prev[activeGuestId] || {}),
                                          [course.course]: false,
                                        },
                                      }));
                                      toast.success('Removed item');
                                    }}
                                    onUpdateQuantity={(menuItemId, qty) => {
                                      if (!activeGuestId) return;
                                      const itemToUpdate = guestOrderItems.find(i => i.course === course.course && i.menu_item_id === menuItemId);
                                      if (!itemToUpdate) return;
                                      if (qty <= 0) {
                                        OrderStorage.deleteOrderItem(itemToUpdate.id);
                                        setOrderItems(prev => prev.filter(i => i.id !== itemToUpdate.id));
                                        setCollapsedCourses(prev => ({
                                          ...prev,
                                          [activeGuestId]: {
                                            ...(prev[activeGuestId] || {}),
                                            [course.course]: false,
                                          },
                                        }));
                                      } else {
                                        OrderStorage.updateOrderItem(itemToUpdate.id, { quantity: qty });
                                        setOrderItems(prev => prev.map(i => i.id === itemToUpdate.id ? { ...i, quantity: qty } : i));
                                      }
                                    }}
                                  />
                                );
                              })}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                ));
              })()}
            </div>
          )}
        </div>

        {/* Orders */}
        <div className="w-full px-4">
          <div className="sticky top-12 z-10 flex items-center justify-between py-2 bg-stone-50">
            <h3 className="font-semibold">Current Order</h3>
            <div className="text-sm text-stone-500">{guestOrderItems.length} items</div>
          </div>
          <>
              {budgetExceeded && (
                <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                  Budget exceeded: ${compareTotal.toFixed(2)} {table?.budget_include_tax ? "(with tax)" : "(pre-tax)"} vs ${effectiveBudget.toFixed(2)} limit
                </div>
              )}
              {guestAllergens.length > 0 && (
                <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                  Allergy alert: {guestAllergens.join(", ")}
                </div>
              )}

              {activeGuest ? (
                <div className="space-y-2">
                  {guestOrderItems.length === 0 && (
                    <p className="text-sm text-stone-500">No items for this guest</p>
                  )}

                  {guestOrderItems.map((item) => (
                    <div key={item.id} className="rounded-xl border border-stone-100 bg-stone-50 p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium">{item.menu_item_name}{(item.quantity && item.quantity > 1) ? ` x ${item.quantity}` : ''}</div>
                          {item.custom_notes && <div className="text-xs text-stone-500">{item.custom_notes}</div>}
                          {item.modifications?.length > 0 && (
                            <div className="text-xs text-stone-500 mt-0.5">Mods: {item.modifications.join(', ')}</div>
                          )}
                          <div className="mt-2">
                            <Select
                              value={item.course || 'Unassigned'}
                              onValueChange={(val) => handleUpdateCourse(item.id, val === 'Unassigned' ? '' : val)}
                              className="text-xs rounded-lg h-8"
                            >
                              {courseOptions.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </Select>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-amber-700 font-bold">${(item.price * (item.quantity || 1)).toFixed(2)}</div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={(e) => { e.stopPropagation(); openEditOrder(item); }}
                            onTouchStart={(e) => { e.stopPropagation(); openEditOrder(item); }}
                            onTouchEnd={(e) => { e.stopPropagation(); openEditOrder(item); }}
                            aria-label="Edit item"
                          >
                            <Pencil className="h-4 w-4 text-stone-600" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleRemoveFromOrder(item.menu_item_id)} aria-label="Remove item">
                            <Trash2 className="h-4 w-4 text-stone-600" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-stone-500">Select a guest to see orders</p>
              )}
          </>
        </div>
      </div>
      {/* Modals */}
      <EditGuestModal
        open={editGuestModal.open}
        guest={editGuestModal.guest}
        onClose={() => setEditGuestModal({ open: false, guest: null })}
        onSave={(guestData) => {
          handleSaveGuest(guestData);
          setEditGuestModal({ open: false, guest: null });
        }}
      />

      <EditTableModal
        open={editTableModal}
        table={table}
        onClose={() => setEditTableModal(false)}
        onSave={(tableData) => {
          handleSaveTable(tableData);
          setEditTableModal(false);
        }}
      />

      <Dialog
        open={editOrderModal.open}
        onOpenChange={(open) => {
          if (!open) setEditOrderModal({ open: false, item: null, notes: '', mods: [] });
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit item</DialogTitle>
          </DialogHeader>
          {editOrderModal.item ? (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-stone-900">{editOrderModal.item.menu_item_name}</p>
                {(() => {
                  const matchedMenu = findMenuItemForOrderItem(editOrderModal.item);
                  const mods = matchedMenu?.common_mods || matchedMenu?.common_modifications || [];
                  return (
                    <div className="space-y-2 mt-2">
                      <div className="text-xs text-stone-500">Common mods</div>
                      {mods.length > 0 ? (
                        <>
                          <div className="flex flex-wrap gap-2">
                            {mods.map((mod) => {
                              const selected = (editOrderModal.mods || []).includes(mod);
                              return (
                                <button
                                  key={mod}
                                  type="button"
                                  className={cn(
                                    "text-xs px-2 py-1 rounded-full border",
                                    selected
                                      ? "bg-amber-100 border-amber-300 text-amber-800"
                                      : "bg-stone-200 border-stone-300 text-stone-700 hover:bg-stone-300"
                                  )}
                                  onClick={() => {
                                    setEditOrderModal((prev) => {
                                      const current = new Set(prev.mods || []);
                                      if (current.has(mod)) current.delete(mod);
                                      else current.add(mod);
                                      return { ...prev, mods: Array.from(current) };
                                    });
                                  }}
                                >
                                  {mod}
                                </button>
                              );
                            })}
                          </div>
                          {(editOrderModal.mods || []).length > 0 && (
                            <div className="text-xs text-stone-600">
                              Applied: {(editOrderModal.mods || []).join(", ")}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-xs text-stone-500">No saved mods for this item</div>
                      )}
                    </div>
                  );
                })()}
                {editOrderModal.item.modifications?.length ? (
                  <p className="text-xs text-stone-500 mt-1">Mods: {editOrderModal.item.modifications.join(', ')}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  value={editOrderModal.notes}
                  onChange={(e) => setEditOrderModal(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add special instructions"
                />
              </div>
            </div>
          ) : null}
          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setEditOrderModal({ open: false, item: null, notes: '' })}>
              Cancel
            </Button>
            <Button onClick={saveEditOrder}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
