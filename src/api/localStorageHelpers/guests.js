import { supabase } from "@/supabase";

async function requireUser() {
  const { data: sessionData } = await supabase.auth.getSession();
  if (sessionData?.session?.user) return sessionData.session.user;

  let { data } = await supabase.auth.getUser();
  if (data?.user) return data.user;

  ({ data } = await supabase.auth.getUser());
  if (data?.user) return data.user;

  throw new Error("Must be signed in");
}

export const GuestStorage = {
  async getGuests(tableId) {
    const user = await requireUser();
    const query = supabase.from("guests").select("*").eq("owner_id", user.id);
    if (tableId) query.eq("table_id", tableId);
    const { data, error } = await query.order("guest_number", { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async getAllGuests() {
    const user = await requireUser();
    const { data, error } = await supabase
      .from("guests")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data || [];
  },

  // Shared reads for expo
  async getGuestsShared(tableId) {
    const query = supabase.from("guests").select("*");
    if (tableId) query.eq("table_id", tableId);
    const { data, error } = await query.order("guest_number", { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async getAllGuestsShared() {
    const { data, error } = await supabase
      .from("guests")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async createGuest(guest) {
    const user = await requireUser();
    const { data, error } = await supabase
      .from("guests")
      .insert([{ ...guest, owner_id: user.id }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateGuest(id, data) {
    const user = await requireUser();
    const { data: row, error } = await supabase
      .from("guests")
      .update({ ...data, owner_id: user.id })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return row;
  },

  async deleteGuest(id) {
    const user = await requireUser();
    const { error } = await supabase
      .from("guests")
      .delete()
      .eq("id", id)
      .eq("owner_id", user.id);
    if (error) throw error;
    return true;
  },
};
