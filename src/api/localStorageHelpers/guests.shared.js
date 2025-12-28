import { supabase } from "@/supabase";

// Shared read-only helpers for expo (no owner filter)
export const GuestStorageShared = {
  async getGuests(tableId) {
    const query = supabase.from("guests").select("*");
    if (tableId) query.eq("table_id", tableId);
    const { data, error } = await query.order("guest_number", { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async getAllGuests() {
    const { data, error } = await supabase
      .from("guests")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data || [];
  },
};
