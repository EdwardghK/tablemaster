import React, { useState, useEffect, useContext } from 'react';
import { cn } from '@/utils';
import BottomNav from '@/components/common/BottomNav';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { WheelPicker, WheelPickerWrapper } from '@/components/wheel-picker';
import { toast } from 'sonner';
import { TableStorage } from '@/api/localStorageHelpers/tables';
import { GuestStorage } from '@/api/localStorageHelpers/guests';
import { MenuStorage } from '@/api/localStorageHelpers/menu';
import { OrderStorage } from '@/api/localStorageHelpers/orders';
import { AppContext } from '@/context/AppContext';
import { ChangeRequests } from '@/api/changeRequests';

export default function TableDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const tableId = urlParams.get('id');

  const {
    menuItems: ctxMenuItems,
    requiresApproval,
    user,
  } = useContext(AppContext);

  const [table, setTable] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [guests, setGuests] = useState([]);
  const [menuItems, setMenuItems] = useState(ctxMenuItems || []);
  const [prefixedMenus, setPrefixedMenus] = useState([]);
  const [menuSource, setMenuSource] = useState('default');
  const [partyMenus, setPartyMenus] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [activeGuestId, setActiveGuestId] = useState(null);
  const [activeTab, setActiveTab] = useState('menu');
  const [activeCategory, setActiveCategory] = useState('all');
  const [steakOriginFilter, setSteakOriginFilter] = useState('all');
  const [expandedItem, setExpandedItem] = useState(null);
  const [collapsedCourses, setCollapsedCourses] = useState({});
  const [editGuestModal, setEditGuestModal] = useState({ open: false, guest: null });
  const [editTableModal, setEditTableModal] = useState(false);
  const [editOrderModal, setEditOrderModal] = useState({ open: false, item: null, notes: '', mods: [] });
  const courseOptions = ['Unassigned', 'Course 1', 'Course 2', 'Course 3', 'Course 4', 'Course 5'];

  // Load table info
  useEffect(() => {
    if (!tableId) return;
    (async () => {
      try {
        const primary = await TableStorage.getTable(tableId);
        setTable(primary);
        setLoadError('');
      } catch (err) {
        console.error('Failed to load table:', err);
        setTable(null);
        setLoadError('Table not found or you do not have access.');
      }
    })();
  }, [tableId]);

  // Load guests
  useEffect(() => {
    if (!tableId) return;
    (async () => {
      const gs = await GuestStorage.getGuests(tableId);
      setGuests(gs);
      if (gs.length > 0 && !activeGuestId) setActiveGuestId(gs[0].id);
    })();
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
    (async () => {
      const items = await OrderStorage.getOrderItemsByTable(tableId);
      setOrderItems(items);
    })();
  }, [tableId]);

  useEffect(() => {
    if (activeCategory !== 'steaks' && steakOriginFilter !== 'all') {
      setSteakOriginFilter('all');
    }
  }, [activeCategory, steakOriginFilter]);

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
    const catMatch = item.category === activeCategory;
    if (!catMatch) return false;
    if (activeCategory === 'steaks' && steakOriginFilter !== 'all') {
      const originText = (item.origin || '').toLowerCase();
      const countryText = (item.country || '').toLowerCase();
      const namePrefix = (item.name || '').split('-')[0].trim().toLowerCase();
      const key = (steakOriginFilter || '').toLowerCase();

      const tokenMap = {
        canada: ['cad', 'canada', 'high river', 'winnipeg', 'pei', 'martin farm', 'elora', 'ontario', 'alberta', 'manitoba'],
        us: ['us', 'usa', 'united states'],
        australia: ['aus', 'australia', 'queensland', 'victoria'],
        japan: ['jap', 'japan', 'miyazaki', 'hyogo', 'prefecture'],
      };

      const containsToken = (text, token) => {
        if (!text || !token) return false;
        return token.includes(' ')
          ? text.includes(token)
          : text.split(/[\s,]+/).some(part => part === token);
      };

      const tokens = tokenMap[key] || [key];
      const matched = tokens.some(token =>
        countryText === token ||
        containsToken(originText, token) ||
        containsToken(namePrefix, token)
      );

      if (key === 'us' && countryText === 'aus') return false;
      return matched;
    }
    return true;
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

  const handleAddGuest = async () => {
    const newGuestNumber = guests.length + 1;
    const newGuest = await GuestStorage.createGuest({
      table_id: tableId,
      guest_number: newGuestNumber,
    });
    await TableStorage.updateTable(tableId, { guest_count: newGuestNumber, status: 'occupied' });
    setGuests(prev => [...prev, newGuest]);
    setTable(await TableStorage.getTable(tableId));
  };

  const handleSaveGuest = async (guestData) => {
    try {
      await GuestStorage.updateGuest(guestData.id, guestData);
      setGuests(await GuestStorage.getGuests(tableId));
      toast.success('Guest updated');
    } catch (err) {
      console.error('update guest failed', err);
      toast.error(err?.message || 'Could not save guest');
    }
  };

  const handleSaveTable = async (tableData) => {
    if (requiresApproval) {
      const before = table;
      await ChangeRequests.submit({
        user,
        entityType: 'table',
        entityId: tableData.id,
        action: 'update',
        beforeData: before,
        afterData: tableData,
      });
      toast.success('Changes submitted for approval. They will apply after admin review.');
    } else {
      await TableStorage.updateTable(tableData.id, tableData);
      setTable(await TableStorage.getTable(tableData.id));
    }
  };

  const handleAddToOrder = async (itemData) => {
    const orderItem = await OrderStorage.createOrderItem({
      ...itemData,
      table_id: tableId,
      guest_id: activeGuestId,
      status: 'pending',
    });
    setOrderItems(prev => [...prev, orderItem]);
    toast.success(`Added ${itemData.menu_item_name}`);
  };

  const handleRemoveFromOrder = async (menuItemId) => {
    const item = orderItems.find(i => i.menu_item_id === menuItemId && i.guest_id === activeGuestId);
    if (item) {
      await OrderStorage.deleteOrderItem(item.id);
      setOrderItems(prev => prev.filter(i => i.id !== item.id));
      toast.success('Item removed');
    }
  };

  const handleRemoveItem = async (index) => {
    const item = orderItems[index];
    if (item) await OrderStorage.deleteOrderItem(item.id);
    setOrderItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateCourse = async (orderItemId, course) => {
    await OrderStorage.updateOrderItem(orderItemId, { course });
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

  const saveEditOrder = async () => {
    const item = editOrderModal.item;
    if (!item) return;
    await OrderStorage.updateOrderItem(item.id, { custom_notes: editOrderModal.notes, modifications: editOrderModal.mods || [] });
    setOrderItems(prev => prev.map(i => i.id === item.id ? { ...i, custom_notes: editOrderModal.notes, modifications: editOrderModal.mods || [] } : i));
    setEditOrderModal({ open: false, item: null, notes: '', mods: [] });
    toast.success('Item updated');
  };

  const handleDeleteTable = async () => {
    if (!table?.id) return;
    const confirmed = window.confirm('Delete this table? This removes it for everyone.');
    if (!confirmed) return;

    try {
      await TableStorage.deleteTable(table.id);
      toast.success('Table deleted');
      window.history.back();
      setEditTableModal(false);
    } catch (err) {
      console.error('Delete table failed:', err);
      toast.error(err?.message || 'Could not delete table');
    }
  };

  if (!table) {
    return (
      <div className="min-h-screen bg-stone-50 pb-24">
        <Skeleton className="h-14 w-full" />
        <div className="p-4 space-y-4">
          {loadError ? (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
              {loadError}
            </div>
          ) : (
            <>
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-48 w-full rounded-2xl" />
            </>
          )}
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

        {/* Sticky guest picker */}
        <div className="w-full sticky top-[56px] z-40 px-4 bg-stone-50 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 py-1">
          {(() => {
            const sortedGuests = [...guests].sort((a, b) => (a.guest_number || 0) - (b.guest_number || 0));
            const currentIndex = sortedGuests.findIndex(g => g.id === activeGuestId);
            const currentGuest = currentIndex >= 0 ? sortedGuests[currentIndex] : sortedGuests[0];
            const currentCount = currentGuest
              ? orderItems.filter(i => i.guest_id === currentGuest.id).reduce((s, it) => s + (it.quantity || 1), 0)
              : 0;
            const currentHasAllergens = currentGuest
              ? (currentGuest.allergens?.length || currentGuest.custom_allergens?.length) > 0
              : false;

            return (
              <div className="flex items-center gap-2 py-1">
                <div className="flex-1 min-w-0">
                  <div className="relative rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-2 py-1.5">
                    {sortedGuests.length > 0 ? (
                      <WheelPickerWrapper className="w-full max-w-full border-none bg-transparent px-0 shadow-none">
                        <div className="mx-auto w-full max-w-xs">
                          <div className="-rotate-90">
                            <WheelPicker
                              options={sortedGuests.map((guest) => ({
                                label: `s${guest.guest_number || ''}`,
                                value: guest.id,
                              }))}
                              value={currentGuest?.id}
                              onValueChange={(val) => setActiveGuestId(val)}
                              visibleCount={5}
                              optionItemHeight={32}
                              classNames={{
                                optionItem: "rotate-90 text-sm text-stone-500 dark:text-stone-400",
                                highlightWrapper: "bg-amber-100/70 text-amber-900 dark:bg-amber-900/60 dark:text-amber-100",
                                highlightItem: "rotate-90 font-semibold",
                              }}
                            />
                          </div>
                        </div>
                      </WheelPickerWrapper>
                    ) : (
                      <div className="text-sm text-stone-500 text-center py-1">No guests</div>
                    )}

                    {currentGuest ? (
                      <button
                        type="button"
                        className="mt-1 w-full flex items-center justify-center gap-2 text-xs text-stone-500 dark:text-stone-300"
                        onClick={() => setEditGuestModal({ open: true, guest: currentGuest })}
                        aria-label="Edit current guest"
                      >
                        <span>{currentCount} items</span>
                        {currentHasAllergens && (
                          <span className="inline-flex items-center gap-1 text-red-500">
                            <span className="inline-block w-2 h-2 rounded-full bg-red-500" aria-hidden="true" />
                            Allergens
                          </span>
                        )}
                      </button>
                    ) : null}
                  </div>
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
            );
          })()}
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
              {activeCategory === 'steaks' && (
                <div className="mt-2 px-1 flex gap-2 overflow-x-auto">
                  {['all', 'canada', 'us', 'australia', 'japan'].map((origin) => (
                    <button
                      key={origin}
                      type="button"
                      onClick={() => setSteakOriginFilter(origin)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-semibold border",
                        steakOriginFilter === origin
                          ? "bg-amber-700 text-white border-amber-700"
                          : "bg-white text-stone-700 border-stone-200 dark:bg-stone-800 dark:text-stone-200 dark:border-stone-700"
                      )}
                    >
                      {origin === 'us' ? 'US' : origin[0].toUpperCase() + origin.slice(1)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

            {menuSource === 'default' ? (
              <div className="mt-3 space-y-4">
                {(() => {
                  const categoryOrder = [
                    'appetizers',
                    'salads',
                    'caviar',
                    'chilled_seafood',
                    'steaks',
                    'main_courses',
                    'sides',
                    'additions',
                    'sauces',
                  ];
                  const grouped = filteredMenuItems.reduce((acc, item) => {
                    const key = item.category || item.category_slug || 'other';
                    acc[key] = acc[key] || [];
                    acc[key].push(item);
                    return acc;
                  }, {});
                  const ordered = Object.entries(grouped).sort(([aKey], [bKey]) => {
                    const ai = categoryOrder.indexOf(aKey);
                    const bi = categoryOrder.indexOf(bKey);
                    if (ai === -1 && bi === -1) return aKey.localeCompare(bKey);
                    if (ai === -1) return 1;
                    if (bi === -1) return -1;
                    return ai - bi;
                  });
                  return ordered.map(([cat, items]) => (
                  <div key={cat} className="space-y-2">
                    <h3 className="font-semibold text-stone-900 capitalize px-1">{cat}</h3>
                    <div className="space-y-2">
                      {(() => {
                        const sortedItems = (cat === 'steaks' && activeCategory === 'steaks')
                          ? [...items].sort((a, b) => {
                              const fa = (a.origin || '').toLowerCase();
                              const fb = (b.origin || '').toLowerCase();
                              if (fa !== fb) return fa.localeCompare(fb);
                              return (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' });
                            })
                          : items;

                        return sortedItems.map((item, idx, arr) => {
                          const existing = guestOrderItems.find(i => i.menu_item_id === item.id);
                          const isSelected = !!existing;
                          const selectedQuantity = existing?.quantity || 0;

                          const farmLabel = (cat === 'steaks' && activeCategory === 'steaks')
                            ? (item.origin || 'Steaks')
                            : null;
                          const prevFarm = idx > 0 ? (arr[idx - 1].origin || 'Steaks') : null;
                          const showFarmHeader = farmLabel && (idx === 0 || farmLabel !== prevFarm);

                          return (
                            <React.Fragment key={item.id}>
                              {showFarmHeader ? (
                                <div className="mt-2 text-sm font-semibold text-stone-700 uppercase">
                                  {farmLabel}
                                </div>
                              ) : null}
                              <MenuItemCard
                                item={item}
                                guestAllergens={guestAllergens}
                                isSelected={isSelected}
                                selectedQuantity={selectedQuantity}
                                selectedOrderItem={existing}
                                onEditSelected={openEditOrder}
                                isExpanded={expandedItem === item.id}
                                onToggleExpand={(id) => setExpandedItem(id)}
                                onAddToOrder={async (data) => {
                                  if (!activeGuestId) {
                                    toast.error('Select a guest first');
                                    return;
                                  }
                                  try {
                                    const orderItem = await OrderStorage.createOrderItem({
                                      ...data,
                                      table_id: tableId,
                                      guest_id: activeGuestId,
                                      status: 'pending',
                                    });
                                    setOrderItems(prev => [...prev, orderItem]);
                                    toast.success(`Added ${data.menu_item_name}`);
                                  } catch (err) {
                                    console.error('Add item failed:', err);
                                    toast.error(err?.message || 'Could not add item');
                                  }
                                }}
                                onRemoveFromOrder={async (menuItemId) => {
                                  if (!activeGuestId) return;
                                  const itemToRemove = guestOrderItems.find(i => i.menu_item_id === menuItemId);
                                  if (!itemToRemove) return;
                                  await OrderStorage.deleteOrderItem(itemToRemove.id);
                                  setOrderItems(prev => prev.filter(i => i.id !== itemToRemove.id));
                                  toast.success('Removed item');
                                }}
                                onUpdateQuantity={async (menuItemId, qty) => {
                                  if (!activeGuestId) return;
                                  const itemToUpdate = guestOrderItems.find(i => i.menu_item_id === menuItemId);
                                  if (!itemToUpdate) return;
                                  if (qty <= 0) {
                                    await OrderStorage.deleteOrderItem(itemToUpdate.id);
                                    setOrderItems(prev => prev.filter(i => i.id !== itemToUpdate.id));
                                  } else {
                                    await OrderStorage.updateOrderItem(itemToUpdate.id, { quantity: qty });
                                    setOrderItems(prev => prev.map(i => i.id === itemToUpdate.id ? { ...i, quantity: qty } : i));
                                  }
                                }}
                              />
                            </React.Fragment>
                          );
                        });
                      })()}
                    </div>
                  </div>
                  ));
                })()}
              </div>
            ) : (
            <div className="mt-3 space-y-3">
              {(() => {
                const selected = prefixedMenus.find(m => m.id === menuSource);
                if (!selected) return <p className="text-sm text-stone-500">No menu selected.</p>;
                return (selected.courses || []).map(course => (
                  <div key={course.course} className="border border-stone-200 rounded-xl p-3">
                    {(() => {
                      const formatCourseItemName = (itemRef) => {
                        if (!itemRef) return '';
                        const fullItem = menuItems.find((mi) =>
                          mi.id === itemRef.id || mi.id === itemRef.menu_item_id
                        );
                        const baseName = itemRef.name || itemRef.menu_item_name || fullItem?.name || '';
                        const weight = fullItem?.weight_oz ?? itemRef.weight_oz;
                        const country = fullItem?.country ?? itemRef.country;
                        const prefix = [
                          weight ? `${weight}oz` : '',
                          country || '',
                        ].filter(Boolean).join(' ');
                        return prefix ? `${prefix} ${baseName}` : baseName;
                      };
                      const existingCourse = guestOrderItems.find(i => i.course === course.course);
                      const isCollapsed = collapsedCourses[activeGuestId]?.[course.course] ?? false;
                      const selectedLabel = existingCourse
                        ? ` — ${formatCourseItemName(existingCourse)}`
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
                                const displayName = formatCourseItemName(item);
                                const syntheticItem = {
                                  id: item.id,
                                  name: displayName || item.name,
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
                                    onAddToOrder={async (data) => {
                                      if (!activeGuestId) {
                                        toast.error('Select a guest first');
                                        return;
                                      }
                                      const existing = guestOrderItems.find(i => i.course === course.course);
                                      if (existing) {
                                        await OrderStorage.deleteOrderItem(existing.id);
                                        setOrderItems(prev => prev.filter(i => i.id !== existing.id));
                                      }
                                      try {
                                        const orderItem = await OrderStorage.createOrderItem({
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
                                      } catch (err) {
                                        console.error('Add course item failed:', err);
                                        toast.error(err?.message || 'Could not add item');
                                      }
                                    }}
                                    onRemoveFromOrder={async (menuItemId) => {
                                      if (!activeGuestId) return;
                                      const itemToRemove = guestOrderItems.find(i => i.course === course.course);
                                      if (!itemToRemove) return;
                                      await OrderStorage.deleteOrderItem(itemToRemove.id);
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
                                    onUpdateQuantity={async (menuItemId, qty) => {
                                      if (!activeGuestId) return;
                                      const itemToUpdate = guestOrderItems.find(i => i.course === course.course && i.menu_item_id === menuItemId);
                                      if (!itemToUpdate) return;
                                      if (qty <= 0) {
                                        await OrderStorage.deleteOrderItem(itemToUpdate.id);
                                        setOrderItems(prev => prev.filter(i => i.id !== itemToUpdate.id));
                                        setCollapsedCourses(prev => ({
                                          ...prev,
                                          [activeGuestId]: {
                                            ...(prev[activeGuestId] || {}),
                                            [course.course]: false,
                                          },
                                        }));
                                      } else {
                                        await OrderStorage.updateOrderItem(itemToUpdate.id, { quantity: qty });
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
        onDelete={handleDeleteTable}
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
                <p className="text-sm font-medium text-stone-900 dark:text-stone-100">{editOrderModal.item.menu_item_name}</p>
                {(() => {
                  const matchedMenu = findMenuItemForOrderItem(editOrderModal.item);
                  const mods = matchedMenu?.common_mods || matchedMenu?.common_modifications || [];
                  return (
                    <div className="space-y-2 mt-2">
                      <div className="text-xs text-stone-500 dark:text-stone-300">Common mods</div>
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
                                      ? "bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-900/70 dark:border-amber-500/60 dark:text-amber-100"
                                      : "bg-stone-200 border-stone-300 text-stone-700 hover:bg-stone-300 dark:bg-stone-800 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-700"
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
                            <div className="text-xs text-stone-600 dark:text-stone-300">
                              Applied: {(editOrderModal.mods || []).join(", ")}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-xs text-stone-500 dark:text-stone-300">No saved mods for this item</div>
                      )}
                    </div>
                  );
                })()}
                {editOrderModal.item.modifications?.length ? (
                  <p className="text-xs text-stone-500 dark:text-stone-300 mt-1">Mods: {editOrderModal.item.modifications.join(', ')}</p>
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
