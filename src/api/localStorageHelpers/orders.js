const ORDERS_KEY = 'tablemaster_orders';
const ORDER_ITEMS_KEY = 'tablemaster_order_items';

export const OrderStorage = {
  // Orders
  getOrdersByTable: (tableId) => {
    const all = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
    return all.filter(o => o.table_id === tableId);
  },
  getAllOrders: () => JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]'),
  createOrder: (order) => {
    const all = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
    const newOrder = { ...order, id: Date.now().toString() };
    all.push(newOrder);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(all));
    return newOrder;
  },
  updateOrder: (id, data) => {
    const all = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
    const updated = all.map(o => (o.id === id ? { ...o, ...data } : o));
    localStorage.setItem(ORDERS_KEY, JSON.stringify(updated));
    return updated.find(o => o.id === id);
  },
  deleteOrder: (id) => {
    const all = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
    const filtered = all.filter(o => o.id !== id);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(filtered));
    return filtered;
  },

  // Order Items
  getOrderItemsByTable: (tableId) => {
    const all = JSON.parse(localStorage.getItem(ORDER_ITEMS_KEY) || '[]');
    return all.filter(i => i.table_id === tableId);
  },
  getAllOrderItems: () => JSON.parse(localStorage.getItem(ORDER_ITEMS_KEY) || '[]'),
  createOrderItem: (item) => {
    const all = JSON.parse(localStorage.getItem(ORDER_ITEMS_KEY) || '[]');
    const newItem = { ...item, id: `${Date.now().toString()}-${Math.random().toString(36).slice(2,8)}` };
    all.push(newItem);
    localStorage.setItem(ORDER_ITEMS_KEY, JSON.stringify(all));
    return newItem;
  },
  updateOrderItem: (id, data) => {
    const all = JSON.parse(localStorage.getItem(ORDER_ITEMS_KEY) || '[]');
    const updated = all.map(i => (i.id === id ? { ...i, ...data } : i));
    localStorage.setItem(ORDER_ITEMS_KEY, JSON.stringify(updated));
    return updated.find(i => i.id === id);
  },
  deleteOrderItem: (id) => {
    const all = JSON.parse(localStorage.getItem(ORDER_ITEMS_KEY) || '[]');
    const filtered = all.filter(i => i.id !== id);
    localStorage.setItem(ORDER_ITEMS_KEY, JSON.stringify(filtered));
    return filtered;
  },
};
