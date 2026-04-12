import React, { useState, useEffect } from 'react';
import { filtersApi } from '../api';
import { STAFF_COLUMNS, COLUMN_LABELS } from '../constants';

const FILTER_TYPES = [
    { value: 'equals', label: 'Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'does_not_equal', label: 'Does Not Equal' },
    { value: 'does_not_contain', label: 'Does Not Contain' },
];

const FILTER_TYPE_LABELS: Record<string, string> = {
    equals: '=',
    contains: '⊃',
    does_not_equal: '≠',
    does_not_contain: '⊅',
};

const ROW_COLORS = [
    { value: 'blue', label: 'Blue', swatch: 'bg-blue-200' },
    { value: 'purple', label: 'Purple', swatch: 'bg-purple-200' },
    { value: 'pink', label: 'Pink', swatch: 'bg-pink-200' },
    { value: 'orange', label: 'Orange', swatch: 'bg-orange-200' },
    { value: 'teal', label: 'Teal', swatch: 'bg-teal-200' },
    { value: 'cyan', label: 'Cyan', swatch: 'bg-cyan-200' },
    { value: 'indigo', label: 'Indigo', swatch: 'bg-indigo-200' },
    { value: 'rose', label: 'Rose', swatch: 'bg-rose-200' },
    { value: 'lime', label: 'Lime', swatch: 'bg-lime-200' },
    { value: 'amber', label: 'Amber', swatch: 'bg-amber-200' },
];

const DEFAULT_FILTERS = [
    { column: 'contract', filter_type: 'equals', value: 'T', label: 'Contract = T/TR', color: 'yellow' },
    { column: 'pos_end', filter_type: 'equals', value: '2026-06-30', label: 'Pos End = 2026-06-30', color: 'red' },
    { column: 'pos_start', filter_type: 'equals', value: '2026-07-01', label: 'Pos Start = 2026-07-01', color: 'green' },
];

interface FiltersPageProps {
    onBack: () => void;
}

export function FiltersPage({ onBack }: FiltersPageProps) {
    const [filters, setFilters] = useState<any[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [newColumn, setNewColumn] = useState(STAFF_COLUMNS[0]);
    const [newFilterType, setNewFilterType] = useState('equals');
    const [newValue, setNewValue] = useState('');
    const [newColor, setNewColor] = useState(ROW_COLORS[0].value);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadFilters();
    }, []);

    const loadFilters = async () => {
        try {
            const userEmail = localStorage.getItem('userEmail') || 'demo@staffing.com';
            const res = await filtersApi.getAll(userEmail);
            setFilters(res.data);
        } catch (err) {
            console.error('Failed to load filters:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!newValue.trim()) {
            alert('Value is required');
            return;
        }

        try {
            await filtersApi.create(newColumn, newValue.trim(), newFilterType, newColor);
            loadFilters();
            setIsCreating(false);
            setNewColumn(STAFF_COLUMNS[0]);
            setNewFilterType('equals');
            setNewValue('');
            setNewColor(ROW_COLORS[0].value);
        } catch (err) {
            console.error('Failed to save filter:', err);
            alert('Failed to save filter');
        }
    };

    const handleToggle = async (id: number) => {
        try {
            await filtersApi.toggle(id);
            loadFilters();
        } catch (err) {
            console.error('Failed to toggle filter:', err);
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm('Delete this filter?')) {
            try {
                await filtersApi.delete(id);
                loadFilters();
            } catch (err) {
                console.error('Failed to delete filter:', err);
                alert('Failed to delete filter');
            }
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen font-mono text-gray-700">
                Loading filters...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 font-mono">
            {/* Header */}
            <header className="bg-gray-900 border-b-4 border-gray-800 p-6">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <h1 className="text-3xl font-bold">Manage Filters</h1>
                    <button
                        onClick={onBack}
                        className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-2px border-2 border-gray-800"
                    >
                        ← Back to Table
                    </button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto p-6">
                {/* Default Filters (read-only) */}
                <section className="mb-8">
                    <h2 className="text-xl font-bold mb-4 text-blue-400">Default Filters (Read-Only)</h2>
                    <div className="grid gap-4">
                        {DEFAULT_FILTERS.map((df, idx) => {
                            const colorMap: Record<string, string> = {
                                yellow: 'border-yellow-600 bg-yellow-900/20',
                                red: 'border-red-600 bg-red-900/20',
                                green: 'border-green-600 bg-green-900/20',
                            };
                            return (
                                <div
                                    key={idx}
                                    className={`border-2 rounded-2px p-4 ${colorMap[df.color]}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="font-bold text-lg">{df.label}</div>
                                            <div className="text-xs text-gray-400 mt-1">
                                                Column: {COLUMN_LABELS[df.column as keyof typeof COLUMN_LABELS] || df.column}
                                                {' · '}Type: {FILTER_TYPES.find(ft => ft.value === df.filter_type)?.label}
                                                {' · '}Value: {df.value}
                                            </div>
                                        </div>
                                        <span className="text-xs text-gray-500 border border-gray-700 px-2 py-1 rounded-2px">
                                            System
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* User Filters */}
                <section className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-green-400">Your Custom Filters</h2>
                        {!isCreating && (
                            <button
                                onClick={() => setIsCreating(true)}
                                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-2px border-2 border-green-800"
                            >
                                + New Filter
                            </button>
                        )}
                    </div>

                    {isCreating && (
                        <div className="bg-yellow-900 border-2 border-yellow-700 rounded-2px p-6 mb-6">
                            <h3 className="font-bold text-lg mb-4 text-yellow-100">Create New Filter</h3>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-bold mb-2">Column Name</label>
                                    <select
                                        value={newColumn}
                                        onChange={(e) => setNewColumn(e.target.value)}
                                        className="w-full px-3 py-2 border-2 border-gray-600 rounded-2px bg-slate-800 text-slate-100 text-sm"
                                    >
                                        {STAFF_COLUMNS.map((col) => (
                                            <option key={col} value={col}>
                                                {COLUMN_LABELS[col as keyof typeof COLUMN_LABELS] || col}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold mb-2">Filter</label>
                                    <select
                                        value={newFilterType}
                                        onChange={(e) => setNewFilterType(e.target.value)}
                                        className="w-full px-3 py-2 border-2 border-gray-600 rounded-2px bg-slate-800 text-slate-100 text-sm"
                                    >
                                        {FILTER_TYPES.map((ft) => (
                                            <option key={ft.value} value={ft.value}>
                                                {ft.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold mb-2">Value</label>
                                    <input
                                        type="text"
                                        value={newValue}
                                        onChange={(e) => setNewValue(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                                        placeholder="Enter filter value..."
                                        className="w-full px-3 py-2 border-2 border-gray-600 rounded-2px bg-slate-800 text-slate-100 text-sm placeholder-gray-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold mb-2">Row Color</label>
                                    <div className="relative">
                                        <select
                                            value={newColor}
                                            onChange={(e) => setNewColor(e.target.value)}
                                            className="w-full px-3 py-2 pl-9 border-2 border-gray-600 rounded-2px bg-slate-800 text-slate-100 text-sm"
                                        >
                                            {ROW_COLORS.map((c) => (
                                                <option key={c.value} value={c.value}>
                                                    {c.label}
                                                </option>
                                            ))}
                                        </select>
                                        <div className={`absolute left-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-2px border border-gray-500 ${ROW_COLORS.find(c => c.value === newColor)?.swatch || ''}`} />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={handleSave}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-2px border-2 border-green-800"
                                >
                                    Save Filter
                                </button>
                                <button
                                    onClick={() => {
                                        setIsCreating(false);
                                        setNewColumn(STAFF_COLUMNS[0]);
                                        setNewFilterType('equals');
                                        setNewValue('');
                                        setNewColor(ROW_COLORS[0].value);
                                    }}
                                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-2px border-2 border-gray-800"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="grid gap-4">
                        {filters.length === 0 && !isCreating && (
                            <div className="text-gray-500 text-sm border-2 border-gray-700 rounded-2px p-4 text-center">
                                No custom filters yet. Click "+ New Filter" to create one.
                            </div>
                        )}
                        {filters.map((filter) => {
                            const colorInfo = ROW_COLORS.find(c => c.value === filter.row_color);
                            return (
                                <div
                                    key={filter.id}
                                    className="bg-gray-800 border-2 border-gray-700 rounded-2px p-4"
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            {colorInfo && (
                                                <div className={`w-6 h-6 rounded-2px border border-gray-500 flex-shrink-0 ${colorInfo.swatch}`} title={colorInfo.label} />
                                            )}
                                            <div>
                                                <div className="font-bold text-lg">
                                                    {COLUMN_LABELS[filter.column_name as keyof typeof COLUMN_LABELS] || filter.column_name}
                                                    <span className="text-blue-400 mx-2">
                                                        {FILTER_TYPE_LABELS[filter.filter_type] || filter.filter_type}
                                                    </span>
                                                    {filter.column_value}
                                                </div>
                                                <div className="text-xs text-gray-400 mt-1">
                                                    Type: {FILTER_TYPES.find(ft => ft.value === filter.filter_type)?.label || filter.filter_type}
                                                    {colorInfo && <> · Color: {colorInfo.label}</>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex gap-1 border-2 border-gray-600 rounded-2px p-1 bg-slate-900">
                                                <button
                                                    onClick={() => !filter.is_active && handleToggle(filter.id)}
                                                    className={`px-3 py-1 rounded-2px font-mono text-xs font-bold transition-colors ${filter.is_active
                                                        ? 'bg-blue-600 text-white'
                                                        : 'text-gray-400 hover:text-gray-100 hover:bg-slate-700'
                                                        }`}
                                                >
                                                    Active
                                                </button>
                                                <button
                                                    onClick={() => filter.is_active && handleToggle(filter.id)}
                                                    className={`px-3 py-1 rounded-2px font-mono text-xs font-bold transition-colors ${!filter.is_active
                                                        ? 'bg-blue-600 text-white'
                                                        : 'text-gray-400 hover:text-gray-100 hover:bg-slate-700'
                                                        }`}
                                                >
                                                    Inactive
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => handleDelete(filter.id)}
                                                className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded-2px border-2 border-red-800 text-sm"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            </main>
        </div>
    );
}
