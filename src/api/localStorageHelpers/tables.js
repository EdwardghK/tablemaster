const TABLES_KEY = "tablemaster_tables";

export const TableStorage = {
  getAllTables: () => JSON.parse(localStorage.getItem(TABLES_KEY) || "[]"),

  getTable: (id) => {
    const all = JSON.parse(localStorage.getItem(TABLES_KEY) || "[]");
    return all.find((t) => t.id === id);
  },

  createTable: (data) => {
    const all = JSON.parse(localStorage.getItem(TABLES_KEY) || "[]");
    const incomingNumber = (data.table_number || '').trim().toLowerCase();
    if (incomingNumber && all.some(t => (t.table_number || '').trim().toLowerCase() === incomingNumber)) {
      throw new Error('Table number already exists');
    }
    const tableNumber = (data.table_number || '').trim();
    if (!tableNumber) {
      throw new Error('Table number is required');
    }
    const guestCount = Number.isFinite(Number(data.guest_count)) ? Number(data.guest_count) : 0;
    const newTable = { 
      ...data, 
      table_number: tableNumber,
      guest_count: guestCount,
      status: data.status || 'available',
      id: Date.now().toString() 
    };
    all.push(newTable);
    localStorage.setItem(TABLES_KEY, JSON.stringify(all));
    return newTable;
  },

  updateTable: (id, data) => {
    const all = JSON.parse(localStorage.getItem(TABLES_KEY) || "[]");
    const current = all.find((t) => t.id === id);
    if (!current) return null;

    const incomingNumber = (data.table_number ?? current.table_number ?? '').trim().toLowerCase();
    if (incomingNumber && all.some(t => t.id !== id && (t.table_number || '').trim().toLowerCase() === incomingNumber)) {
      throw new Error('Table number already exists');
    }
    const tableNumber = (data.table_number ?? current.table_number ?? '').trim();
    if (!tableNumber) {
      throw new Error('Table number is required');
    }
    const guestCount = Number.isFinite(Number(data.guest_count)) ? Number(data.guest_count) : (Number(current.guest_count) || 0);

    const updated = all.map((t) => (t.id === id ? { 
      ...t, 
      ...data, 
      table_number: tableNumber,
      guest_count: guestCount,
      status: data.status || t.status || 'available',
    } : t));
    localStorage.setItem(TABLES_KEY, JSON.stringify(updated));
    return updated.find((t) => t.id === id);
  },

  deleteTable: (id) => {
    const all = JSON.parse(localStorage.getItem(TABLES_KEY) || "[]");
    const filtered = all.filter((t) => t.id !== id);
    localStorage.setItem(TABLES_KEY, JSON.stringify(filtered));
    return filtered;
  },

  getTablesBySection: (sectionName) => {
    const all = JSON.parse(localStorage.getItem(TABLES_KEY) || "[]");
    return all.filter((t) => t.section === sectionName);
  },
};
