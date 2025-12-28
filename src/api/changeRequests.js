import { supabase } from "@/supabase";

export const ChangeRequests = {
  async submit({ user, entityType, entityId, action, beforeData, afterData, notes }) {
    if (!user?.id) throw new Error("Must be signed in to submit change");
    const payload = {
      user_id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
      entity_type: entityType,
      entity_id: entityId ? String(entityId) : null,
      action,
      before_data: beforeData ?? null,
      after_data: afterData ?? null,
      decision_notes: notes ?? null,
      status: "pending",
    };
    const { data, error } = await supabase
      .from("change_requests")
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};
