import { supabase } from "@/supabase";

const MENU_CACHE_KEY = "tablemaster_menu_cache";
const PREFX_CACHE_KEY = "tablemaster_prefixed_cache";
const UNAVAILABLE_KEY = "tablemaster_unavailable_items";

const readCache = (key) => {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.warn("Failed to read cache", err);
    return null;
  }
};

const writeCache = (key, value) => {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn("Failed to write cache", err);
  }
};

export const MenuStorage = {
  getUnavailableMap() {
    const cached = readCache(UNAVAILABLE_KEY);
    return cached && typeof cached === "object" ? cached : {};
  },

  setUnavailable(id, value) {
    const map = MenuStorage.getUnavailableMap();
    map[id] = !!value;
    writeCache(UNAVAILABLE_KEY, map);
    return map;
  },

  async getMenuItems() {
    let data;
    try {
      // Pull items with their category and first price (if present)
      const { data: supaData, error } = await supabase
        .from("menu_items")
        .select(`
          id, category, category_id, name, description, origin, notes, allergens, common_mods, created_at,
          menu_categories:menu_categories!menu_items_category_id_fkey ( id, slug, name, sort_order ),
          menu_prices:menu_prices!menu_prices_item_id_fkey ( price, currency ),
          menu_item_options:menu_item_options!menu_item_options_item_id_fkey (
            id,
            menu_prices:menu_prices!menu_prices_option_id_fkey ( price, currency )
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }
      data = supaData || [];
    } catch (err) {
      console.error("Supabase fetch error:", err);
      const cached = readCache(MENU_CACHE_KEY);
      if (cached) {
        console.warn("Using cached menu items due to fetch error");
        return cached;
      }
      throw err;
    }

    const items = data || [];

    // If some rows did not hydrate category via FK, fetch categories separately
    const needsCategories = items.some(
      (item) => !item?.menu_categories?.slug && item?.category_id
    );
    let categoryMap = null;
    if (needsCategories) {
      const { data: cats, error: catErr } = await supabase
        .from("menu_categories")
        .select("id, slug, name, sort_order");
      if (catErr) {
        console.warn("Supabase menu_categories fallback fetch error:", catErr);
      } else {
        categoryMap = new Map(cats.map((c) => [c.id, c]));
      }
    }

    // Normalize to include category slug/name and a single price field for the UI
    const unavailableMap = MenuStorage.getUnavailableMap();
    const normalized = items.map((item) => {
      const category =
        item?.menu_categories ||
        (categoryMap ? categoryMap.get(item.category_id) : null);
      const firstPrice = item?.menu_prices?.[0];
      // fallback: use lowest option price if base price missing
      let optionPrice = null;
      if (!firstPrice && item?.menu_item_options?.length) {
        const prices = item.menu_item_options
          .flatMap((opt) => opt.menu_prices || [])
          .filter(Boolean);
        if (prices.length) {
          optionPrice = prices.reduce((min, p) =>
            min === null ? p : (p.price < min.price ? p : min), null
          );
        }
      }
      let priceToUse = firstPrice || optionPrice;

      // Clean name to strip trailing price artifacts (e.g., "... $105.00")
      const rawName = item.name || '';
      const priceMatch = rawName.match(/\$([\d.,]+)\s*$/);
      const cleanedName = rawName.replace(/\s+\$[\d.,]+\s*$/, '').trim();
      if (!priceToUse && priceMatch) {
        const parsed = Number(priceMatch[1].replace(/,/g, ''));
        if (!Number.isNaN(parsed)) {
          priceToUse = { price: parsed, currency: item.currency || 'CAD' };
        }
      }

      return {
        ...item,
        name: cleanedName || rawName,
        price: priceToUse?.price ?? 0,
        currency: priceToUse?.currency ?? "CAD",
        category: item.category || category?.slug,
        category_slug: category?.slug,
        category_name: category?.name,
        allergens: Array.isArray(item.allergens) ? item.allergens : [],
        common_mods: Array.isArray(item.common_mods) ? item.common_mods : [],
        is_unavailable: !!unavailableMap[item.id],
      };
    });

    writeCache(MENU_CACHE_KEY, normalized);
    return normalized;
  },

  async getCategoryIdBySlug(slug) {
    if (!slug) return null;
    const s = slug.trim();
    const { data, error } = await supabase
      .from("menu_categories")
      .select("id")
      .or(`slug.eq.${s},slug.ilike.${s.toLowerCase()}`)
      .limit(1)
      .maybeSingle();
    if (error) {
      console.error("Supabase category lookup error:", error);
      return null;
    }
    return data?.id || null;
  },

  async ensureCategory(slug) {
    const existing = await MenuStorage.getCategoryIdBySlug(slug);
    if (existing) return existing;
    // create a category if missing so the insert doesn't fail
    const name = slug
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    const { data, error } = await supabase
      .from("menu_categories")
      .insert([{ slug, name }])
      .select("id")
      .single();
    if (error) {
      console.error("Supabase create category error:", error);
      return null;
    }
    return data?.id || null;
  },

  async createMenuItem(payload) {
    const { price, currency = "CAD", category, category_id, ...rest } = payload;
    const categorySlug = (category || "").trim().toLowerCase();
    const categoryId =
      category_id ||
      (categorySlug ? await MenuStorage.ensureCategory(categorySlug) : null);
    if (!categoryId) {
      throw new Error("Category is required");
    }
    const insertPayload = { ...rest, category_id: categoryId };

    const { data, error } = await supabase.from("menu_items").insert([insertPayload]).select().single();
    if (error) {
      console.error("Supabase insert error:", error);
      throw error;
    }

    if (price && data?.id) {
      const { error: priceErr } = await supabase
        .from("menu_prices")
        .insert([{ item_id: data.id, price, currency }]);
      if (priceErr) {
        console.error("Supabase price insert error:", priceErr);
        throw priceErr;
      }
    }
    return data;
  },

  async updateMenuItem(id, payload) {
    const { price, currency = "CAD", category, category_id, ...rest } = payload;
    const categorySlug = (category || "").trim().toLowerCase();
    const categoryId =
      category_id ||
      (categorySlug ? await MenuStorage.ensureCategory(categorySlug) : null);
    if (!categoryId) {
      throw new Error("Category is required");
    }
    const updatePayload = { ...rest, category_id: categoryId };

    const { data, error } = await supabase
      .from("menu_items")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();
    if (error) {
      console.error("Supabase update error:", error);
      throw error;
    }

    if (typeof price !== "undefined") {
      await supabase.from("menu_prices").delete().eq("item_id", id);
      const { error: priceErr } = await supabase
        .from("menu_prices")
        .insert([{ item_id: id, price, currency }]);
      if (priceErr) {
        console.error("Supabase price update error:", priceErr);
        throw priceErr;
      }
    }

    return data;
  },

  async deleteMenuItem(id) {
    const { data, error } = await supabase
      .from("menu_items")
      .delete()
      .eq("id", id);
    if (error) {
      console.error("Supabase delete error:", error);
      throw error;
    }
    return data;
  },

  // Placeholder for party menus to avoid runtime errors; extend when data is available
  async getPartyMenus() {
    return [];
  },

  // Fetch categories with nested menu items and variants ordered by sort_order
  async getMenuWithVariants() {
    const { data, error } = await supabase
      .from("menu_categories")
      .select(`
        id, slug, name, sort_order,
        menu_items (
          id, name, description, program, origin, aging_days, cut, sort_order, is_active,
          menu_item_variants ( id, label, size_oz, size_g, portion, price, currency, sort_order )
        )
      `)
      .order("sort_order", { ascending: true })
      .order("sort_order", { foreignTable: "menu_items", ascending: true })
      .order("sort_order", { foreignTable: "menu_items.menu_item_variants", ascending: true });

    if (error) {
      console.error("Supabase menu_categories fetch error:", error);
      throw error;
    }
    return data || [];
  },

  // Fetch a single category (e.g., steaks) with nested menu items and variants
  async getCategoryBySlug(slug = "steaks") {
    const { data, error } = await supabase
      .from("menu_categories")
      .select(`
        id, slug, name,
        menu_items (
          id, name, program, origin, aging_days, cut,
          menu_item_variants ( id, label, size_oz, price, currency, sort_order )
        )
      `)
      .eq("slug", slug)
      .single();

    if (error) {
      console.error(`Supabase menu_categories fetch error for slug "${slug}":`, error);
      throw error;
    }

    return data;
  },

  // Fetch categories with only active menu items (inner join) and ordered lists
  async getActiveCategoriesWithItems() {
    const { data, error } = await supabase
      .from("menu_categories")
      .select(`
        id, slug, name, sort_order,
        menu_items!inner (
          id, name, description, program, origin, aging_days, cut, sort_order, is_active,
          menu_item_variants ( id, label, size_oz, size_g, portion, price, currency, sort_order )
        )
      `)
      .order("sort_order", { ascending: true })
      .order("sort_order", { foreignTable: "menu_items", ascending: true })
      .order("sort_order", { foreignTable: "menu_items.menu_item_variants", ascending: true })
      .eq("menu_items.is_active", true);

    if (error) {
      console.error("Supabase active menu categories fetch error:", error);
      throw error;
    }
    return data || [];
  },

  // Fetch full category tree with options/addons/prices, matching provided SQL schema
  async getCategoriesWithPricing() {
    const { data, error } = await supabase
      .from("menu_categories")
      .select(`
        id, slug, name, sort_order,
        menu_items (
          id, name, description, origin, notes, created_at,
          menu_item_options ( id, option_name, option_group, sort_order, created_at,
            menu_prices ( id, price, currency, created_at )
          ),
          menu_addons ( id, name, description, created_at,
            menu_prices ( id, price, currency, created_at )
          ),
          menu_prices ( id, price, currency, created_at )
        )
      `)
      .order("sort_order", { ascending: true })
      .order("created_at", { foreignTable: "menu_items", ascending: true })
      .order("sort_order", { foreignTable: "menu_items.menu_item_options", ascending: true })
      .order("created_at", { foreignTable: "menu_items.menu_addons", ascending: true });

    if (error) {
      console.error("Supabase menu_categories (pricing) fetch error:", error);
      throw error;
    }

    return data || [];
  },

  // -------- Pre-fixed Menus (Supabase) --------
  async getPrefixedMenus() {
    try {
      const { data, error } = await supabase
        .from("prefixed_menus")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        throw error;
      }
      const list = data || [];
      writeCache(PREFX_CACHE_KEY, list);
      return list;
    } catch (err) {
      console.error("Supabase prefixed_menus fetch error:", err);
      const cached = readCache(PREFX_CACHE_KEY);
      if (cached) {
        console.warn("Using cached prefixed menus due to fetch error");
        return cached;
      }
      throw err;
    }
  },

  async savePrefixedMenu(payload) {
    const { data, error } = await supabase
      .from("prefixed_menus")
      .insert([payload])
      .select()
      .single();
    if (error) {
      console.error("Supabase prefixed_menus save error:", error);
      throw error;
    }
    return data;
  },

  async updatePrefixedMenu(id, payload) {
    const { data, error } = await supabase
      .from("prefixed_menus")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) {
      console.error("Supabase prefixed_menus update error:", error);
      throw error;
    }
    return data;
  },

  async deletePrefixedMenu(id) {
    const targetId = typeof id === "string" ? id : (id && id.id ? id.id : null);
    if (!targetId) throw new Error("Missing menu id");
    const { error } = await supabase
      .from("prefixed_menus")
      .delete()
      .eq("id", targetId);
    if (error) {
      console.error("Supabase prefixed_menus delete error:", error);
      throw error;
    }
    return true;
  },
};
