// src/utils/index.js
// Re-export selected utilities from utils.jsx so imports of '@/utils' work
import { createPageUrl as _createPageUrl, cn as _cn } from '../utils.jsx';

export const createPageUrl = _createPageUrl;
export const cn = _cn;

export function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
