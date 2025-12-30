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

    const resolveCategoryId = async (payload) => {
      if (payload.category_id) return payload.category_id;
      const rawSlug = (payload.category || payload.category_slug || payload.category_name || "").toString().trim();
      if (!rawSlug) return null;
      const slug = rawSlug.toLowerCase().replace(/\s+/g, "_");

      const { data, error } = await supabase
        .from("menu_categories")
        .select("id")
        .ilike("slug", slug)
        .maybeSingle();
      if (error) return null;
      return data?.id || null;
    };

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
        const payload = { ...(after_data || {}) };

        if (action !== "delete") {
          // Ensure category_id is set (NOT NULL in DB). Reuse prior value if missing.
          if (!payload.category_id) {
            payload.category_id = before_data?.category_id || (await resolveCategoryId(payload)) || null;
          }
          if (!payload.category_id) {
            throw new Error("category_id is required for menu items");
          }

          const isSteak =
            (payload.category || payload.category_slug || "").toLowerCase() === "steaks" ||
            (before_data?.category || before_data?.category_slug || "").toLowerCase() === "steaks";

          // Normalize steak fields so approvals don't violate NOT NULL / CHECK constraints.
          const allowedCountries = ["CAD", "US", "AUS", "JAP", "ARG"];
          const normalizeCountry = (val) => {
            const normalized = (val || "").toString().trim().toUpperCase();
            if (!normalized) return null;
            return allowedCountries.includes(normalized) ? normalized : normalized;
          };

          const normalizeText = (val) =>
            (val || "").toString().trim() || null;

          const normalizeNumber = (val) => {
            if (val === undefined || val === null || val === "") return null;
            const num = Number(val);
            return Number.isFinite(num) ? num : null;
          };

          if (isSteak) {
            payload.country = normalizeCountry(payload.country ?? before_data?.country ?? null);
            payload.origin = normalizeText(payload.origin ?? before_data?.origin ?? null);

            const fallbackCut = payload.cut || before_data?.cut || "Unspecified";
            payload.cut = normalizeText(fallbackCut) || "Unspecified";

            payload.weight_oz = normalizeNumber(payload.weight_oz ?? before_data?.weight_oz ?? null);
            payload.aging_days = normalizeNumber(payload.aging_days ?? before_data?.aging_days ?? null);
            payload.dry_aged_notes = normalizeText(payload.dry_aged_notes ?? before_data?.dry_aged_notes ?? null);
            payload.farm_detail = normalizeText(payload.farm_detail ?? before_data?.farm_detail ?? null);
          } else {
            payload.country = null;
            payload.origin = null;
            payload.cut = payload.cut ? normalizeText(payload.cut) : null;
            payload.weight_oz = null;
            if (Object.prototype.hasOwnProperty.call(payload, "aging_days")) payload.aging_days = null;
            if (Object.prototype.hasOwnProperty.call(payload, "dry_aged_notes")) payload.dry_aged_notes = null;
          }

          if (Object.prototype.hasOwnProperty.call(payload, "aging_days") && payload.aging_days === "") {
            payload.aging_days = null;
          }
          if (Object.prototype.hasOwnProperty.call(payload, "farm_detail") && payload.farm_detail === "") {
            payload.farm_detail = null;
          }
        }

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
