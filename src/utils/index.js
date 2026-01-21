// src/utils/index.js
// Re-export selected utilities from utils.jsx so imports of '@/utils' work
import { createPageUrl as _createPageUrl, cn as _cn } from '../utils.jsx';
import { haptic as _haptic, isIOS as _isIOS } from './haptics';

export const createPageUrl = _createPageUrl;
export const cn = _cn;
export const haptic = _haptic;
export const isIOS = _isIOS;

export function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
