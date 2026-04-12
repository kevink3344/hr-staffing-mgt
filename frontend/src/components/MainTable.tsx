import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, Settings2, Sun, Moon, Plus, X, Check, Pin } from 'lucide-react';
import { staffApi, viewsApi, filtersApi, pinsApi } from '../api';
import { STAFF_COLUMNS, EDITABLE_FIELDS, StaffRecord, COLUMN_LABELS } from '../constants';
import { getRowColorClass, getCellColorClass } from '../utils';
import { EditFlyout } from './EditFlyout';
import { ImportModal } from './ImportModal';

interface FilterChip {
    id?: number;  // set for DB-persisted filters, absent for legend toggles
    column: string;
    filter_type: string;
    value: string;
    color?: string;
}

// ── List Table (inline editing) ──────────────────────────────────────────────
interface ListTableProps {
    records: StaffRecord[];
    visibleColumns: string[];
    rowEdits: Record<number, Record<string, string>>;
    onCellChange: (recordId: number, field: string, value: string) => void;
    onSaveRow: (recordId: number) => void;
    onCancelRow: (recordId: number) => void;
    pinnedIds: Set<number>;
    onTogglePin: (recordId: number) => void;
    activeFilters: FilterChip[];
}

function ListTable({ records, visibleColumns, rowEdits, onCellChange, onSaveRow, onCancelRow, pinnedIds, onTogglePin, activeFilters }: ListTableProps) {
    const [activeRowId, setActiveRowId] = React.useState<number | null>(null);

    return (
        <div className="w-full">
            <table className="w-full font-mono border-collapse">
                <thead className="bg-gray-900 text-white sticky top-0 z-10">
                    <tr className="border-b-2 border-gray-800">
                        <th className="border-r-2 border-gray-800 px-2 py-2 text-center text-xs font-bold w-10 min-w-10">
                            <Pin size={12} />
                        </th>
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
                                className={`${getRowColorClass(record, activeFilters)} border-b-2 border-gray-300 cursor-pointer ${isActive ? 'outline outline-2 outline-blue-400 outline-offset-[-2px]' : ''}`}
                            >
                                <td className="border-r-2 border-gray-800 px-2 py-1 w-10 min-w-10 text-center" onClick={(e) => e.stopPropagation()}>
                                    <button
                                        onClick={() => onTogglePin(record.id)}
                                        title={pinnedIds.has(record.id) ? 'Unpin' : 'Pin'}
                                        className={`p-1 rounded-2px transition-colors ${pinnedIds.has(record.id) ? 'text-amber-500' : 'text-gray-300 hover:text-gray-500'}`}
                                    >
                                        <Pin size={12} strokeWidth={2.5} fill={pinnedIds.has(record.id) ? 'currentColor' : 'none'} />
                                    </button>
                                </td>
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
    pinnedIds: Set<number>;
    onTogglePin: (recordId: number) => void;
    activeFilters: FilterChip[];
}

function DataTable({ records, visibleColumns, onRowClick, pinnedIds, onTogglePin, activeFilters }: DataTableProps) {
    return (
        <div className="w-full">
            <table className="w-full font-mono border-collapse">
                <thead className="bg-gray-900 text-white sticky top-0 z-10">
                    <tr className="border-b-2 border-gray-800">
                        <th className="border-r-2 border-gray-800 px-2 py-2 text-center text-xs font-bold w-10 min-w-10">
                            <Pin size={12} />
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
                    {records.map((record, idx) => (
                        <tr
                            key={record.id}
                            onClick={() => onRowClick(record)}
                            className={`${getRowColorClass(
                                record, activeFilters
                            )} border-b-2 border-gray-300 cursor-pointer transition-colors`}
                        >
                            <td className={`border-r-2 border-gray-800 px-2 text-center w-10 min-w-10 ${idx === 0 ? 'pt-3 pb-2' : 'py-2'}`} onClick={(e) => e.stopPropagation()}>
                                <button
                                    onClick={() => onTogglePin(record.id)}
                                    title={pinnedIds.has(record.id) ? 'Unpin' : 'Pin'}
                                    className={`p-1 rounded-2px transition-colors ${pinnedIds.has(record.id) ? 'text-amber-500' : 'text-gray-300 hover:text-gray-500'}`}
                                >
                                    <Pin size={12} strokeWidth={2.5} fill={pinnedIds.has(record.id) ? 'currentColor' : 'none'} />
                                </button>
                            </td>
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
    onNavigateToFilters: () => void;
}

export function MainTable({ onNavigateToViews, onNavigateToFilters }: MainTableProps) {
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
    const [userFilters, setUserFilters] = useState<FilterChip[]>([]);
    const [activeUserFilterIds, setActiveUserFilterIds] = useState<Set<number>>(new Set());
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [rowEdits, setRowEdits] = useState<Record<number, Record<string, string>>>({});
    const topScrollRef = React.useRef<HTMLDivElement>(null);
    const topInnerRef = React.useRef<HTMLDivElement>(null);
    const tableContainerRef = React.useRef<HTMLDivElement>(null);
    const [pinnedIds, setPinnedIds] = useState<Set<number>>(new Set());
    const [showPinnedOnly, setShowPinnedOnly] = useState(false);
    const [theme, setTheme] = useState<'dark' | 'light'>(() => {
        const saved = localStorage.getItem('mainUiTheme');
        return saved === 'light' ? 'light' : 'dark';
    });
    const isDark = theme === 'dark';

    useEffect(() => {
        localStorage.setItem('mainUiTheme', theme);
    }, [theme]);

    // Sync the top scrollbar ghost width with actual table scroll width
    useEffect(() => {
        const container = tableContainerRef.current;
        const inner = topInnerRef.current;
        if (!container || !inner) return;
        const sync = () => { inner.style.width = container.scrollWidth + 'px'; };
        sync();
        const ro = new ResizeObserver(sync);
        ro.observe(container);
        return () => ro.disconnect();
    }, [visibleColumns, viewMode]);

    useEffect(() => {
        loadRecords();
        loadViews();
        loadSavedFilters();
        loadPins();
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

        const activeUserFilters = userFilters.filter(f => f.id && activeUserFilterIds.has(f.id));
        for (const f of [...activeFilters, ...activeUserFilters]) {
            const val = f.value.toLowerCase();
            switch (f.filter_type) {
                case 'contains':
                    filtered = filtered.filter((record) => record[f.column]?.toLowerCase().includes(val));
                    break;
                case 'does_not_equal':
                    filtered = filtered.filter((record) => record[f.column]?.toLowerCase() !== val);
                    break;
                case 'does_not_contain':
                    filtered = filtered.filter((record) => !record[f.column]?.toLowerCase().includes(val));
                    break;
                default: // equals
                    filtered = filtered.filter((record) => record[f.column]?.toLowerCase() === val);
                    break;
            }
        }

        if (showPinnedOnly) {
            filtered = filtered.filter((r) => pinnedIds.has(r.id));
        }

        setRecords(filtered);
    }, [searchTerm, activeFilters, userFilters, activeUserFilterIds, allRecords, showPinnedOnly, pinnedIds]);

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
            setViews(res.data.filter((v: any) => v.is_system || v.is_active !== 0));
        } catch (err) {
            console.error('Failed to load views:', err);
        }
    };

    const loadPins = async () => {
        try {
            const res = await pinsApi.getAll();
            setPinnedIds(new Set(res.data));
        } catch (err) {
            console.error('Failed to load pins:', err);
        }
    };

    const togglePin = async (recordId: number) => {
        try {
            if (pinnedIds.has(recordId)) {
                await pinsApi.unpin(recordId);
                setPinnedIds((prev) => { const next = new Set(prev); next.delete(recordId); return next; });
            } else {
                await pinsApi.pin(recordId);
                setPinnedIds((prev) => new Set(prev).add(recordId));
            }
        } catch (err) {
            console.error('Failed to toggle pin:', err);
        }
    };

    const loadSavedFilters = async () => {
        try {
            const userEmail = localStorage.getItem('userEmail') || 'demo@staffing.com';
            const res = await filtersApi.getAll(userEmail);
            const dbFilters: FilterChip[] = res.data
                .filter((f: any) => f.is_active !== 0)
                .map((f: any) => ({
                    id: f.id,
                    column: f.column_name,
                    filter_type: f.filter_type || 'equals',
                    value: f.column_value,
                    color: f.row_color || undefined,
                }));
            setUserFilters(dbFilters);
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
        // Legend filters are mutually exclusive — clicking an active one turns it off,
        // clicking an inactive one removes all other legend filters first.
        const legendFilters = [
            { column: 'contract', value: 'T' },
            { column: 'pos_end', value: '2026-06-30' },
            { column: 'pos_start', value: '2026-07-01' },
        ];
        setActiveFilters((prev) => {
            const isActive = prev.some((f) => f.column === column && f.value === value);
            const withoutLegend = prev.filter(
                (f) => !legendFilters.some((l) => l.column === f.column && l.value === f.value)
            );
            if (isActive) return withoutLegend;
            return [...withoutLegend, { column, value, filter_type: 'equals' }];
        });
        // Also deactivate any active user filters when toggling a legend filter
        setActiveUserFilterIds(new Set());
    };

    const toggleUserFilter = (filterId: number) => {
        // Mutually exclusive with legend filters and other user filters
        setActiveFilters((prev) => prev.filter(f => ![
            'contract', 'pos_end', 'pos_start'
        ].some(col => f.column === col)));
        setActiveUserFilterIds((prev) => {
            if (prev.has(filterId)) {
                const next = new Set(prev);
                next.delete(filterId);
                return next;
            }
            // Exclusive: only one user filter active at a time
            return new Set([filterId]);
        });
    };

    const isLegendActive = (column: string, value: string) =>
        activeFilters.some((f) => f.column === column && f.value === value);

    const addFilter = async (filter: FilterChip) => {
        // Don't duplicate
        if (activeFilters.some((f) => f.column === filter.column && f.value === filter.value)) return;
        try {
            const res = await filtersApi.create(filter.column, filter.value, filter.filter_type);
            setActiveFilters((prev) => [...prev, { id: res.data.id, column: filter.column, filter_type: filter.filter_type, value: filter.value }]);
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
                            <h1 className={`text-xl font-bold font-mono ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                Carroll Middle School – 360 · As of 04/10/2026
                            </h1>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowPinnedOnly(!showPinnedOnly)}
                                aria-label="Toggle pinned only"
                                className={`font-mono font-bold h-10 w-10 flex items-center justify-center text-xl relative ${showPinnedOnly
                                    ? 'text-amber-400'
                                    : isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                title={showPinnedOnly ? 'Show all records' : 'Show pinned only'}
                            >
                                <Pin size={20} strokeWidth={2.5} fill={showPinnedOnly ? 'currentColor' : 'none'} />
                                {pinnedIds.size > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                                        {pinnedIds.size}
                                    </span>
                                )}
                            </button>
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
                        {userFilters.length > 0 && (
                            <span className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-300'}`}>|</span>
                        )}

                        {/* Custom filter chips (user DB filters – clickable toggles) */}
                        {userFilters.map((f, i) => {
                            const isActive = f.id ? activeUserFilterIds.has(f.id) : false;
                            return (
                                <button
                                    key={`uf-${i}`}
                                    onClick={() => f.id && toggleUserFilter(f.id)}
                                    className={`flex items-center gap-1 text-xs font-mono px-2 py-1 border-2 rounded-2px transition-colors font-bold ${isActive
                                        ? 'bg-blue-400 border-blue-500 text-blue-900'
                                        : isDark ? 'border-blue-600 text-gray-300 hover:bg-blue-900/30' : 'border-blue-400 text-gray-700 hover:bg-blue-50'}`}
                                >
                                    {COLUMN_LABELS[f.column as keyof typeof COLUMN_LABELS] || f.column} {f.filter_type === 'contains' ? '⊃' : f.filter_type === 'does_not_equal' ? '≠' : f.filter_type === 'does_not_contain' ? '⊅' : '='} {f.value}
                                </button>
                            );
                        })}

                        {/* Add filter button */}
                        <button
                            onClick={onNavigateToFilters}
                            title="Manage filters"
                            className={`flex items-center justify-center w-6 h-6 border-2 rounded-2px font-bold transition-colors ${isDark ? 'border-gray-600 text-gray-400 hover:border-blue-500 hover:text-blue-400' : 'border-gray-400 text-gray-500 hover:border-blue-500 hover:text-blue-600'}`}
                        >
                            <Plus size={12} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Table */}
            <main className="flex-1 flex flex-col min-h-0 px-6 pb-6 pt-0">
                {/* Top scrollbar – synced with main container */}
                <div
                    ref={topScrollRef}
                    onScroll={() => {
                        if (tableContainerRef.current && topScrollRef.current) {
                            tableContainerRef.current.scrollLeft = topScrollRef.current.scrollLeft;
                        }
                    }}
                    className="overflow-x-auto bg-gray-100 rounded-t-2px border-2 border-b-0 border-gray-800 shrink-0"
                    style={{ height: '17px' }}
                >
                    <div ref={topInnerRef} style={{ height: '1px' }} />
                </div>
                <div
                    ref={tableContainerRef}
                    onScroll={() => {
                        if (topScrollRef.current && tableContainerRef.current) {
                            topScrollRef.current.scrollLeft = tableContainerRef.current.scrollLeft;
                        }
                    }}
                    className="flex-1 min-h-0 overflow-auto bg-gray-100 rounded-b-2px border-2 border-t-0 border-gray-800 shadow-lg"
                >
                    {viewMode === 'list' ? (
                        <ListTable
                            records={records}
                            visibleColumns={visibleColumns}
                            rowEdits={rowEdits}
                            onCellChange={handleListCellChange}
                            onSaveRow={handleListSave}
                            onCancelRow={handleListCancel}
                            pinnedIds={pinnedIds}
                            onTogglePin={togglePin}
                            activeFilters={[...activeFilters, ...userFilters]}
                        />
                    ) : (
                        <DataTable
                            records={records}
                            visibleColumns={visibleColumns}
                            onRowClick={(record) => {
                                setSelectedRecord(record);
                                setIsFlyoutOpen(true);
                            }}
                            pinnedIds={pinnedIds}
                            onTogglePin={togglePin}
                            activeFilters={[...activeFilters, ...userFilters]}
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
        </div>
    );
}
