import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Users, Clock, AlertCircle, Trash2 } from 'lucide-react';
import { cn } from '@/utils';

export default function TableCard({ table, orderCount = 0, hasAllergens = false, onDelete }) {
  return (
    <div className="relative group">
      <Link
        to={createPageUrl(`TableDetails?id=${table.id}`)}
        className={cn(
          "block p-4 rounded-2xl border-2 border-stone-200 bg-white transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
        )}
      >
        {/* Header: Table Number and Allergen Icon */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm"
              style={{ backgroundColor: table.color || '#D97706' }}
            >
              {table.table_number}
            </div>
            {table.notes ? (
              <div className="text-sm text-stone-900 max-w-[160px] truncate">
                {table.notes}
              </div>
            ) : null}
          </div>
          {hasAllergens && (
            <div className="p-1.5 rounded-full bg-red-100">
              <AlertCircle className="h-4 w-4 text-red-600" />
            </div>
          )}
        </div>

        {/* Body: Guest count, Section, Status, Orders */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-stone-600">
            <Users className="h-4 w-4" />
            <span className="text-sm font-medium">{table.guest_count || 0} guests</span>
          </div>

          {table.section && (
            <p className="text-xs text-stone-500">Section: {table.section}</p>
          )}

          <div className="flex items-center justify-between pt-2">
            {orderCount > 0 && (
              <div className="flex items-center gap-1 text-xs text-stone-500">
                <Clock className="h-3 w-3" />
                {orderCount} items
              </div>
            )}
          </div>
        </div>
      </Link>

      {onDelete && (
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(table); }}
          className="absolute top-1/2 -translate-y-1/2 right-2 p-2 rounded-full bg-white/90 border border-stone-200 shadow-sm text-stone-500 hover:text-red-600 hover:border-red-200 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label={`Delete table ${table.table_number}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
