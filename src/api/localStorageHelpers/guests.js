const GUESTS_KEY = "tablemaster_guests";

export const GuestStorage = {
  getGuests: (tableId) => {
    const all = JSON.parse(localStorage.getItem(GUESTS_KEY) || "[]");
    return tableId ? all.filter((g) => g.table_id === tableId) : all;
  },

  getAllGuests: () => {
    return JSON.parse(localStorage.getItem(GUESTS_KEY) || "[]");
  },

  createGuest: (guest) => {
    const all = JSON.parse(localStorage.getItem(GUESTS_KEY) || "[]");
    // Ensure unique IDs even when creating multiple guests quickly
    const newGuest = { 
      ...guest, 
      id: `${Date.now().toString()}-${Math.random().toString(36).slice(2, 8)}` 
    };
    all.push(newGuest);
    localStorage.setItem(GUESTS_KEY, JSON.stringify(all));
    return newGuest;
  },

  updateGuest: (id, data) => {
    const all = JSON.parse(localStorage.getItem(GUESTS_KEY) || "[]");
    const updated = all.map((g) => (g.id === id ? { ...g, ...data } : g));
    localStorage.setItem(GUESTS_KEY, JSON.stringify(updated));
    return updated.find((g) => g.id === id);
  },

  deleteGuest: (id) => {
    const all = JSON.parse(localStorage.getItem(GUESTS_KEY) || "[]");
    const filtered = all.filter((g) => g.id !== id);
    localStorage.setItem(GUESTS_KEY, JSON.stringify(filtered));
    return filtered;
  },
};
