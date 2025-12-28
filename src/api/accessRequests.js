import { supabase } from "@/supabase";

const TABLE = "edit_requests";

const baseSelect = `
  id,
  user_id,
  email,
  full_name,
  reason,
  status,
  reviewer_id,
  reviewer_email,
  decision_notes,
  created_at,
  reviewed_at
`;

export const AccessRequests = {
  async getLatestForUser(userId) {
    if (!userId) return null;
    const { data, error } = await supabase
      .from(TABLE)
      .select(baseSelect)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1);
    if (error) throw error;
    return data?.[0] || null;
  },

  async submit(user, reason = "") {
    if (!user?.id) throw new Error("Must be signed in to request access");
    const payload = {
      user_id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
      reason: reason?.trim() || null,
      status: "pending",
    };
    const { data, error } = await supabase
      .from(TABLE)
      .insert([payload])
      .select(baseSelect)
      .single();
    if (error) throw error;
    return data;
  },

  async listPending() {
    const { data, error } = await supabase
      .from(TABLE)
      .select(baseSelect)
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async updateStatus(id, status, reviewer) {
    if (!id) throw new Error("Missing request id");
    if (!status) throw new Error("Missing status");
    const payload = {
      status,
      reviewer_id: reviewer?.id || null,
      reviewer_email: reviewer?.email || null,
      reviewed_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from(TABLE)
      .update(payload)
      .eq("id", id)
      .select(baseSelect)
      .single();
    if (error) throw error;
    return data;
  },
};
