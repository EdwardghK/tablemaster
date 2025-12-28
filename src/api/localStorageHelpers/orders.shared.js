import { supabase } from "@/supabase";

// Shared read-only helpers for expo (no owner filter)
export const OrderStorageShared = {
  async getOrdersByTable(tableId) {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("table_id", tableId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async getOrderItemsByTable(tableId) {
    const { data, error } = await supabase
      .from("order_items")
      .select("*")
      .eq("table_id", tableId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async getAllOrderItems() {
    const { data, error } = await supabase
      .from("order_items")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data || [];
  },
};
