import React, { useEffect, useState } from "react";
import Header from "@/components/common/Header";
import BottomNav from "@/components/common/BottomNav";
import { Skeleton } from "@/components/ui/skeleton";
import { TableStorageShared } from "@/api/localStorageHelpers/tables.shared";
import { GuestStorageShared } from "@/api/localStorageHelpers/guests.shared";
import { OrderStorageShared } from "@/api/localStorageHelpers/orders.shared";
import { cn } from "@/utils";

export default function ExpoTableDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const tableId = urlParams.get("id");

  const [table, setTable] = useState(null);
  const [guests, setGuests] = useState([]);
  const [orderItems, setOrderItems] = useState([]);

  useEffect(() => {
    if (!tableId) return;
    (async () => {
      const [t, g, o] = await Promise.all([
        TableStorageShared.getTable(tableId),
        GuestStorageShared.getGuests(tableId),
        OrderStorageShared.getOrderItemsByTable(tableId),
      ]);
      setTable(t);
      setGuests(g);
      setOrderItems(o);
    })();
  }, [tableId]);

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

  const guestMap = new Map(guests.map((g) => [g.id, g]));
  const seatLabel = (guestId) => {
    const guest = guestMap.get(guestId);
    if (!guest) return "s?";
    return `s${guest.guest_number || guest.id?.slice(-2) || "?"}`;
  };

  const courseKey = (item) => item.course || item.course_label || "Unassigned Course";
  const grouped = orderItems.reduce((acc, item) => {
    const key = courseKey(item);
    acc[key] = acc[key] || [];
    acc[key].push(item);
    return acc;
  }, {});

  const courseOrder = Object.keys(grouped).sort((a, b) => {
    // Try to order "Course X" numerically if possible
    const numA = parseInt((a.match(/\d+/) || [0])[0], 10);
    const numB = parseInt((b.match(/\d+/) || [0])[0], 10);
    if (!Number.isNaN(numA) && !Number.isNaN(numB) && numA !== numB) return numA - numB;
    return a.localeCompare(b);
  });

  const sortBySeat = (items) => {
    return [...items].sort((a, b) => {
      const ga = guestMap.get(a.guest_id);
      const gb = guestMap.get(b.guest_id);
      const sa = ga?.guest_number ?? 9999;
      const sb = gb?.guest_number ?? 9999;
      if (sa !== sb) return sa - sb;
      return (ga?.name || '').localeCompare(gb?.name || '');
    });
  };

  const guestsWithAllergens = guests
    .map((g) => ({
      ...g,
      allergens: [...(g.allergens || []), ...(g.custom_allergens || [])].filter(Boolean),
    }))
    .filter((g) => g.allergens.length > 0);

  const formatSteakLabel = (item) => {
    const weight = item.weight_oz ?? item.weightOz ?? item.weight;
    const country = item.country || item.country_code || item.countryCode;
    const baseName = item.menu_item_name || item.name || "Item";
    const prefix = [weight ? `${weight}oz` : null, country].filter(Boolean).join(" ");
    return prefix ? `${prefix} ${baseName}` : baseName;
  };

  const displayItemName = (item) => {
    const category = (item.category || item.category_slug || "").toLowerCase();
    if (category === "steaks") return formatSteakLabel(item);
    return item.menu_item_name || item.name;
  };

  const guestAllergenList = (guestId) => {
    const g = guestMap.get(guestId);
    if (!g) return [];
    return [...(g.allergens || []), ...(g.custom_allergens || [])].filter(Boolean);
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-24">
      <Header
        title={`Expo: Table ${table.table_number}`}
        subtitle={table.section ? `Section: ${table.section}` : undefined}
        backTo="/expo"
      />

      <div className="p-4 space-y-4">
        {courseOrder.length === 0 && (
          <p className="text-center text-stone-500">No items for this table.</p>
        )}

        {courseOrder.map((course) => (
          <div key={course} className="bg-white rounded-2xl border border-stone-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-stone-800">{course}</h3>
              <div className="text-xs text-stone-500">{grouped[course].length} items</div>
            </div>

            <div className="space-y-2">
              {sortBySeat(grouped[course]).map((item) => {
                const allergies = guestAllergenList(item.guest_id);
                const mods = item.modifications || [];
                const donenessMod = mods.find((m) => m.toLowerCase().startsWith("doneness"));
                const otherMods = mods.filter((m) => m !== donenessMod);
                const donenessLabel = donenessMod?.replace(/^doneness:\s*/i, "");
                const emphasisTextClass = allergies.length > 0 ? "text-red-900" : "text-stone-900";
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "rounded-xl border px-3 py-2",
                      allergies.length > 0
                        ? "bg-red-50 border-red-200 text-red-900"
                        : "bg-stone-50 border-stone-100 text-stone-900"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 font-semibold">
                        <span>{seatLabel(item.guest_id)}</span>
                        {allergies.length > 0 && (
                          <span className="text-[11px] font-semibold text-red-800 bg-red-100 px-2 py-0.5 rounded-full">
                            Allergy: {allergies.join(", ")}
                          </span>
                        )}
                        <span className="text-stone-900">- {displayItemName(item)}</span>
                      </div>
                      {item.quantity && item.quantity > 1 && (
                        <span className="text-sm font-medium text-stone-600">
                          x{item.quantity}
                        </span>
                      )}
                    </div>
                    {allergies.length > 0 && (
                      <div className="mt-1 text-xs font-medium text-red-800">
                        Allergy note: {allergies.join(", ")}
                      </div>
                    )}
                    {(mods.length || item.custom_notes) && (
                      <div className="mt-1 text-xs text-stone-600 space-y-1">
                        {donenessLabel && (
                          <div className={cn("text-sm font-semibold", emphasisTextClass)}>
                            {donenessLabel}
                          </div>
                        )}
                        {otherMods.length > 0 && (
                          <div>
                            <span className="font-medium">Mods:</span>{" "}
                            {otherMods.join(", ")}
                          </div>
                        )}
                        {item.custom_notes && (
                          <div>
                            <span className="font-medium">Notes:</span> {item.custom_notes}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}


