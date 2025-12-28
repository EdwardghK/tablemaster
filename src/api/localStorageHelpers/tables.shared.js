import { supabase } from "@/supabase";

// Shared read-only helpers for expo (no owner filter)
export const TableStorageShared = {
  async getAllTables() {
    const { data, error } = await supabase
      .from("tables")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async getTable(id) {
    const { data, error } = await supabase
      .from("tables")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },
};
