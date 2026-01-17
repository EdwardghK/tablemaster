import { supabase } from "@/supabase";

// Ensure we have a user session; fall back to anonymous or shared creds.
async function requireUser() {
  // Existing session
  let { data } = await supabase.auth.getUser();
  if (data?.user) return data.user;

  ({ data } = await supabase.auth.getUser());
  if (data?.user) return data.user;

  throw new Error("Must be signed in");
}

export const OrderStorage = {
  // Orders
  async getOrdersByTable(tableId) {
    const user = await requireUser();
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("table_id", tableId)
      .eq("owner_id", user.id)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async getAllOrders() {
    const user = await requireUser();
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async createOrder(order) {
    const user = await requireUser();
    const { data, error } = await supabase
      .from("orders")
      .insert([{ ...order, owner_id: user.id }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateOrder(id, data) {
    const user = await requireUser();
    const { data: row, error } = await supabase
      .from("orders")
      .update({ ...data, owner_id: user.id })
      .eq("id", id)
      .eq("owner_id", user.id)
      .select()
      .single();
    if (error) throw error;
    return row;
  },

  async deleteOrder(id) {
    const user = await requireUser();
    const { error } = await supabase
      .from("orders")
      .delete()
      .eq("id", id)
      .eq("owner_id", user.id);
    if (error) throw error;
    return true;
  },

  // Order Items
  async getOrderItemsByTable(tableId) {
    const user = await requireUser();
    const { data, error } = await supabase
      .from("order_items")
      .select("*")
      .eq("table_id", tableId)
      .eq("owner_id", user.id)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async getAllOrderItems() {
    const user = await requireUser();
    const { data, error } = await supabase
      .from("order_items")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async createOrderItem(item) {
    const user = await requireUser();
    const { data, error } = await supabase
      .from("order_items")
      .insert([{ ...item, owner_id: user.id }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateOrderItem(id, data) {
    const user = await requireUser();
    const { data: row, error } = await supabase
      .from("order_items")
      .update({ ...data, owner_id: user.id })
      .eq("id", id)
      .eq("owner_id", user.id)
      .select()
      .single();
    if (error) throw error;
    return row;
  },

  async deleteOrderItem(id) {
    const user = await requireUser();
    const { error } = await supabase
      .from("order_items")
      .delete()
      .eq("id", id)
      .eq("owner_id", user.id);
    if (error) throw error;
    return true;
  },
};
