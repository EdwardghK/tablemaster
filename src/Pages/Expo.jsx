import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/common/Header";
import BottomNav from "@/components/common/BottomNav";
import { TableStorageShared } from "@/api/localStorageHelpers/tables.shared";
import { GuestStorageShared } from "@/api/localStorageHelpers/guests.shared";
import { OrderStorageShared } from "@/api/localStorageHelpers/orders.shared";
import { cn } from "@/utils";
import { ArrowRight, Users, Clock } from "lucide-react";

export default function Expo() {
  const [tables, setTables] = useState([]);
  const [guests, setGuests] = useState([]);
  const [orderItems, setOrderItems] = useState([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const [t, g, o] = await Promise.all([
        TableStorageShared.getAllTables(),
        GuestStorageShared.getAllGuests(),
        OrderStorageShared.getAllOrderItems(),
      ]);
      if (!mounted) return;
      setTables(t);
      setGuests(g);
      setOrderItems(o);
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") load();
    };

    load();
    const intervalId = setInterval(load, 5000);
    window.addEventListener("focus", load);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      mounted = false;
      clearInterval(intervalId);
      window.removeEventListener("focus", load);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const getGuestCount = (tableId) =>
    guests.filter((g) => g.table_id === tableId).length;

  const getOrderCount = (tableId) => {
    const tableGuests = guests.filter((g) => g.table_id === tableId);
    const guestIds = tableGuests.map((g) => g.id);
    return orderItems.filter((o) => guestIds.includes(o.guest_id)).length;
  };

  const getTableAllergens = (tableId) => {
    const tableGuests = guests.filter((g) => g.table_id === tableId);
    const all = new Set();
    tableGuests.forEach((g) => {
      (g.allergens || []).forEach((a) => a && all.add(a));
      (g.custom_allergens || []).forEach((a) => a && all.add(a));
    });
    return Array.from(all);
  };

  const sortedTables = [...tables].sort((a, b) => {
    const aNum = a.table_number || '';
    const bNum = b.table_number || '';
    const numCompare = aNum.localeCompare(bNum, undefined, { numeric: true, sensitivity: 'base' });
    return numCompare !== 0 ? numCompare : aNum.localeCompare(bNum);
  });

  return (
    <div className="min-h-screen bg-stone-50 pb-24">
      <Header title="Expo" subtitle="Live course view by table" />

      <div className="p-4 space-y-3">
        {sortedTables.length === 0 && (
          <p className="text-center text-stone-500">No tables available.</p>
        )}

        {sortedTables.map((table) => (
          <Link
            key={table.id}
            to={`/expo/table?id=${table.id}`}
            className={cn(
              "block rounded-2xl border-2 bg-white p-4 hover:shadow-md transition-all duration-150",
              table.status === "occupied"
                ? "border-amber-200"
                : "border-stone-200"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm"
                  style={{ backgroundColor: table.color || "#D97706" }}
                >
                  {table.table_number}
                </div>
                <div>
                  <div className="text-sm font-semibold text-stone-900">
                    {table.owner_name || table.owner_email || (table.owner_id ? table.owner_id.slice(0, 8) + "…" : "Unknown user")}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-stone-500">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" /> {getGuestCount(table.id)} guests
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {getOrderCount(table.id)} items
                    </span>
                  </div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-stone-500" />
            </div>
            {getTableAllergens(table.id).length > 0 && (
              <div className="mt-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-2 py-1">
                Allergies: {getTableAllergens(table.id).join(", ")}
              </div>
            )}
          </Link>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}
