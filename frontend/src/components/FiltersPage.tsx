import { useState, useEffect } from 'react';
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
    { value: 'yellow', label: 'Yellow', swatch: 'bg-yellow-200' },
    { value: 'red', label: 'Red', swatch: 'bg-red-200' },
    { value: 'green', label: 'Green', swatch: 'bg-green-200' },
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

const SYSTEM_COLOR_MAP: Record<string, string> = {
    yellow: 'border-yellow-600 bg-yellow-900/20',
    red: 'border-red-600 bg-red-900/20',
    green: 'border-green-600 bg-green-900/20',
};

interface FiltersPageProps {
    onBack: () => void;
}

export function FiltersPage({ onBack }: FiltersPageProps) {
    const [systemFilters, setSystemFilters] = useState<any[]>([]);
    const [filters, setFilters] = useState<any[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [newColumn, setNewColumn] = useState<string>(STAFF_COLUMNS[0]);
    const [newFilterType, setNewFilterType] = useState('equals');
    const [newValues, setNewValues] = useState<string[]>(['']);
    const [newColor, setNewColor] = useState(ROW_COLORS[0].value);
    const [newHighlightType, setNewHighlightType] = useState('row');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadFilters();
    }, []);

    const loadFilters = async () => {
        try {
            const userEmail = localStorage.getItem('userEmail') || 'demo@staffing.com';
            const res = await filtersApi.getAll(userEmail);
            setSystemFilters(res.data.filter((f: any) => f.is_system));
            setFilters(res.data.filter((f: any) => !f.is_system));
        } catch (err) {
            console.error('Failed to load filters:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setIsCreating(false);
        setEditingId(null);
        setNewColumn(STAFF_COLUMNS[0]);
        setNewFilterType('equals');
        setNewValues(['']);
        setNewColor(ROW_COLORS[0].value);
        setNewHighlightType('row');
    };

    const handleEdit = (filter: any) => {
        setEditingId(filter.id);
        setIsCreating(true);
        setNewColumn(filter.column_name);
        setNewFilterType(filter.filter_type);
        // Parse JSON array from column_value
        let values: string[];
        try {
            values = JSON.parse(filter.column_value);
            if (!Array.isArray(values)) values = [filter.column_value];
        } catch {
            values = [filter.column_value];
        }
        setNewValues(values.length > 0 ? values : ['']);
        setNewColor(filter.row_color || ROW_COLORS[0].value);
        setNewHighlightType(filter.highlight_type || 'row');
    };

    const handleSave = async () => {
        const trimmedValues = newValues.map(v => v.trim()).filter(v => v !== '');
        if (trimmedValues.length === 0) {
            alert('At least one value is required');
            return;
        }

        try {
            if (editingId && editingId > 0) {
                await filtersApi.update(editingId, {
                    column_name: newColumn,
                    column_value: trimmedValues,
                    filter_type: newFilterType,
                    row_color: newColor,
                    highlight_type: newHighlightType,
                });
            } else {
                await filtersApi.create(newColumn, trimmedValues, newFilterType, newColor, newHighlightType);
            }
            loadFilters();
            resetForm();
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
                {/* Default Filters */}
                <section className="mb-8">
                    <h2 className="text-xl font-bold mb-4 text-blue-400">Default Filters</h2>
                    <div className="grid gap-4">
                        {systemFilters.map((sf) => {
                            const colorInfo = ROW_COLORS.find(c => c.value === sf.row_color);
                            return (
                                <div
                                    key={sf.id}
                                    className={`border-2 rounded-2px p-4 ${SYSTEM_COLOR_MAP[sf.row_color] || 'border-gray-600 bg-gray-900/20'}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="font-bold text-lg">
                                                {COLUMN_LABELS[sf.column_name as keyof typeof COLUMN_LABELS] || sf.column_name}
                                                <span className="mx-2">{FILTER_TYPE_LABELS[sf.filter_type] || '='}</span>
                                                {(() => { try { const v = JSON.parse(sf.column_value); return Array.isArray(v) ? v.join(' / ') : sf.column_value; } catch { return sf.column_value; } })()}
                                            </div>
                                            <div className="text-xs text-gray-400 mt-1">
                                                Column: {COLUMN_LABELS[sf.column_name as keyof typeof COLUMN_LABELS] || sf.column_name}
                                                {' · '}Type: {FILTER_TYPES.find(ft => ft.value === sf.filter_type)?.label}
                                                {' · '}Value: {(() => { try { const v = JSON.parse(sf.column_value); return Array.isArray(v) ? v.join(', ') : sf.column_value; } catch { return sf.column_value; } })()}
                                                {colorInfo && <> · Color: {colorInfo.label}</>}
                                                {' · '}Highlight: {sf.highlight_type === 'cell' ? 'Cell' : 'Row'}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-500 border border-gray-700 px-2 py-1 rounded-2px">
                                                System
                                            </span>
                                            <button
                                                onClick={() => handleEdit(sf)}
                                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded-2px text-sm border-2 border-blue-800"
                                            >
                                                Edit
                                            </button>
                                        </div>
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
                            <h3 className="font-bold text-lg mb-4 text-yellow-100">{editingId ? 'Edit Filter' : 'Create New Filter'}</h3>

                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
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
                                    <label className="block text-sm font-bold mb-2">Value(s)</label>
                                    <div className="space-y-2">
                                        {newValues.map((val, idx) => (
                                            <div key={idx} className="flex gap-1">
                                                <input
                                                    type="text"
                                                    value={val}
                                                    onChange={(e) => {
                                                        const updated = [...newValues];
                                                        updated[idx] = e.target.value;
                                                        setNewValues(updated);
                                                    }}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                                                    placeholder="Enter value..."
                                                    className="flex-1 px-3 py-2 border-2 border-gray-600 rounded-2px bg-slate-800 text-slate-100 text-sm placeholder-gray-500"
                                                />
                                                {newValues.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setNewValues(newValues.filter((_, i) => i !== idx))}
                                                        className="px-2 text-red-400 hover:text-red-300 font-bold"
                                                        title="Remove value"
                                                    >
                                                        ×
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => setNewValues([...newValues, ''])}
                                            className="text-xs text-blue-400 hover:text-blue-300 font-bold"
                                        >
                                            + Add Value
                                        </button>
                                    </div>
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

                                <div>
                                    <label className="block text-sm font-bold mb-2">Highlight</label>
                                    <div className="flex gap-1 border-2 border-gray-600 rounded-2px p-1 bg-slate-800 h-[38px]">
                                        <button
                                            type="button"
                                            onClick={() => setNewHighlightType('row')}
                                            className={`flex-1 px-3 py-1 rounded-2px font-mono text-xs font-bold transition-colors ${newHighlightType === 'row'
                                                ? 'bg-blue-600 text-white'
                                                : 'text-gray-400 hover:text-gray-100 hover:bg-slate-700'
                                                }`}
                                        >
                                            Row
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setNewHighlightType('cell')}
                                            className={`flex-1 px-3 py-1 rounded-2px font-mono text-xs font-bold transition-colors ${newHighlightType === 'cell'
                                                ? 'bg-blue-600 text-white'
                                                : 'text-gray-400 hover:text-gray-100 hover:bg-slate-700'
                                                }`}
                                        >
                                            Cell
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={handleSave}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-2px border-2 border-green-800"
                                >
                                    {editingId ? 'Update Filter' : 'Save Filter'}
                                </button>
                                <button
                                    onClick={resetForm}
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
                                                    {(() => { try { const v = JSON.parse(filter.column_value); return Array.isArray(v) ? v.join(' / ') : filter.column_value; } catch { return filter.column_value; } })()}
                                                </div>
                                                <div className="text-xs text-gray-400 mt-1">
                                                    Type: {FILTER_TYPES.find(ft => ft.value === filter.filter_type)?.label || filter.filter_type}
                                                    {colorInfo && <> · Color: {colorInfo.label}</>}
                                                    {' · '}Highlight: {filter.highlight_type === 'cell' ? 'Cell' : 'Row'}
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
                                                onClick={() => handleEdit(filter)}
                                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded-2px border-2 border-blue-800 text-sm"
                                            >
                                                Edit
                                            </button>
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
