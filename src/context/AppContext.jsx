import { createContext, useState, useEffect } from "react";
import { TableStorage } from '@/api/localStorageHelpers/tables';
import { MenuStorage } from '@/api/localStorageHelpers/menu';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [tables, setTables] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [darkMode, setDarkMode] = useState(false);

  // Initialize from the storage helpers so sources are consistent
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        let t = TableStorage.getAllTables();
        const m = await MenuStorage.getMenuItems();

        if (!mounted) return;
        // Strip out legacy demo tables if present
        const demoSet = new Set(['t1', 't2', 'vip-1']);
        if (t && t.length) {
          const filtered = t.filter(tbl => !demoSet.has((tbl.table_number || '').toLowerCase()));
          if (filtered.length !== t.length) {
            t = filtered;
            localStorage.setItem('tablemaster_tables', JSON.stringify(filtered));
          }
        }

        setTables(t || []);
        setMenuItems(m || []);

        // Cleanup any old seeded demo tables (T1/T2/VIP-1) if they are the only ones present
        if (t && t.length > 0 && t.length <= 3) {
          const demoSet = new Set(['t1', 't2', 'vip-1']);
          const allDemo = t.every(tbl => demoSet.has((tbl.table_number || '').toLowerCase()));
          if (allDemo) {
            localStorage.removeItem('tablemaster_tables');
            setTables([]);
          }
        }
        if ((!m || m.length === 0) && typeof window !== 'undefined') {
          try {
            const sampleMenu = [
              { name: 'House Salad', category: 'salad', price: 8.5, description: 'Fresh greens with house dressing' },
              { name: 'Steak Frites', category: 'steaks', price: 24.0, description: 'Grilled steak with fries' },
            ];
            for (const item of sampleMenu) {
              await MenuStorage.createMenuItem(item);
            }
            const seededMenu = await MenuStorage.getMenuItems();
            if (mounted) setMenuItems(seededMenu || []);
          } catch (err) {
            console.warn('Could not seed sample menu items:', err);
          }
        }
      } catch (err) {
        console.error('Error initializing AppContext from storage:', err);
      }

      const savedDark = JSON.parse(localStorage.getItem('darkMode'));
      if (mounted && savedDark) setDarkMode(savedDark);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // Only manage darkMode persistence here — other data is persisted by helpers
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
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
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
