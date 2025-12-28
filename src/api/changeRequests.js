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

  async listPending() {
    const { data, error } = await supabase
      .from("change_requests")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async getById(id) {
    if (!id) throw new Error("Missing request id");
    const { data, error } = await supabase
      .from("change_requests")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async updateStatus(id, status, reviewer, decisionNotes = null) {
    if (!id) throw new Error("Missing request id");
    if (!status) throw new Error("Missing status");
    const payload = {
      status,
      reviewer_id: reviewer?.id || null,
      reviewer_email: reviewer?.email || null,
      decision_notes: decisionNotes,
      reviewed_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from("change_requests")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return data;
  },

  async applyChange(request) {
    if (!request) throw new Error("Missing change request");
    const { entity_type, entity_id, action, after_data, before_data } = request;
    const reviewer = request.reviewer || null;

    const apply = async (table, payload) => {
      const id = entity_id || payload?.id;
      if (!id && action !== "create") throw new Error("Missing entity id");

      if (action === "create") {
        const { error } = await supabase.from(table).insert([payload]);
        if (error) throw error;
      } else if (action === "update" || action === "availability") {
        const { error } = await supabase.from(table).update(payload).eq("id", id);
        if (error) throw error;
      } else if (action === "delete") {
        const { error } = await supabase.from(table).delete().eq("id", id);
        if (error) throw error;
      }
    };

    switch ((entity_type || "").toLowerCase()) {
      case "menu_item": {
        const payload = after_data || {};
        await apply("menu_items", payload);
        break;
      }
      case "table": {
        const payload = after_data || {};
        await apply("tables", payload);
        break;
      }
      case "prefixed_menu": {
        const payload = after_data || {};
        await apply("prefixed_menus", payload);
        break;
      }
      default:
        throw new Error(`Unsupported entity type: ${entity_type || "unknown"}`);
    }
  },

  async applyAndUpdate(id, reviewer, decisionNotes = null) {
    const req = await ChangeRequests.getById(id);
    if (!req) throw new Error("Request not found");
    await ChangeRequests.applyChange(req);
    return await ChangeRequests.updateStatus(id, "approved", reviewer, decisionNotes);
  },
};
