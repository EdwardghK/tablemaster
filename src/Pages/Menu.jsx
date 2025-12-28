import React, { useState, useEffect, useContext } from "react";
import Header from "@/components/common/Header";
import BottomNav from "@/components/common/BottomNav";
import { cn } from "@/utils";
import { AppContext } from "@/context/AppContext.jsx";
import { Button } from "@/components/ui/Button";
import { Plus, Trash2, Pencil } from "lucide-react";
import AllergenBadge, { COMMON_ALLERGENS } from "@/components/common/AllergenBadge";
import { ChangeRequests } from "@/api/changeRequests";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Label } from "@/components/ui/Label";
import { Checkbox } from "@/components/ui/Checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { toast } from "sonner";
import { MenuStorage } from "@/api/localStorageHelpers/menu";

// Must match Supabase slugs from menu_categories table
const CATEGORIES = [
  "appetizers",
  "salads",
  "caviar",
  "chilled_seafood",
  "steaks",
  "main_courses",
  "sides",
  "additions",
  "sauces",
];

// ----------------- Main Component -----------------
export default function MenuPage() {
  const {
    menuItems: ctxMenuItems,
    setMenuItems: setCtxMenuItems,
    requiresApproval,
    user,
  } = useContext(AppContext);

  const [menuItems, setMenuItems] = useState(ctxMenuItems || []);
  const [prefixedMenu, setPrefixedMenu] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [itemModal, setItemModal] = useState({ open: false, item: null });
  const [detailModal, setDetailModal] = useState({ open: false, item: null });
  const [unavailableMap, setUnavailableMap] = useState({});
  const [form, setForm] = useState({
    name: "",
    price: "",
    category: "",
    description: "",
    allergens: "",
    mods: "",
  });

  // ----------------- Load Menu Items -----------------
  const loadMenu = async () => {
    try {
      const items = await MenuStorage.getMenuItems();
      const map = MenuStorage.getUnavailableMap();
      setUnavailableMap(map);
      setMenuItems(items || []);
      setCtxMenuItems?.(items || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load menu items");
      setMenuItems([]);
      setCtxMenuItems?.([]);
    }
  };

  useEffect(() => {
    loadMenu();
    loadPrefixed();
  }, []);

  // ----------------- Save (Add / Edit) -----------------
  const handleSaveItem = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!form.category) {
      toast.error("Please select a category");
      return;
    }

    const payload = {
      name: form.name.trim(),
      price: Number(form.price) || 0,
      category: (form.category || "").trim().toLowerCase(),
      description: form.description,
      allergens: parseAllergens(form.allergens),
      common_mods: parseMods(form.mods),
    };
    if (!payload.allergens.length) {
      payload.allergens = ["None"];
    }

    const saveDirect = async () => {
      if (itemModal.item?.id) {
        await MenuStorage.updateMenuItem(itemModal.item.id, payload);
        toast.success("Menu item updated");
      } else {
        await MenuStorage.createMenuItem(payload);
        toast.success("Menu item added");
      }
      await loadMenu();
    };

    try {
      if (requiresApproval) {
        const before = itemModal.item ? safeMenuItems.find(i => i.id === itemModal.item.id) : null;
        try {
          await ChangeRequests.submit({
            user,
            entityType: 'menu_item',
            entityId: itemModal.item?.id || payload.name,
            action: itemModal.item?.id ? 'update' : 'create',
            beforeData: before,
            afterData: payload,
          });
          toast.success("Submitted for approval. Changes will apply after admin review.");
          closeModal();
          return;
        } catch (err) {
          const msg = err?.message || err?.details || "";
          const missingQueue = msg.toLowerCase().includes("change_requests");
          if (missingQueue) {
            console.warn("Approval queue missing; saving directly.", err);
            await saveDirect();
            closeModal();
            toast.success("Saved directly (approval queue not set up yet).");
            return;
          }
          throw err;
        }
      }

      await saveDirect();
      closeModal();
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Could not save item");
    }
  };

  // ----------------- Delete -----------------
  const handleDeleteItem = async (id) => {
    if (!confirm("Delete this item?")) return;

    try {
      const item = safeMenuItems.find((i) => i.id === id);
      if (requiresApproval) {
        await ChangeRequests.submit({
          user,
          entityType: 'menu_item',
          entityId: id,
          action: 'delete',
          beforeData: item || null,
          afterData: null,
        });
        toast.success("Deletion submitted for approval.");
      } else {
        await MenuStorage.deleteMenuItem(id);
        await loadMenu();
        toast.success("Item deleted");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete item");
    }
  };

  // ----------------- Modals -----------------
  const openAddModal = () => {
    // Preselect the current category filter (if not "all") to avoid the button being disabled
    const initialCategory = categoryFilter !== "all" ? categoryFilter : "";
    setForm({ name: "", price: "", category: initialCategory, description: "", allergens: "", mods: "" });
    setItemModal({ open: true, item: null });
  };

  const openEditModal = (item) => {
    setForm({
      name: item.name,
      price: item.price,
      category: item.category,
      description: item.description || "",
      allergens: Array.isArray(item.allergens) ? item.allergens.join(", ") : "",
      mods: Array.isArray(item.common_mods) ? item.common_mods.join(", ") : "",
    });
    setItemModal({ open: true, item });
    setDetailModal({ open: false, item: null });
  };

  const closeModal = () => {
    setItemModal({ open: false, item: null });
    setForm({ name: "", price: "", category: "", description: "", allergens: "", mods: "" });
  };

  // ----------------- Filtering -----------------
  const safeMenuItems = menuItems || [];
  const normalizeCategory = (item) =>
    item?.category || item?.category_slug || item?.menu_categories?.slug || "other";

  const parseAllergens = (val) =>
    (val || "")
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean)
      .map((a) => a[0].toUpperCase() + a.slice(1));

  const parseMods = (val) =>
    (val || "")
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean);

  // Last token used as a search term to filter the common list while typing
  const allergenSearch = (form.allergens.split(",").pop() || "").trim().toLowerCase();

  const filteredItems = safeMenuItems.filter((item) => {
    const cat = normalizeCategory(item);
    return categoryFilter === "all" || cat === categoryFilter;
  });

  const sortedItems = [...filteredItems].sort((a, b) =>
    (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" })
  );

  const groupedItems = sortedItems.reduce((acc, item) => {
    const cat = normalizeCategory(item);
    acc[cat] = acc[cat] || [];
    acc[cat].push(item);
    return acc;
  }, {});

  const loadPrefixed = async () => {
    // Intentionally no-op to avoid showing custom pre-fixed menus on this page
    setPrefixedMenu(null);
  };

  // ----------------- Render -----------------
  return (
    <div className="min-h-screen bg-stone-50 pb-24 dark:bg-stone-900">
      <Header
        title="Menu Management"
        subtitle={`${menuItems.length} items`}
        rightAction={
          <div className="flex items-center gap-2">
            <Button
              onClick={openAddModal}
              type="button"
              size="sm"
              className="bg-amber-700 hover:bg-amber-800 rounded-xl"
            >
              <Plus className="h-4 w-4 mr-1" /> Add Item
            </Button>
          </div>
        }
      />

      {/* Category Filter */}
      <div className="sticky top-14 z-30 px-4 py-3 bg-stone-50 dark:bg-stone-900 border-b border-stone-100 dark:border-stone-800">
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => setCategoryFilter("all")}
            className={cn(
              "px-3 py-2 rounded-xl text-stone-900",
              categoryFilter === "all"
                ? "bg-amber-700 text-white"
                : "bg-stone-100"
            )}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={cn(
                "px-3 py-2 rounded-xl capitalize text-stone-900",
                categoryFilter === cat
                  ? "bg-amber-700 text-white"
                  : "bg-stone-100"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Items List */}
      <div className="px-4 py-3 space-y-4">
        {Object.keys(groupedItems).length === 0 && (
          <p className="text-center text-stone-500 py-4">
            No menu items found.
          </p>
        )}

        {Object.entries(groupedItems).map(([cat, items]) => (
          <div key={cat}>
            <h3 className="font-semibold mb-2 capitalize text-stone-900">{cat}</h3>
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-white dark:bg-stone-800 rounded-xl flex justify-between items-center shadow-sm cursor-pointer hover:shadow-md transition"
                  onClick={() => setDetailModal({ open: true, item })}
                >
                  <div>
                    <p className="font-medium text-stone-900">{item.name}</p>
                    <p className="text-xs text-stone-500">
                      {item.description}
                    </p>
                    {item.allergens?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.allergens.map((a) => (
                          <AllergenBadge key={a} allergen={a} size="sm" />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="font-bold text-amber-700 text-base">
                      ${Number(item.price || 0).toFixed(2)}
                    </span>
                    <label
                      className="flex items-center gap-2 text-xs text-stone-600"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={!!item.is_unavailable}
                        onCheckedChange={async (checked) => {
                          try {
                            if (requiresApproval) {
                              await ChangeRequests.submit({
                                user,
                                entityType: 'menu_item',
                                entityId: item.id,
                                action: 'availability',
                                beforeData: { ...item, is_unavailable: item.is_unavailable },
                                afterData: { ...item, is_unavailable: !!checked },
                              });
                              toast.success("Availability change submitted for approval.");
                              return;
                            }
                            const next = MenuStorage.setUnavailable(item.id, checked);
                            setUnavailableMap(next);
                            setMenuItems((prev) =>
                              (prev || []).map((i) =>
                                i.id === item.id ? { ...i, is_unavailable: !!checked } : i
                              )
                            );
                            setCtxMenuItems?.((prev) =>
                              (prev || []).map((i) =>
                                i.id === item.id ? { ...i, is_unavailable: !!checked } : i
                              )
                            );
                          } catch (err) {
                            console.error('Toggle availability failed:', err);
                            toast.error(err?.message || 'Could not change availability');
                          }
                        }}
                      />
                      <span>{item.is_unavailable ? "Unavailable" : "Available"}</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <Dialog
        open={itemModal.open}
        onOpenChange={(open) => {
          if (!open) closeModal();
          else setItemModal((prev) => ({ ...prev, open: true }));
        }}
      >
        <DialogContent className="max-w-md rounded-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {itemModal.item ? "Edit Menu Item" : "Add Menu Item"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Price</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={(e) =>
                    setForm({ ...form, price: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm({ ...form, category: v })}
                  className="w-full"
                >
                  <SelectItem value="">Select category</SelectItem>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </Select>
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <details className="border border-stone-200 rounded-xl px-3 py-2 bg-stone-50 overflow-hidden">
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <span className="font-medium text-sm text-stone-800">Allergens</span>
                  <span className="text-xs text-stone-500">(tap to expand)</span>
                </summary>
                <div className="mt-3 space-y-2">
                  <div>
                    <Label>Allergens (comma separated)</Label>
                    <Input
                      value={form.allergens}
                      onChange={(e) =>
                        setForm({ ...form, allergens: e.target.value })
                      }
                      placeholder="e.g., Gluten, Dairy"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto pr-1">
                    <div className="grid grid-cols-2 gap-2">
                      {COMMON_ALLERGENS.filter((a) =>
                        allergenSearch ? a.toLowerCase().includes(allergenSearch) : true
                      ).map((allergen) => {
                        const selected = parseAllergens(form.allergens).includes(allergen);
                        return (
                          <label
                            key={allergen}
                            className="flex items-center gap-2 text-sm p-2 rounded-lg border border-stone-200 cursor-pointer hover:border-stone-300"
                          >
                            <Checkbox
                            checked={selected}
                            onCheckedChange={() => {
                              const current = new Set(parseAllergens(form.allergens));
                              if (current.has(allergen)) current.delete(allergen);
                              else current.add(allergen);
                              const next = Array.from(current);
                              const nextValue = next.length ? `${next.join(", ")}, ` : "";
                              setForm({ ...form, allergens: nextValue });
                            }}
                          />
                          <span>{allergen}</span>
                        </label>
                      );
                      })}
                      {COMMON_ALLERGENS.filter((a) =>
                        allergenSearch ? a.toLowerCase().includes(allergenSearch) : true
                      ).length === 0 && (
                        <div className="text-xs text-stone-500 col-span-2">No matches</div>
                      )}
                    </div>
                  </div>
                </div>
              </details>

              <details className="border border-stone-200 rounded-xl px-3 py-2 bg-stone-50 overflow-hidden">
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <span className="font-medium text-sm text-stone-800">Common Mods</span>
                  <span className="text-xs text-stone-500">(tap to expand)</span>
                </summary>
                <div className="mt-3 space-y-2">
                  <div>
                    <Label>Mods (comma separated)</Label>
                    <Input
                      value={form.mods}
                      onChange={(e) =>
                        setForm({ ...form, mods: e.target.value })
                      }
                      placeholder="e.g., No butter, Sauce on side"
                    />
                  </div>
                  {parseMods(form.mods).length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {parseMods(form.mods).map((mod) => (
                        <span
                          key={mod}
                          className="text-xs px-2 py-1 rounded-full bg-stone-200 text-stone-700"
                        >
                          {mod}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </details>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveItem}
              type="button"
              disabled={!form.name.trim() || !form.category}
              className="bg-amber-700 hover:bg-amber-800"
            >
              {itemModal.item ? "Update Item" : "Add Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Item Detail Modal */}
      <Dialog open={detailModal.open} onOpenChange={(open) => setDetailModal({ open, item: open ? detailModal.item : null })}>
        <DialogContent className="max-w-md rounded-2xl relative">
          {detailModal.item && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2"
              onClick={() => {
                handleDeleteItem(detailModal.item.id);
                setDetailModal({ open: false, item: null });
              }}
              aria-label="Delete item"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <DialogHeader>
            <DialogTitle>Menu Item</DialogTitle>
          </DialogHeader>
          {detailModal.item && (
            <div className="space-y-3">
              <div>
                <p className="text-base font-semibold text-stone-900">{detailModal.item.name}</p>
                <p className="text-sm text-stone-500">{detailModal.item.description || "No description"}</p>
              </div>
              <div className="space-y-1">
                <span className="font-medium text-sm">Allergens:</span>
                {detailModal.item.allergens && detailModal.item.allergens.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {detailModal.item.allergens.map((a) => (
                      <AllergenBadge key={a} allergen={a} size="sm" />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-stone-500">None</p>
                )}
              </div>
              <div className="space-y-1">
                <span className="font-medium text-sm">Common Mods:</span>
                {detailModal.item.common_mods && detailModal.item.common_mods.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {detailModal.item.common_mods.map((m) => (
                      <span key={m} className="text-xs px-2 py-1 rounded-full bg-stone-200 text-stone-700">
                        {m}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-stone-500">None</p>
                )}
              </div>
              <div className="text-sm text-stone-600">
                <span className="font-medium">Category:</span> {detailModal.item.category || "Uncategorized"}
              </div>
              <div className="text-sm text-stone-600">
                <span className="font-medium">Price:</span> ${Number(detailModal.item.price || 0).toFixed(2)}
              </div>
            </div>
          )}
          <DialogFooter className="flex justify-end gap-2">
          {detailModal.item && (
            <Button onClick={() => openEditModal(detailModal.item)} className="bg-amber-700 hover:bg-amber-800" size="icon" aria-label="Edit item">
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
