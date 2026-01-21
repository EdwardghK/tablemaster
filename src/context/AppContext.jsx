import { createContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/supabase";
import { TableStorage } from "@/api/localStorageHelpers/tables";
import { MenuStorage } from "@/api/localStorageHelpers/menu";
import { AccessRequests } from "@/api/accessRequests";
import { ChangeRequests } from "@/api/changeRequests";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [tables, setTables] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState("user");
  const [editRequest, setEditRequest] = useState(null);
  const [accessLoading, setAccessLoading] = useState(true);

  // Resolve role from profile or user metadata immediately (before the async load finishes)
  const resolvedRole = (
    profile?.role ||
    user?.user_metadata?.role ||
    role ||
    "user"
  ).toString().toLowerCase();
  const isAdmin = resolvedRole === "admin" || resolvedRole === "god";
  const requiresApproval = !isAdmin;
  // Everyone can perform edits; non-admin changes will be recorded for approval
  const canEdit = true;

  const loadAccessState = useCallback(async () => {
    setAccessLoading(true);
    let sessionUser = null;
    let profileRow = null;
    let nextRole = "user";
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      sessionUser = sessionData?.session?.user || null;
      setUser(sessionUser);
      nextRole = (sessionUser?.user_metadata?.role || "user").toString().toLowerCase();

      if (sessionUser) {
        try {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("full_name, phone, email, role")
            .eq("user_id", sessionUser.id)
            .maybeSingle();
          profileRow = profileData || null;
          if (profileRow?.role) nextRole = (profileRow.role || "user").toString().toLowerCase();
        } catch (err) {
          console.warn("Could not load profile:", err);
        }

        try {
          const latest = await AccessRequests.getLatestForUser(sessionUser.id);
          setEditRequest(latest);
        } catch (err) {
          // Ignore missing approval tables; just proceed without blocking the app
          if (err?.code !== "PGRST205") {
            console.warn("Could not load edit request:", err);
          }
          setEditRequest(null);
        }
      } else {
        setEditRequest(null);
      }

      setProfile(profileRow);
      setRole(nextRole);
      return sessionUser;
    } finally {
      setAccessLoading(false);
    }
  }, []);

  const refreshAccess = useCallback(async () => {
    await loadAccessState();
  }, [loadAccessState]);

  const submitEditRequest = useCallback(
    async (reason = "") => {
      if (editRequest?.status === "pending") {
        return editRequest;
      }
      const { data } = user ? { data: { user } } : await supabase.auth.getUser();
      const currentUser = data?.user;
      if (!currentUser) throw new Error("You must be signed in to request edit access");
      const created = await AccessRequests.submit(currentUser, reason);
      setEditRequest(created);
      return created;
    },
    [editRequest, user]
  );

  // Initialize from the storage helpers so sources are consistent
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const sessionUser = await loadAccessState();

        let t = [];
        if (sessionUser?.id) {
          t = await TableStorage.getAllTables();
        }
        const m = await MenuStorage.getMenuItems();

        if (!mounted) return;
        // Strip out legacy demo tables if present
        const demoSet = new Set(["t1", "t2", "vip-1"]);
        if (t && t.length) {
          const filtered = t.filter(
            (tbl) => !demoSet.has((tbl.table_number || "").toLowerCase())
          );
          if (filtered.length !== t.length) {
            t = filtered;
            localStorage.setItem("tablemaster_tables", JSON.stringify(filtered));
          }
        }

        setTables(t || []);
        setMenuItems(m || []);

        // Cleanup any old seeded demo tables (T1/T2/VIP-1) if they are the only ones present
        if (t && t.length > 0 && t.length <= 3) {
          const demoSetInner = new Set(["t1", "t2", "vip-1"]);
          const allDemo = t.every((tbl) =>
            demoSetInner.has((tbl.table_number || "").toLowerCase())
          );
          if (allDemo) {
            localStorage.removeItem("tablemaster_tables");
            setTables([]);
          }
        }
        if ((!m || m.length === 0) && typeof window !== "undefined") {
          try {
            const sampleMenu = [
              {
                name: "House Salad",
                category: "salad",
                price: 8.5,
                description: "Fresh greens with house dressing",
              },
              {
                name: "Steak Frites",
                category: "steaks",
                price: 24.0,
                description: "Grilled steak with fries",
              },
            ];
            for (const item of sampleMenu) {
              await MenuStorage.createMenuItem(item);
            }
            const seededMenu = await MenuStorage.getMenuItems();
            if (mounted) setMenuItems(seededMenu || []);
          } catch (err) {
            console.warn("Could not seed sample menu items:", err);
          }
        }
      } catch (err) {
        console.error("Error initializing AppContext from storage:", err);
      }

      const savedDark = JSON.parse(localStorage.getItem("darkMode"));
      if (mounted && savedDark) setDarkMode(savedDark);
    })();

    return () => {
      mounted = false;
    };
  }, [loadAccessState]);

  // Only manage darkMode persistence here – other data is persisted by helpers
  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
    if (darkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [darkMode]);

  return (
    <AppContext.Provider
      value={{
        tables,
        setTables,
        menuItems,
        setMenuItems,
        darkMode,
        setDarkMode,
        user,
        profile,
        role,
        isAdmin,
        canEdit,
        requiresApproval,
        editRequest,
        accessLoading,
        refreshAccess,
        submitEditRequest,
        submitChangeRequest: ChangeRequests.submit,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
