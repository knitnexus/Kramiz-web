/**
 * ItemsTable.tsx
 * Feature: Delivery Challan (Phase 3)
 *
 * Reusable editable table for DC / Inward Challan line items.
 * Each row: Description | Quantity | Unit | [delete]
 *
 * Used by: DCForm, InwardChallanForm
 */

import React from 'react';
import { DCItem } from '../../../types';

const COMMON_UNITS = ['KG', 'MTR', 'PCS', 'SET', 'BAG', 'BOX', 'ROLL', 'BUNDLE', 'DOZEN'];

interface ItemsTableProps {
    items:    DCItem[];
    onChange: (items: DCItem[]) => void;
}

const BLANK_ITEM: DCItem = { description: '', quantity: 0, unit: 'KG' };

export const ItemsTable: React.FC<ItemsTableProps> = ({ items, onChange }) => {
    const update = (index: number, patch: Partial<DCItem>) => {
        const next = items.map((item, i) => i === index ? { ...item, ...patch } : item);
        onChange(next);
    };

    const addRow  = () => onChange([...items, { ...BLANK_ITEM }]);
    const removeRow = (index: number) => onChange(items.filter((_, i) => i !== index));

    return (
        <div className="space-y-2">
            {/* Header row */}
            <div className="grid grid-cols-[1fr_80px_90px_32px] gap-2 px-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Description</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Qty</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Unit</p>
                <span />
            </div>

            {/* Item rows */}
            {items.map((item, i) => (
                <div key={i} className="grid grid-cols-[1fr_80px_90px_32px] gap-2 items-center">
                    <input
                        type="text"
                        value={item.description}
                        onChange={e => update(i, { description: e.target.value })}
                        placeholder={`Item ${i + 1}`}
                        className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#008069] transition-all"
                    />
                    <input
                        type="number"
                        min={0}
                        value={item.quantity || ''}
                        onChange={e => update(i, { quantity: parseFloat(e.target.value) || 0 })}
                        placeholder="0"
                        className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#008069] transition-all text-center"
                    />
                    <select
                        value={item.unit}
                        onChange={e => update(i, { unit: e.target.value })}
                        className="px-2 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#008069] transition-all"
                    >
                        {COMMON_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                        <option value={item.unit === '' || !COMMON_UNITS.includes(item.unit) ? item.unit : ''} disabled hidden>
                            {item.unit}
                        </option>
                    </select>
                    <button
                        type="button"
                        onClick={() => removeRow(i)}
                        disabled={items.length === 1}
                        className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-all disabled:opacity-0 disabled:pointer-events-none"
                        title="Remove row"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            ))}

            {/* Add row */}
            <button
                type="button"
                onClick={addRow}
                className="flex items-center gap-2 text-sm font-bold text-[#008069] hover:text-[#006a57] transition-colors mt-1"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                Add Item
            </button>
        </div>
    );
};
