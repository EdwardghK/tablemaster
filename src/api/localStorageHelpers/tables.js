import { supabase } from "@/supabase";

async function requireUser() {
  // Try current user
  let { data, error } = await supabase.auth.getUser();
  if (data?.user) return data.user;

  // Final check
  ({ data, error } = await supabase.auth.getUser());
  if (data?.user) return data.user;

  throw new Error("Must be signed in");
}

export const TableStorage = {
  async getAllTables() {
    const user = await requireUser();
    const { data, error } = await supabase
      .from("tables")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data || [];
  },

  // Shared read for expo (no owner filter)
  async getAllTablesShared() {
    const { data, error } = await supabase
      .from("tables")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async getTable(id) {
    const user = await requireUser();
    const { data, error } = await supabase
      .from("tables")
      .select("*")
      .eq("id", id)
      .eq("owner_id", user.id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  // Shared read for expo (no owner filter)
  async getTableShared(id) {
    const { data, error } = await supabase
      .from("tables")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async createTable(data) {
    const user = await requireUser();
    if (!data.table_number?.trim()) throw new Error("Table number is required");
    const payload = {
      ...data,
      table_number: data.table_number.trim(),
      owner_id: user.id,
      owner_email: user.email || null,
      owner_phone: user.user_metadata?.phone || null,
      owner_name: user.user_metadata?.full_name || user.email || null,
    };
    const { data: row, error } = await supabase
      .from("tables")
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    return row;
  },

  async updateTable(id, data) {
    const user = await requireUser();
    const payload = {
      ...data,
      owner_id: user.id,
      owner_email: user.email || null,
      owner_phone: user.user_metadata?.phone || null,
      owner_name: user.user_metadata?.full_name || user.email || null,
    };
    const { data: row, error } = await supabase
      .from("tables")
      .update(payload)
      .eq("id", id)
      .eq("owner_id", user.id)
      .select()
      .single();
    if (error) throw error;
    return row;
  },

  async deleteTable(id) {
    const user = await requireUser();
    const { error } = await supabase
      .from("tables")
      .delete()
      .eq("id", id)
      .eq("owner_id", user.id);
    if (error) throw error;
    return true;
  },
};
