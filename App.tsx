import React, { useState, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ProductRowState } from './types';
import { DESTINATIONS, PRODUCT_CATEGORIES } from './constants';
import ProductRow from './components/ProductRow';
import Summary from './components/Summary';

const initialRows: ProductRowState[] = [{ id: 0, quantity: '', category: 'Velg kategori...' }];

const App: React.FC = () => {
  const [destination, setDestination] = useState(Object.keys(DESTINATIONS)[0]);
  const [rows, setRows] = useState<ProductRowState[]>(initialRows);
  const [nextId, setNextId] = useState(1);
  const [hasLoadingRamp, setHasLoadingRamp] = useState(true); // true for 'Ja', false for 'Nei'

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


  const { rawTotalLoadingMeters, billableLoadingMeters, totalCost, loadingRampSurcharge, subtotal } = useMemo(() => {
    const rawTotal = rows.reduce((acc, row) => {
      const quantity = parseFloat(row.quantity) || 0;
      const categoryValue = PRODUCT_CATEGORIES[row.category] || 0;
      return acc + quantity * categoryValue;
    }, 0);

    let billableTotal = rawTotal;
    if (rawTotal > 0 && rawTotal < 1) {
      billableTotal = 1;
    }

    const baseCost = billableTotal * (DESTINATIONS[destination] || 0);
    
    const surcharge = hasLoadingRamp ? 0 : 2500;
    const finalCost = baseCost + surcharge;

    return {
      rawTotalLoadingMeters: rawTotal,
      billableLoadingMeters: billableTotal,
      totalCost: finalCost,
      loadingRampSurcharge: surcharge,
      subtotal: baseCost,
    };
  }, [rows, destination, hasLoadingRamp]);
  
  const resetCalculator = () => {
    setRows(initialRows);
    setDestination(Object.keys(DESTINATIONS)[0]);
    setNextId(1);
    setHasLoadingRamp(true);
  };
  
  const generatePdf = () => {
    if (totalCost === 0) return;
    
    const doc = new jsPDF();
    const mainColor = [225, 106, 3]; // Hex: #E16A03

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(mainColor[0], mainColor[1], mainColor[2]);
    doc.text('Kvittering for Fraktberegning', 105, 20, { align: 'center' });
    doc.setTextColor(0); // Reset to black

    // Date and Destination
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    const date = new Date().toLocaleDateString('nb-NO');
    doc.text(`Dato: ${date}`, 20, 35);
    doc.text(`Destinasjon: ${destination}`, 20, 42);

    // Aggregate product data
    const aggregatedProducts: { [category: string]: { quantity: number; loadingMeters: number } } = {};
    rows.forEach(row => {
      if (row.category !== 'Velg kategori...' && parseFloat(row.quantity) > 0) {
        if (!aggregatedProducts[row.category]) {
          aggregatedProducts[row.category] = { quantity: 0, loadingMeters: 0 };
        }
        const quantity = parseFloat(row.quantity);
        const loadingMeters = quantity * (PRODUCT_CATEGORIES[row.category] || 0);
        aggregatedProducts[row.category].quantity += quantity;
        aggregatedProducts[row.category].loadingMeters += loadingMeters;
      }
    });

    const tableBody = Object.entries(aggregatedProducts).map(([category, data]) => [
      category,
      data.quantity.toString(),
      data.loadingMeters.toFixed(2),
    ]);
    
    // Create table with updated styling
    autoTable(doc, {
      startY: 55,
      head: [['Varekategori', 'Antall', 'Lastemeter']],
      body: tableBody,
      theme: 'grid', // Use 'grid' for a bordered look
      headStyles: { fillColor: mainColor },
    });

    const finalY = (doc as any).lastAutoTable.finalY || 60; // Fallback for safety
    
    // Summary below table
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(mainColor[0], mainColor[1], mainColor[2]);
    doc.text('Oppsummering', 20, finalY + 15);
    doc.setTextColor(0);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    let currentY = finalY + 25;
    
    doc.text(`Total lastemeter (før avrunding):`, 20, currentY);
    doc.text(`${rawTotalLoadingMeters.toFixed(2)}`, 190, currentY, { align: 'right' });
    currentY += 7;

    doc.text(`Fakturerbare lastemeter:`, 20, currentY);
    doc.text(`${billableLoadingMeters.toFixed(2)}`, 190, currentY, { align: 'right' });
    currentY += 7;

    doc.text(`Lasterampe tilgjengelig:`, 20, currentY);
    doc.text(hasLoadingRamp ? 'Ja' : 'Nei', 190, currentY, { align: 'right' });
    currentY += 7;

    if (loadingRampSurcharge > 0) {
        const subtotalText = `${new Intl.NumberFormat('nb-NO', { style: 'decimal', minimumFractionDigits: 0 }).format(subtotal)} kr`;
        doc.text(`Fraktpris (subtotal):`, 20, currentY);
        doc.text(subtotalText, 190, currentY, { align: 'right' });
        currentY += 7;

        const surchargeText = `${new Intl.NumberFormat('nb-NO', { style: 'decimal', minimumFractionDigits: 0 }).format(loadingRampSurcharge)} kr`;
        doc.text(`Påslag uten lasterampe:`, 20, currentY);
        doc.text(surchargeText, 190, currentY, { align: 'right' });
        currentY += 7;
    }
    
    // Orange divider line
    doc.setDrawColor(mainColor[0], mainColor[1], mainColor[2]);
    doc.setLineWidth(0.5);
    doc.line(20, currentY, 190, currentY);
    currentY += 9;

    // Final total cost - styled
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(mainColor[0], mainColor[1], mainColor[2]);
    const totalCostText = `${new Intl.NumberFormat('nb-NO', { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(totalCost)} kr`;
    doc.text(`Total fraktpris:`, 20, currentY);
    doc.text(totalCostText, 190, currentY, { align: 'right' });
    doc.setTextColor(0);

    // Footer
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150);
    const footerText1 = '*Dette er en ca. utregning basert på varekategorier. Den faktiske fraktkostnaden kan endre seg ved bestilling.';
    doc.text(footerText1, 105, doc.internal.pageSize.getHeight() - 12, { align: 'center' });

    // Save
    doc.save('Kvittering - Beregnet Frakt.pdf');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-100">
      <div className="w-full max-w-4xl bg-white p-6 sm:p-8 rounded-2xl shadow-2xl space-y-8">
        <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">RE - Fraktkalkulator</h1>
            <p className="mt-2 text-slate-500">Beregn fraktpris fra Stokke til ditt kontor basert på lastemeter.</p>
          <p className="mt-2 text-slate-600 italic">
          *Dette er en ca. utregning basert på varekategorier. Den faktiske fraktkostnaden kan endre seg ved bestilling.
        </p>
        </div>

        {/* Destination & Loading Ramp */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 md:items-start">
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
             <div className="space-y-2">
                <label className="block text-lg font-semibold text-slate-800">
                    Har destinasjonen lasterampe?
                </label>
                <div className="flex items-center gap-x-6 pb-3">
                    <label className="flex items-center gap-2 cursor-pointer p-2">
                        <input
                            type="radio"
                            name="loadingRamp"
                            checked={hasLoadingRamp}
                            onChange={() => setHasLoadingRamp(true)}
                            className="h-5 w-5 border-slate-400 focus:ring-2 focus:ring-offset-2 focus:ring-[#E16A03]"
                        />
                        <span className="text-slate-800 text-lg">Ja</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer p-2">
                        <input
                            type="radio"
                            name="loadingRamp"
                            checked={!hasLoadingRamp}
                            onChange={() => setHasLoadingRamp(false)}
                            className="h-5 w-5 border-slate-400 focus:ring-2 focus:ring-offset-2 focus:ring-[#E16A03]"
                        />
                        <span className="text-slate-800 text-lg">Nei</span>
                    </label>
                </div>
            </div>
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
              className="px-5 py-2 bg-[#E16A03] text-white font-semibold rounded-lg shadow-md hover:bg-[#c85a02] focus:outline-none focus:ring-2 focus:ring-[#E16A03] focus:ring-opacity-75 transition flex items-center gap-2"
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
          billableTotal={billableLoadingMeters}
          cost={totalCost}
          surcharge={loadingRampSurcharge}
          hasLoadingRamp={hasLoadingRamp}
          subtotal={subtotal}
        />
        
        {/* Action Buttons */}
        <div className="flex justify-end items-center gap-4 pt-4">
            <button
              onClick={generatePdf}
              disabled={totalCost === 0}
              className="px-6 py-2 bg-[#E16A03] text-white font-semibold rounded-lg shadow-md hover:bg-[#c85a02] focus:outline-none focus:ring-2 focus:ring-[#E16A03] focus:ring-opacity-75 transition disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Last ned kvittering
            </button>
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
