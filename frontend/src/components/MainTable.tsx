import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, Settings2, Sun, Moon, Plus, X, Check } from 'lucide-react';
import { staffApi, viewsApi, filtersApi } from '../api';
import { STAFF_COLUMNS, EDITABLE_FIELDS, StaffRecord, COLUMN_LABELS } from '../constants';
import { getRowColorClass, getCellColorClass } from '../utils';
import { EditFlyout } from './EditFlyout';
import { ImportModal } from './ImportModal';

interface FilterChip {
    id?: number;  // set for DB-persisted filters, absent for legend toggles
    column: string;
    value: string;
}

// ── Filter Builder Modal ──────────────────────────────────────────────────────
interface FilterBuilderProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (filter: FilterChip) => void;
    isDark: boolean;
}

function FilterBuilder({ isOpen, onClose, onSave, isDark }: FilterBuilderProps) {
    const [column, setColumn] = useState(STAFF_COLUMNS[0]);
    const [value, setValue] = useState('');

    if (!isOpen) return null;

    const handleSave = () => {
        if (!value.trim()) return;
        onSave({ column, value: value.trim() });
        setValue('');
        setColumn(STAFF_COLUMNS[0]);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className={`w-96 rounded-2px border-2 p-6 font-mono shadow-xl ${isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold">Add Filter</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-200"><X size={18} /></button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold mb-1 text-gray-400 uppercase">Column</label>
                        <select
                            value={column}
                            onChange={(e) => setColumn(e.target.value)}
                            className={`w-full px-3 py-2 border-2 rounded-2px text-sm focus:outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                        >
                            {STAFF_COLUMNS.map((col) => (
                                <option key={col} value={col}>
                                    {COLUMN_LABELS[col as keyof typeof COLUMN_LABELS] || col}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold mb-1 text-gray-400 uppercase">Value</label>
                        <input
                            type="text"
                            placeholder="e.g. T, 2026-06-30, ..."
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                            className={`w-full px-3 py-2 border-2 rounded-2px text-sm focus:outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
                        />
                    </div>

                    <div className="flex gap-2 justify-end pt-2">
                        <button onClick={onClose} className={`px-4 py-2 text-sm border-2 rounded-2px font-bold ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-600 hover:bg-gray-100'}`}>
                            Cancel
                        </button>
                        <button onClick={handleSave} disabled={!value.trim()} className="px-4 py-2 text-sm border-2 rounded-2px font-bold bg-blue-600 border-blue-600 text-white hover:bg-blue-500 disabled:opacity-40">
                            Apply Filter
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── List Table (inline editing) ──────────────────────────────────────────────
interface ListTableProps {
    records: StaffRecord[];
    visibleColumns: string[];
    rowEdits: Record<number, Record<string, string>>;
    onCellChange: (recordId: number, field: string, value: string) => void;
    onSaveRow: (recordId: number) => void;
    onCancelRow: (recordId: number) => void;
}

function ListTable({ records, visibleColumns, rowEdits, onCellChange, onSaveRow, onCancelRow }: ListTableProps) {
    const [activeRowId, setActiveRowId] = React.useState<number | null>(null);

    return (
        <div className="w-full">
            <table className="w-full font-mono border-collapse">
                <thead className="bg-gray-900 text-white sticky top-0 z-10">
                    <tr className="border-b-2 border-gray-800">
                        <th className="border-r-2 border-gray-800 px-2 py-2 text-center text-xs font-bold w-16 min-w-16">
                            ✓&nbsp;/&nbsp;✗
                        </th>
                        <th className="border-r-2 border-gray-800 px-3 py-2 text-left text-xs font-bold w-12 min-w-12">
                            #
                        </th>
                        {visibleColumns.map((col) => (
                            <th
                                key={col}
                                className="border-r-2 border-gray-800 px-3 py-2 text-left text-xs font-bold whitespace-nowrap min-w-40"
                            >
                                {COLUMN_LABELS[col as keyof typeof COLUMN_LABELS] || col}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {records.map((record, idx) => {
                        const edits = rowEdits[record.id] || {};
                        const isDirty = Object.keys(edits).length > 0;
                        const isActive = activeRowId === record.id;
                        return (
                            <tr
                                key={record.id}
                                onClick={() => setActiveRowId(record.id)}
                                className={`${getRowColorClass(record)} border-b-2 border-gray-300 cursor-pointer ${isActive ? 'outline outline-2 outline-blue-400 outline-offset-[-2px]' : ''}`}
                            >
                                <td className="border-r-2 border-gray-800 px-2 py-1 w-16 min-w-16" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center justify-center gap-1">
                                        <button
                                            onClick={() => { onSaveRow(record.id); setActiveRowId(null); }}
                                            disabled={!isDirty}
                                            title="Save changes"
                                            className={`p-1 rounded-2px transition-colors ${isDirty
                                                ? 'text-green-600 hover:bg-green-100 cursor-pointer'
                                                : 'text-gray-300 cursor-default'
                                                }`}
                                        >
                                            <Check size={13} strokeWidth={2.5} />
                                        </button>
                                        <button
                                            onClick={() => { onCancelRow(record.id); setActiveRowId(null); }}
                                            disabled={!isActive && !isDirty}
                                            title="Cancel / deselect"
                                            className={`p-1 rounded-2px transition-colors ${(isActive || isDirty)
                                                ? 'text-red-500 hover:bg-red-100 cursor-pointer'
                                                : 'text-gray-300 cursor-default'
                                                }`}
                                        >
                                            <X size={13} strokeWidth={2.5} />
                                        </button>
                                    </div>
                                </td>
                                <td className={`border-r-2 border-gray-800 px-3 text-xs text-gray-900 font-bold w-12 min-w-12 ${idx === 0 ? 'pt-3 pb-1' : 'py-1'}`}>
                                    {idx + 1}
                                </td>
                                {visibleColumns.map((col) => {
                                    const isEditable = isActive && (EDITABLE_FIELDS as readonly string[]).includes(col);
                                    const cellValue = edits[col] !== undefined ? edits[col] : (record[col] ?? '');
                                    return (
                                        <td
                                            key={`${record.id}-${col}`}
                                            className={`border-r-2 border-gray-800 text-xs text-gray-900 min-w-40 ${idx === 0 ? 'pt-3 pb-1' : 'py-1'} ${getCellColorClass(col, record)}`}
                                        >
                                            {isEditable ? (
                                                <input
                                                    type="text"
                                                    value={cellValue}
                                                    onClick={(e) => e.stopPropagation()}
                                                    onChange={(e) => onCellChange(record.id, col, e.target.value)}
                                                    className="w-full bg-transparent border-b border-blue-400 focus:outline-none focus:border-blue-600 font-mono text-xs text-gray-900 px-3 py-0"
                                                />
                                            ) : (
                                                <span className="px-3 inline-block whitespace-nowrap overflow-hidden text-ellipsis">{record[col] || '—'}</span>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

// ── Grid Table (read-only click-to-edit) ──────────────────────────────────────
interface DataTableProps {
    records: StaffRecord[];
    visibleColumns: string[];
    onRowClick: (record: StaffRecord) => void;
}

function DataTable({ records, visibleColumns, onRowClick }: DataTableProps) {
    return (
        <div className="w-full">
            <table className="w-full font-mono border-collapse">
                <thead className="bg-gray-900 text-white sticky top-0 z-10">
                    <tr className="border-b-2 border-gray-800">
                        <th className="border-r-2 border-gray-800 px-3 py-2 text-left text-xs font-bold w-12 min-w-12">
                            #
                        </th>
                        {visibleColumns.map((col) => (
                            <th
                                key={col}
                                className="border-r-2 border-gray-800 px-3 py-2 text-left text-xs font-bold whitespace-nowrap min-w-40"
                            >
                                {COLUMN_LABELS[col as keyof typeof COLUMN_LABELS] || col}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {records.map((record, idx) => (
                        <tr
                            key={record.id}
                            onClick={() => onRowClick(record)}
                            className={`${getRowColorClass(
                                record
                            )} border-b-2 border-gray-300 cursor-pointer transition-colors`}
                        >
                            <td className={`border-r-2 border-gray-800 px-3 text-xs text-gray-900 font-bold w-12 min-w-12 ${idx === 0 ? 'pt-3 pb-2' : 'py-2'}`}>
                                {idx + 1}
                            </td>
                            {visibleColumns.map((col) => (
                                <td
                                    key={`${record.id}-${col}`}
                                    className={`border-r-2 border-gray-800 px-3 text-xs text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis min-w-40 ${idx === 0 ? 'pt-3 pb-2' : 'py-2'} ${getCellColorClass(
                                        col,
                                        record
                                    )}`}
                                >
                                    {record[col] || '—'}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

interface MainTableProps {
    onNavigateToViews: () => void;
}

export function MainTable({ onNavigateToViews }: MainTableProps) {
    const [records, setRecords] = useState<StaffRecord[]>([]);
    const [allRecords, setAllRecords] = useState<StaffRecord[]>([]);
    const [selectedRecord, setSelectedRecord] = useState<StaffRecord | null>(null);
    const [isFlyoutOpen, setIsFlyoutOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentView, setCurrentView] = useState('All Column View');
    const [views, setViews] = useState<any[]>([]);
    const [visibleColumns, setVisibleColumns] = useState<string[]>(STAFF_COLUMNS);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [activeFilters, setActiveFilters] = useState<FilterChip[]>([]);
    const [isFilterBuilderOpen, setIsFilterBuilderOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [rowEdits, setRowEdits] = useState<Record<number, Record<string, string>>>({});
    const [theme, setTheme] = useState<'dark' | 'light'>(() => {
        const saved = localStorage.getItem('mainUiTheme');
        return saved === 'light' ? 'light' : 'dark';
    });
    const isDark = theme === 'dark';

    useEffect(() => {
        localStorage.setItem('mainUiTheme', theme);
    }, [theme]);

    useEffect(() => {
        loadRecords();
        loadViews();
        loadSavedFilters();
    }, []);

    useEffect(() => {
        let filtered = allRecords;

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(
                (record) =>
                    record.employee_name?.toLowerCase().includes(term) ||
                    record.position_name?.toLowerCase().includes(term) ||
                    record.pos_no?.toLowerCase().includes(term) ||
                    record.emp_no?.toLowerCase().includes(term) ||
                    record.last_person_name?.toLowerCase().includes(term) ||
                    record.classroom_assign?.toLowerCase().includes(term) ||
                    record.classroom_teaching_assignment?.toLowerCase().includes(term)
            );
        }

        for (const f of activeFilters) {
            filtered = filtered.filter(
                (record) => record[f.column]?.toLowerCase() === f.value.toLowerCase()
            );
        }

        setRecords(filtered);
    }, [searchTerm, activeFilters, allRecords]);

    const loadRecords = async () => {
        try {
            const res = await staffApi.getAll();
            setAllRecords(res.data);
            setRecords(res.data);
        } catch (err) {
            console.error('Failed to load records:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const loadViews = async () => {
        try {
            const userEmail = localStorage.getItem('userEmail') || 'demo@staffing.com';
            const res = await viewsApi.getAll(userEmail);
            setViews(res.data);
        } catch (err) {
            console.error('Failed to load views:', err);
        }
    };

    const loadSavedFilters = async () => {
        try {
            const userEmail = localStorage.getItem('userEmail') || 'demo@staffing.com';
            const res = await filtersApi.getAll(userEmail);
            const dbFilters: FilterChip[] = res.data.map((f: any) => ({
                id: f.id,
                column: f.column_name,
                value: f.column_value,
            }));
            setActiveFilters(dbFilters);
        } catch (err) {
            console.error('Failed to load saved filters:', err);
        }
    };

    const handleViewChange = (viewName: string) => {
        setCurrentView(viewName);
        const view = views.find((v) => v.name === viewName);
        if (view) {
            setVisibleColumns(view.column_keys);
        }
    };

    const handleSave = () => {
        loadRecords();
    };

    const toggleLegendFilter = (column: string, value: string) => {
        setActiveFilters((prev) => {
            const exists = prev.some((f) => f.column === column && f.value === value);
            return exists
                ? prev.filter((f) => !(f.column === column && f.value === value))
                : [...prev, { column, value }];
        });
    };

    const isLegendActive = (column: string, value: string) =>
        activeFilters.some((f) => f.column === column && f.value === value);

    const addFilter = async (filter: FilterChip) => {
        // Don't duplicate
        if (activeFilters.some((f) => f.column === filter.column && f.value === filter.value)) return;
        try {
            const res = await filtersApi.create(filter.column, filter.value);
            setActiveFilters((prev) => [...prev, { id: res.data.id, column: filter.column, value: filter.value }]);
        } catch (err) {
            console.error('Failed to save filter:', err);
        }
    };

    const removeFilter = async (index: number) => {
        const filter = activeFilters[index];
        if (filter.id) {
            try {
                await filtersApi.delete(filter.id);
            } catch (err) {
                console.error('Failed to delete filter:', err);
            }
        }
        setActiveFilters((prev) => prev.filter((_, i) => i !== index));
    };

    const handleListCellChange = (recordId: number, field: string, value: string) => {
        setRowEdits((prev) => ({
            ...prev,
            [recordId]: {
                ...(prev[recordId] || {}),
                [field]: value,
            },
        }));
    };

    const handleListSave = async (recordId: number) => {
        const edits = rowEdits[recordId];
        if (!edits || Object.keys(edits).length === 0) return;
        const record = allRecords.find((r) => r.id === recordId);
        if (!record) return;
        try {
            const updated = { ...record, ...edits };
            await staffApi.update(recordId, updated);
            setRowEdits((prev) => {
                const next = { ...prev };
                delete next[recordId];
                return next;
            });
            loadRecords();
        } catch (err) {
            console.error('Failed to save row:', err);
            alert('Failed to save changes');
        }
    };

    const handleListCancel = (recordId: number) => {
        setRowEdits((prev) => {
            const next = { ...prev };
            delete next[recordId];
            return next;
        });
    };

    if (isLoading) {
        return (
            <div
                className={`flex items-center justify-center h-screen font-mono ${isDark ? 'bg-slate-900 text-gray-300' : 'bg-slate-100 text-gray-700'
                    }`}
            >
                Loading staff records...
            </div>
        );
    }

    return (
        <div className={`h-screen flex flex-col ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-100 text-slate-900'}`}>
            {/* Header */}
            <header
                className={`border-b-4 p-6 shrink-0 ${isDark
                    ? 'bg-gray-900 border-gray-800'
                    : 'bg-white border-gray-300'
                    }`}
            >
                <div className="max-w-full mx-auto">
                    <div className="flex justify-between items-start gap-4 mb-6">
                        <div>
                            <h1 className={`text-3xl font-bold font-mono ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                HR Staffing
                            </h1>
                            <p className={`text-sm font-mono mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                Carroll Middle School – 360 · As of 04/10/2026
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsImportOpen(true)}
                                aria-label="Import Excel data"
                                className={`font-mono font-bold h-10 w-10 flex items-center justify-center text-xl ${isDark ? 'text-orange-300 hover:text-orange-200' : 'text-orange-700 hover:text-orange-600'
                                    }`}
                                title="Import Excel data"
                            >
                                <Download size={20} strokeWidth={2.5} />
                            </button>
                            <button
                                onClick={loadRecords}
                                aria-label="Refresh data"
                                className={`font-mono font-bold h-10 w-10 flex items-center justify-center text-xl ${isDark ? 'text-blue-300 hover:text-blue-200' : 'text-blue-700 hover:text-blue-600'
                                    }`}
                                title="Refresh data"
                            >
                                <RefreshCw size={20} strokeWidth={2.5} />
                            </button>
                            <button
                                onClick={onNavigateToViews}
                                aria-label="Manage views"
                                className={`font-mono font-bold h-10 w-10 flex items-center justify-center text-xl ${isDark ? 'text-violet-300 hover:text-violet-200' : 'text-violet-700 hover:text-violet-600'
                                    }`}
                                title="Manage views"
                            >
                                <Settings2 size={20} strokeWidth={2.5} />
                            </button>
                            <button
                                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                                aria-label="Toggle light/dark surrounding UI"
                                className={`font-mono font-bold h-10 w-10 flex items-center justify-center text-xl ${isDark
                                    ? 'text-yellow-300 hover:text-yellow-200'
                                    : 'text-slate-700 hover:text-slate-900'
                                    }`}
                                title="Toggle light/dark surrounding UI"
                            >
                                {isDark ? (
                                    <Sun size={20} strokeWidth={2.5} />
                                ) : (
                                    <Moon size={20} strokeWidth={2.5} />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex gap-4 mb-4 flex-wrap">
                        {/* Search */}
                        <div className="flex-1 min-w-32">
                            <input
                                type="text"
                                placeholder="Search by name, position, pos no, emp no..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className={`w-full px-3 py-2 border-2 rounded-2px font-mono text-sm focus:outline-none focus:border-blue-500 ${isDark
                                    ? 'border-gray-600 bg-slate-800 text-slate-100 placeholder-gray-500'
                                    : 'border-gray-300 bg-white text-slate-900 placeholder-gray-400'
                                    }`}
                            />
                        </div>

                        {/* View Selector – pill buttons */}
                        <div className={`flex flex-wrap gap-1 border-2 rounded-2px p-1 ${isDark ? 'border-gray-600 bg-slate-800' : 'border-gray-300 bg-gray-100'}`}>
                            {views.map((view) => (
                                <button
                                    key={view.id}
                                    onClick={() => handleViewChange(view.name)}
                                    className={`px-3 py-1 rounded-2px font-mono text-xs font-bold transition-colors whitespace-nowrap ${currentView === view.name
                                        ? 'bg-blue-600 text-white'
                                        : isDark
                                            ? 'text-gray-400 hover:text-gray-100 hover:bg-slate-700'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                                        }`}
                                >
                                    {view.name}
                                </button>
                            ))}
                        </div>

                        {/* Inline / Panel toggle – pill buttons */}
                        <div className={`flex gap-1 border-2 rounded-2px p-1 ${isDark ? 'border-gray-600 bg-slate-800' : 'border-gray-300 bg-gray-100'}`}>
                            <button
                                onClick={() => setViewMode('list')}
                                title="Edit directly in the table"
                                className={`px-3 py-1 rounded-2px font-mono text-xs font-bold transition-colors ${viewMode === 'list'
                                    ? 'bg-blue-600 text-white'
                                    : isDark
                                        ? 'text-gray-400 hover:text-gray-100 hover:bg-slate-700'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                                    }`}
                            >
                                Inline
                            </button>
                            <button
                                onClick={() => setViewMode('grid')}
                                title="Edit via side panel"
                                className={`px-3 py-1 rounded-2px font-mono text-xs font-bold transition-colors ${viewMode === 'grid'
                                    ? 'bg-blue-600 text-white'
                                    : isDark
                                        ? 'text-gray-400 hover:text-gray-100 hover:bg-slate-700'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                                    }`}
                            >
                                Panel
                            </button>
                        </div>

                        {/* Record Count */}
                        <div
                            className={`border-2 rounded-2px px-3 py-2 font-mono text-sm ${isDark
                                ? 'bg-gray-800 border-gray-600'
                                : 'bg-white border-gray-300'
                                }`}
                        >
                            <span className="font-bold text-blue-400">{records.length}</span>
                            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}> records</span>
                        </div>
                    </div>

                    {/* Legend chips + active filters + add button */}
                    <div className="flex flex-wrap gap-2 items-center">
                        {/* Fixed legend chips (clickable toggles) */}
                        <button
                            onClick={() => toggleLegendFilter('contract', 'T')}
                            className={`flex items-center gap-2 text-xs font-mono px-2 py-1 border-2 rounded-2px transition-colors ${isLegendActive('contract', 'T')
                                ? 'bg-yellow-300 border-yellow-500 text-yellow-900 font-bold'
                                : isDark ? 'border-yellow-600 text-gray-300 hover:bg-yellow-900/30' : 'border-yellow-400 text-gray-700 hover:bg-yellow-50'}`}
                        >
                            <div className="w-3 h-3 bg-yellow-100 border border-yellow-400 rounded-2px" />
                            Contract = T/TR
                        </button>
                        <button
                            onClick={() => toggleLegendFilter('pos_end', '2026-06-30')}
                            className={`flex items-center gap-2 text-xs font-mono px-2 py-1 border-2 rounded-2px transition-colors ${isLegendActive('pos_end', '2026-06-30')
                                ? 'bg-red-300 border-red-500 text-red-900 font-bold'
                                : isDark ? 'border-red-600 text-gray-300 hover:bg-red-900/30' : 'border-red-400 text-gray-700 hover:bg-red-50'}`}
                        >
                            <div className="w-3 h-3 bg-red-100 border border-red-400 rounded-2px" />
                            Pos End = 2026-06-30
                        </button>
                        <button
                            onClick={() => toggleLegendFilter('pos_start', '2026-07-01')}
                            className={`flex items-center gap-2 text-xs font-mono px-2 py-1 border-2 rounded-2px transition-colors ${isLegendActive('pos_start', '2026-07-01')
                                ? 'bg-green-300 border-green-500 text-green-900 font-bold'
                                : isDark ? 'border-green-600 text-gray-300 hover:bg-green-900/30' : 'border-green-400 text-gray-700 hover:bg-green-50'}`}
                        >
                            <div className="w-3 h-3 bg-green-100 border border-green-400 rounded-2px" />
                            Pos Start = 2026-07-01
                        </button>

                        {/* Divider if there are custom active filters */}
                        {activeFilters.filter(f => !(
                            (f.column === 'contract' && f.value === 'T') ||
                            (f.column === 'pos_end' && f.value === '2026-06-30') ||
                            (f.column === 'pos_start' && f.value === '2026-07-01')
                        )).length > 0 && (
                                <span className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-300'}`}>|</span>
                            )}

                        {/* Custom filter chips */}
                        {activeFilters
                            .filter(f => !(
                                (f.column === 'contract' && f.value === 'T') ||
                                (f.column === 'pos_end' && f.value === '2026-06-30') ||
                                (f.column === 'pos_start' && f.value === '2026-07-01')
                            ))
                            .map((f, i) => (
                                <span
                                    key={i}
                                    className={`flex items-center gap-1 text-xs font-mono px-2 py-1 border-2 rounded-2px font-bold ${isDark ? 'bg-blue-900/50 border-blue-600 text-blue-200' : 'bg-blue-50 border-blue-400 text-blue-800'}`}
                                >
                                    {COLUMN_LABELS[f.column as keyof typeof COLUMN_LABELS] || f.column} = {f.value}
                                    <button
                                        onClick={() => removeFilter(activeFilters.indexOf(f))}
                                        className="ml-1 opacity-60 hover:opacity-100"
                                    >
                                        <X size={10} />
                                    </button>
                                </span>
                            ))}

                        {/* Add filter button */}
                        <button
                            onClick={() => setIsFilterBuilderOpen(true)}
                            title="Add filter"
                            className={`flex items-center justify-center w-6 h-6 border-2 rounded-2px font-bold transition-colors ${isDark ? 'border-gray-600 text-gray-400 hover:border-blue-500 hover:text-blue-400' : 'border-gray-400 text-gray-500 hover:border-blue-500 hover:text-blue-600'}`}
                        >
                            <Plus size={12} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Table */}
            <main className="flex-1 flex flex-col min-h-0 px-6 pb-6 pt-0">
                <div className="flex-1 min-h-0 overflow-auto bg-gray-100 rounded-2px border-2 border-gray-800 shadow-lg">
                    {viewMode === 'list' ? (
                        <ListTable
                            records={records}
                            visibleColumns={visibleColumns}
                            rowEdits={rowEdits}
                            onCellChange={handleListCellChange}
                            onSaveRow={handleListSave}
                            onCancelRow={handleListCancel}
                        />
                    ) : (
                        <DataTable
                            records={records}
                            visibleColumns={visibleColumns}
                            onRowClick={(record) => {
                                setSelectedRecord(record);
                                setIsFlyoutOpen(true);
                            }}
                        />
                    )}
                </div>
            </main>

            {/* Edit Flyout */}
            <EditFlyout
                record={selectedRecord}
                isOpen={isFlyoutOpen}
                onClose={() => setIsFlyoutOpen(false)}
                onSave={handleSave}
            />

            {/* Import Modal */}
            <ImportModal
                isOpen={isImportOpen}
                onClose={() => setIsImportOpen(false)}
                onImportSuccess={loadRecords}
            />

            {/* Filter Builder Modal */}
            <FilterBuilder
                isOpen={isFilterBuilderOpen}
                onClose={() => setIsFilterBuilderOpen(false)}
                onSave={addFilter}
                isDark={isDark}
            />
        </div>
    );
}
