import React from 'react';

interface SummaryProps {
  rawTotal: number;
  roundedTotal: number;
  cost: number;
}

const Summary: React.FC<SummaryProps> = ({ rawTotal, roundedTotal, cost }) => {
  return (
    <div className="bg-indigo-50 p-6 rounded-xl border-2 border-indigo-200 space-y-4">
      <h2 className="text-xl font-bold text-slate-800">Oppsummering</h2>
      <div className="flex justify-between items-center text-slate-700">
        <span>Total lastemeter (før avrunding):</span>
        <span className="font-semibold text-lg">{rawTotal.toFixed(2)}</span>
      </div>
      <div className="flex justify-between items-center text-slate-700">
        <span>Total lastemeter (etter avrunding):</span>
        <span className="font-semibold text-lg">{roundedTotal}</span>
      </div>
      <hr className="border-indigo-200" />
      <div className="pt-2">
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold text-slate-900">Total fraktpris:</span>
          <span className="text-4xl font-extrabold text-indigo-600">
            {new Intl.NumberFormat('nb-NO', {
              style: 'currency',
              currency: 'NOK',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }).format(cost)}
          </span>
        </div>
        <p className="mt-2 text-right text-sm text-slate-600 italic">
          *Dette er en ca. utregning basert på varekategorier. Den faktiske fraktkostnaden kan endre seg ved bestilling.
        </p>
      </div>
    </div>
  );
};

export default Summary;