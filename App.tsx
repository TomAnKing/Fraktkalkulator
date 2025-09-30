import React, { useState, useMemo } from 'react';
import type { ProductRowState } from './types';
import { DESTINATIONS, PRODUCT_CATEGORIES } from './constants';
import ProductRow from './components/ProductRow';
import Summary from './components/Summary';

const initialRows: ProductRowState[] = [{ id: 0, quantity: '', category: 'Velg kategori...' }];

const App: React.FC = () => {
  const [destination, setDestination] = useState(Object.keys(DESTINATIONS)[0]);
  const [rows, setRows] = useState<ProductRowState[]>(initialRows);
  const [nextId, setNextId] = useState(1);

  const handleRowUpdate = (id: number, field: 'quantity' | 'category', value: string) => {
    setRows((prevRows) =>
      prevRows.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const addRow = () => {
    setRows(prevRows => [...prevRows, { id: nextId, quantity: '', category: 'Velg kategori...' }]);
    setNextId(prevId => prevId + 1);
  };
  
  const removeRow = (idToRemove: number) => {
    setRows(prevRows => prevRows.filter(row => row.id !== idToRemove));
  };


  const { rawTotalLoadingMeters, roundedTotalLoadingMeters, totalCost } = useMemo(() => {
    const rawTotal = rows.reduce((acc, row) => {
      const quantity = parseFloat(row.quantity) || 0;
      const categoryValue = PRODUCT_CATEGORIES[row.category] || 0;
      return acc + quantity * categoryValue;
    }, 0);

    const roundedTotal = Math.ceil(rawTotal);
    const cost = roundedTotal * (DESTINATIONS[destination] || 0);

    return {
      rawTotalLoadingMeters: rawTotal,
      roundedTotalLoadingMeters: roundedTotal,
      totalCost: cost
    };
  }, [rows, destination]);
  
  const resetCalculator = () => {
    setRows(initialRows);
    setDestination(Object.keys(DESTINATIONS)[0]);
    setNextId(1);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-100">
      <div className="w-full max-w-4xl bg-white p-6 sm:p-8 rounded-2xl shadow-2xl space-y-8">
        <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">RE - Fraktkalkulator</h1>
            <p className="mt-2 text-slate-500">Beregn fraktpris fra Stokke til ditt kontor basert på lastemeter.</p>
        </div>

        {/* Destination Selector */}
        <div className="space-y-2">
          <label htmlFor="destination" className="block text-lg font-semibold text-slate-800">
            1. Velg destinasjon
          </label>
          <select
            id="destination"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-lg bg-white text-slate-900"
          >
            {Object.keys(DESTINATIONS).map((dest) => (
              <option key={dest} value={dest}>
                {dest} ( {DESTINATIONS[dest]} kr / lastemeter )
              </option>
            ))}
          </select>
        </div>

        {/* Product Rows */}
        <div className="space-y-4">
            <h2 className="block text-lg font-semibold text-slate-800">
                2. Legg til produkter
            </h2>
          {rows.map((row) => (
            <ProductRow 
                key={row.id} 
                row={row} 
                onUpdate={handleRowUpdate} 
                onRemove={removeRow}
                canBeRemoved={rows.length > 1}
            />
          ))}
           <div className="flex justify-start pt-2">
            <button
              onClick={addRow}
              className="px-5 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 transition flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Legg til produktlinje
            </button>
          </div>
        </div>

        {/* Summary */}
        <Summary 
          rawTotal={rawTotalLoadingMeters}
          roundedTotal={roundedTotalLoadingMeters}
          cost={totalCost}
        />
        
        {/* Reset Button */}
        <div className="flex justify-end">
            <button 
                onClick={resetCalculator}
                className="px-6 py-2 bg-slate-600 text-white font-semibold rounded-lg shadow-md hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-opacity-75 transition"
            >
                Nullstill
            </button>
        </div>
      </div>
    </div>
  );
};

export default App;