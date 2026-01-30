import { supabase } from "@/supabase";

function normalizeEmail(email) {
  if (!email || typeof email !== "string") return null;
  return email.trim().toLowerCase();
}

function normalizeLooseEmail(email) {
  const normalized = normalizeEmail(email);
  return normalized ? normalized.replace(/\s+/g, "") : null;
}

function matchesOwner(row, user) {
  if (!row || !user) return false;
  if (row.owner_id && user.id && row.owner_id === user.id) return true;
  const userEmail = normalizeLooseEmail(user.email);
  const rowEmail = normalizeLooseEmail(row.owner_email);
  return !!(userEmail && rowEmail && userEmail === rowEmail);
}

async function tryRepairOwnership(rows, user) {
  if (!rows?.length || !user?.id) return rows;
  const userEmail = normalizeEmail(user.email);
  const userEmailLoose = normalizeLooseEmail(user.email);
  const ownerName = user.user_metadata?.full_name || user.email || null;

  const candidates = rows.filter((row) =>
    !row?.owner_id &&
    matchesOwner(row, user) &&
    (!row.owner_email || normalizeLooseEmail(row.owner_email) === userEmailLoose)
  );
  if (!candidates.length) return rows;

  await Promise.all(
    candidates.map(async (row) => {
      try {
        await supabase
          .from("tables")
          .update({
            owner_id: user.id,
            owner_email: userEmail || row.owner_email || null,
            owner_name: row.owner_name || ownerName,
          })
          .eq("id", row.id)
          .is("owner_id", null);
      } catch (err) {
        console.warn("Could not repair table ownership:", err);
      }
    })
  );

  return rows.map((row) => {
    if (!candidates.find((c) => c.id === row.id)) return row;
    return {
      ...row,
      owner_id: row.owner_id || user.id,
      owner_email: row.owner_email || userEmail || null,
      owner_name: row.owner_name || ownerName,
    };
  });
}

async function requireUser() {
  const { data: sessionData } = await supabase.auth.getSession();
  if (sessionData?.session?.user) return sessionData.session.user;

  // Try current user
  let { data, error } = await supabase.auth.getUser();
  if (data?.user) return data.user;

  // Final check
  ({ data, error } = await supabase.auth.getUser());
  if (data?.user) return data.user;

  throw new Error("Must be signed in");
}

function applyOwnerFilter(query, user) {
  const normalizedEmail = normalizeEmail(user?.email);
  if (normalizedEmail) {
    return query.or(`owner_id.eq.${user.id},owner_email.ilike.${normalizedEmail}`);
  }
  return query.eq("owner_id", user.id);
}

export const TableStorage = {
  async getAllTables() {
    const user = await requireUser();
    const base = supabase.from("tables").select("*").order("created_at", { ascending: true });
    const { data, error } = await applyOwnerFilter(base, user);
    if (error) throw error;
    if (data?.length) return data;

    // Fallback: if owner fields were not saved correctly, recover by matching email/owner_id.
    const { data: shared, error: sharedError } = await supabase
      .from("tables")
      .select("*")
      .order("created_at", { ascending: true });
    if (sharedError) throw sharedError;
    const owned = (shared || []).filter((row) => matchesOwner(row, user));
    await tryRepairOwnership(owned, user);
    return owned;
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
    const base = supabase.from("tables").select("*").eq("id", id);
    const { data, error } = await applyOwnerFilter(base, user).maybeSingle();
    if (error) throw error;
    if (data) return data;

    // Fallback to recover a table whose ownership metadata is missing.
    const { data: shared, error: sharedError } = await supabase
      .from("tables")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (sharedError) throw sharedError;
    if (!shared || !matchesOwner(shared, user)) return null;
    await tryRepairOwnership([shared], user);
    return shared;
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
      owner_email: normalizeEmail(user.email) || null,
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
      owner_email: normalizeEmail(user.email) || null,
      owner_phone: user.user_metadata?.phone || null,
      owner_name: user.user_metadata?.full_name || user.email || null,
    };
    const base = supabase.from("tables").update(payload).eq("id", id);
    const { data: row, error } = await applyOwnerFilter(base, user).select().single();
    if (error) throw error;
    return row;
  },

  async updateTableShared(id, data) {
    if (!id) throw new Error("Missing table id");
    const { data: row, error } = await supabase
      .from("tables")
      .update(data)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return row;
  },

  async deleteTable(id) {
    const user = await requireUser();
    const base = supabase.from("tables").delete().eq("id", id);
    const { error } = await applyOwnerFilter(base, user);
    if (error) throw error;
    return true;
  },

  async deleteTableShared(id) {
    if (!id) throw new Error("Missing table id");
    const { error } = await supabase
      .from("tables")
      .delete()
      .eq("id", id);
    if (error) throw error;
    return true;
  },
};
