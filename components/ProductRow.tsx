import React from 'react';
import type { ProductRowState } from '../types';
import { PRODUCT_CATEGORIES } from '../constants';

interface ProductRowProps {
  row: ProductRowState;
  onUpdate: (id: number, field: 'quantity' | 'category', value: string) => void;
  onRemove: (id: number) => void;
  canBeRemoved: boolean;
}

const ProductRow: React.FC<ProductRowProps> = ({ row, onUpdate, onRemove, canBeRemoved }) => {
  const rowLoadingMeters = (parseFloat(row.quantity) || 0) * (PRODUCT_CATEGORIES[row.category] || 0);

  return (
    <div className="grid grid-cols-12 gap-4 items-end p-3 bg-slate-50 rounded-lg border border-slate-200">
      {/* Antall */}
      <div className="col-span-12 sm:col-span-3">
        <label htmlFor={`quantity-${row.id}`} className="block text-sm font-medium text-slate-700 mb-1">
          Antall
        </label>
        <input
          id={`quantity-${row.id}`}
          type="number"
          min="0"
          value={row.quantity}
          onChange={(e) => onUpdate(row.id, 'quantity', e.target.value)}
          placeholder="0"
          className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition"
        />
      </div>
      
      {/* Produktkategori */}
      <div className="col-span-12 sm:col-span-5">
        <label htmlFor={`category-${row.id}`} className="block text-sm font-medium text-slate-700 mb-1">
          Produktkategori
        </label>
        <select
          id={`category-${row.id}`}
          value={row.category}
          onChange={(e) => onUpdate(row.id, 'category', e.target.value)}
          className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition bg-white text-slate-900"
        >
          {Object.keys(PRODUCT_CATEGORIES).map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>
      
      {/* Lastemeter for rad */}
      <div className="col-span-9 sm:col-span-3">
        <span className="block text-sm font-medium text-slate-700 mb-1">Lastemeter</span>
        <div className="w-full p-2 bg-slate-100 border border-slate-200 rounded-md text-right font-semibold text-slate-800">
          {rowLoadingMeters.toFixed(2)}
        </div>
      </div>
      
      {/* Slett-knapp */}
      <div className="col-span-3 sm:col-span-1 flex justify-end">
        {canBeRemoved && (
          <button
            onClick={() => onRemove(row.id)}
            aria-label="Fjern rad"
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-100 rounded-full transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductRow;