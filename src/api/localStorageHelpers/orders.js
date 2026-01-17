import { supabase } from "@/supabase";

// Ensure we have a user session; fall back to anonymous or shared creds.
async function requireUser() {
  // Existing session
  let { data } = await supabase.auth.getUser();
  if (data?.user) return data.user;

  // Anonymous sign-in (if enabled)
  try {
    const { data: anonData } = await supabase.auth.signInAnonymously?.();
    if (anonData?.session?.user) {
      const { data: refreshed } = await supabase.auth.getUser();
      if (refreshed?.user) return refreshed.user;
    }
  } catch (_) { /* ignore */ }

  // Fallback email/password (set in .env as VITE_DEMO_USER_EMAIL / VITE_DEMO_USER_PASSWORD)
  const fallbackEmail = import.meta.env.VITE_DEMO_USER_EMAIL;
  const fallbackPassword = import.meta.env.VITE_DEMO_USER_PASSWORD;
  if (fallbackEmail && fallbackPassword) {
    const { data: pwData } = await supabase.auth.signInWithPassword({
      email: fallbackEmail,
      password: fallbackPassword,
    });
    if (pwData?.user) return pwData.user;
  }

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
