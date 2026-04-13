import { useState, useEffect, useRef } from 'react';
import { Download, Settings, Settings2, Sun, Moon, Plus, X, Check, Pin, Clock, ArrowUp, Grip, User, Rows4 } from 'lucide-react';
import { staffApi, viewsApi, filtersApi, pinsApi, stickyColumnsApi, columnColorsApi } from '../api';
import { STAFF_COLUMNS, EDITABLE_FIELDS, StaffRecord, COLUMN_LABELS } from '../constants';
import { getRowColorClass, getCellColorClass, getRowBgClass, hasFilterColor } from '../utils';
import { EditFlyout } from './EditFlyout';
import { ImportModal } from './ImportModal';
import { ActivityFeed } from './ActivityFeed';

interface FilterChip {
    id?: number;  // set for DB-persisted filters, absent for legend toggles
    column: string;
    filter_type: string;
    value: string | string[];
    color?: string;
    highlight_type?: string;  // 'row' (default) or 'cell'
}

// ── Sticky column helper ──────────────────────────────────────────────────────
function getStickyEdges(col: string, visibleColumns: string[], stickyColumns: string[]) {
    const visibleSticky = visibleColumns.filter(c => stickyColumns.includes(c));
    const isFirst = visibleSticky[0] === col;
    const isLast = visibleSticky[visibleSticky.length - 1] === col;
    return { isFirst, isLast };
}

function buildStickyShadow(isFirst: boolean, isLast: boolean): string {
    const shadows: string[] = [];
    shadows.push('inset 0 2px 0 0 #93c5fd');   // top
    shadows.push('inset 0 -2px 0 0 #93c5fd');  // bottom
    if (isFirst) shadows.push('inset 2px 0 0 0 #93c5fd');  // left
    if (isLast) shadows.push('inset -2px 0 0 0 #93c5fd');  // right (inset)
    return shadows.join(', ');
}

function getStickyStyle(col: string, visibleColumns: string[], stickyColumns: string[], baseOffset: number, stickyWidths: Record<string, number> = {}): React.CSSProperties | undefined {
    if (!stickyColumns.includes(col)) return undefined;
    const w = stickyWidths[col] || 220;
    let left = baseOffset;
    for (const vc of visibleColumns) {
        if (vc === col) break;
        if (stickyColumns.includes(vc)) left += stickyWidths[vc] || 220;
    }
    const { isFirst, isLast } = getStickyEdges(col, visibleColumns, stickyColumns);
    return { position: 'sticky', left, zIndex: 5, minWidth: w, maxWidth: w, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', boxShadow: buildStickyShadow(isFirst, isLast) };
}

function getStickyHeaderStyle(col: string, visibleColumns: string[], stickyColumns: string[], baseOffset: number, stickyWidths: Record<string, number> = {}): React.CSSProperties | undefined {
    if (!stickyColumns.includes(col)) return undefined;
    const w = stickyWidths[col] || 220;
    let left = baseOffset;
    for (const vc of visibleColumns) {
        if (vc === col) break;
        if (stickyColumns.includes(vc)) left += stickyWidths[vc] || 220;
    }
    const { isFirst, isLast } = getStickyEdges(col, visibleColumns, stickyColumns);
    return { position: 'sticky', left, zIndex: 15, minWidth: w, maxWidth: w, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', boxShadow: buildStickyShadow(isFirst, isLast) };
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
    stickyColumns: string[];
    stickyWidths: Record<string, number>;
    columnColors: Record<string, string>;
    density: 'comfortable' | 'compact' | 'very-compact';
}

function ListTable({ records, visibleColumns, rowEdits, onCellChange, onSaveRow, onCancelRow, pinnedIds, onTogglePin, activeFilters, stickyColumns, stickyWidths, columnColors, density }: ListTableProps) {
    const [activeRowId, setActiveRowId] = useState<number | null>(null);
    const py = density === 'very-compact' ? 'py-0' : density === 'compact' ? 'py-0.5' : 'py-1';
    const pyH = density === 'very-compact' ? 'py-0.5' : density === 'compact' ? 'py-1' : 'py-2';
    const firstPy = density === 'very-compact' ? 'pt-0.5 pb-0' : density === 'compact' ? 'pt-1 pb-0.5' : 'pt-3 pb-1';

    return (
        <div className="w-full">
            <table className="w-full font-mono border-collapse">
                <thead className="bg-gray-900 text-white sticky top-0 z-10">
                    <tr className="border-b-2 border-gray-300">
                        <th className={`border-r-2 border-gray-300 px-2 ${pyH} text-center text-xs font-bold w-10 min-w-10`}>
                            <Pin size={12} />
                        </th>
                        <th className={`border-r-2 border-gray-300 px-2 ${pyH} text-center text-xs font-bold w-16 min-w-16`}>
                            ✓&nbsp;/&nbsp;✗
                        </th>
                        <th className={`border-r-2 border-gray-300 px-3 ${pyH} text-left text-xs font-bold w-12 min-w-12`}>
                            #
                        </th>
                        {visibleColumns.map((col) => (
                            <th
                                key={col}
                                className={`border-r-2 border-gray-300 px-3 ${pyH} text-left text-xs font-bold whitespace-nowrap min-w-40 ${stickyColumns.includes(col) ? 'bg-gray-900' : ''}`}
                                style={getStickyHeaderStyle(col, visibleColumns, stickyColumns, 152, stickyWidths)}
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
                                <td className={`border-r-2 border-gray-300 px-2 ${py} w-10 min-w-10 text-center`} onClick={(e) => e.stopPropagation()} style={columnColors['__pin__'] ? { backgroundColor: columnColors['__pin__'] } : undefined}>
                                    <button
                                        onClick={() => onTogglePin(record.id)}
                                        title={pinnedIds.has(record.id) ? 'Unpin' : 'Pin'}
                                        className={`p-1 rounded-2px transition-colors ${pinnedIds.has(record.id) ? 'text-red-900' : 'text-gray-300 hover:text-gray-500'}`}
                                    >
                                        <Pin size={12} strokeWidth={1.5} fill={pinnedIds.has(record.id) ? '#7f1d1d' : 'none'} />
                                    </button>
                                </td>
                                <td className={`border-r-2 border-gray-300 px-2 ${py} w-16 min-w-16`} onClick={(e) => e.stopPropagation()} style={columnColors['__edit__'] ? { backgroundColor: columnColors['__edit__'] } : undefined}>
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
                                <td className={`border-r-2 border-gray-300 px-3 text-xs text-gray-900 font-bold w-12 min-w-12 ${idx === 0 ? firstPy : py}`} style={columnColors['__row__'] ? { backgroundColor: columnColors['__row__'] } : undefined}>
                                    {idx + 1}
                                </td>
                                {visibleColumns.map((col) => {
                                    const isEditable = isActive && (EDITABLE_FIELDS as readonly string[]).includes(col);
                                    const cellValue = edits[col] !== undefined ? edits[col] : (record[col] ?? '');
                                    const stickyStyle = getStickyStyle(col, visibleColumns, stickyColumns, 152, stickyWidths);
                                    const colColor = columnColors[col] && !hasFilterColor(col, record, activeFilters) ? columnColors[col] : undefined;
                                    return (
                                        <td
                                            key={`${record.id}-${col}`}
                                            className={`border-r-2 border-gray-300 text-xs text-gray-900 min-w-40 ${idx === 0 ? firstPy : py} ${isEditable ? 'border-2 border-dashed border-blue-400 bg-blue-50' : ''} ${getCellColorClass(col, record, activeFilters)} ${stickyStyle ? `${getRowBgClass(record, activeFilters)}` : ''}`}
                                            style={{ ...stickyStyle, ...(colColor ? { backgroundColor: colColor } : {}) }}
                                        >
                                            {isEditable ? (
                                                <input
                                                    type="text"
                                                    value={cellValue}
                                                    onClick={(e) => e.stopPropagation()}
                                                    onChange={(e) => onCellChange(record.id, col, e.target.value)}
                                                    className="w-full bg-transparent focus:outline-none font-mono text-xs text-gray-900 px-3 py-0"
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
    stickyColumns: string[];
    stickyWidths: Record<string, number>;
    columnColors: Record<string, string>;
    density: 'comfortable' | 'compact' | 'very-compact';
}

function DataTable({ records, visibleColumns, onRowClick, pinnedIds, onTogglePin, activeFilters, stickyColumns, stickyWidths, columnColors, density }: DataTableProps) {
    const py = density === 'very-compact' ? 'py-0' : density === 'compact' ? 'py-0.5' : 'py-2';
    const pyH = density === 'very-compact' ? 'py-0.5' : density === 'compact' ? 'py-1' : 'py-2';
    const firstPy = density === 'very-compact' ? 'pt-0.5 pb-0' : density === 'compact' ? 'pt-1 pb-0.5' : 'pt-3 pb-2';

    return (
        <div className="w-full">
            <table className="w-full font-mono border-collapse">
                <thead className="bg-gray-900 text-white sticky top-0 z-10">
                    <tr className="border-b-2 border-gray-300">
                        <th className={`border-r-2 border-gray-300 px-2 ${pyH} text-center text-xs font-bold w-10 min-w-10`}>
                            <Pin size={12} />
                        </th>
                        <th className={`border-r-2 border-gray-300 px-3 ${pyH} text-left text-xs font-bold w-12 min-w-12`}>
                            #
                        </th>
                        {visibleColumns.map((col) => (
                            <th
                                key={col}
                                className={`border-r-2 border-gray-300 px-3 ${pyH} text-left text-xs font-bold whitespace-nowrap min-w-40 ${stickyColumns.includes(col) ? 'bg-gray-900' : ''}`}
                                style={getStickyHeaderStyle(col, visibleColumns, stickyColumns, 88, stickyWidths)}
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
                            title="Click to open details"
                            className={`${getRowColorClass(
                                record, activeFilters
                            )} border-b-2 border-gray-300 cursor-pointer transition-colors hover:outline hover:outline-2 hover:outline-blue-400 hover:outline-offset-[-2px]`}
                        >
                            <td className={`border-r-2 border-gray-300 px-2 text-center w-10 min-w-10 ${idx === 0 ? firstPy : py}`} onClick={(e) => e.stopPropagation()} style={columnColors['__pin__'] ? { backgroundColor: columnColors['__pin__'] } : undefined}>
                                <button
                                    onClick={() => onTogglePin(record.id)}
                                    title={pinnedIds.has(record.id) ? 'Unpin' : 'Pin'}
                                    className={`p-1 rounded-2px transition-colors ${pinnedIds.has(record.id) ? 'text-red-900' : 'text-gray-300 hover:text-gray-500'}`}
                                >
                                    <Pin size={12} strokeWidth={1.5} fill={pinnedIds.has(record.id) ? '#7f1d1d' : 'none'} />
                                </button>
                            </td>
                            <td className={`border-r-2 border-gray-300 px-3 text-xs text-gray-900 font-bold w-12 min-w-12 ${idx === 0 ? firstPy : py}`} style={columnColors['__row__'] ? { backgroundColor: columnColors['__row__'] } : undefined}>
                                {idx + 1}
                            </td>
                            {visibleColumns.map((col) => {
                                const stickyStyle = getStickyStyle(col, visibleColumns, stickyColumns, 88, stickyWidths);
                                const colColor = columnColors[col] && !hasFilterColor(col, record, activeFilters) ? columnColors[col] : undefined;
                                return (
                                    <td
                                        key={`${record.id}-${col}`}
                                        className={`border-r-2 border-gray-300 px-3 text-xs text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis min-w-40 ${idx === 0 ? firstPy : py} ${getCellColorClass(
                                            col,
                                            record,
                                            activeFilters
                                        )} ${stickyStyle ? `${getRowBgClass(record, activeFilters)}` : ''}`}
                                        style={{ ...stickyStyle, ...(colColor ? { backgroundColor: colColor } : {}) }}
                                    >
                                        {record[col] || '—'}
                                    </td>
                                );
                            })}
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
    onNavigateToSettings: () => void;
    onNavigateToQueue: () => void;
}

export function MainTable({ onNavigateToViews, onNavigateToFilters, onNavigateToSettings, onNavigateToQueue }: MainTableProps) {
    const [records, setRecords] = useState<StaffRecord[]>([]);
    const [allRecords, setAllRecords] = useState<StaffRecord[]>([]);
    const [selectedRecord, setSelectedRecord] = useState<StaffRecord | null>(null);
    const [isFlyoutOpen, setIsFlyoutOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const loggedInUser = localStorage.getItem('userEmail') || 'demo@staffing.com';
    const [searchTerm, setSearchTerm] = useState('');
    const [currentView, setCurrentView] = useState('All Column View');
    const [views, setViews] = useState<any[]>([]);
    const [visibleColumns, setVisibleColumns] = useState<string[]>([...STAFF_COLUMNS]);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [isActivityOpen, setIsActivityOpen] = useState(false);
    const [activeFilters, setActiveFilters] = useState<FilterChip[]>([]);
    const [userFilters, setUserFilters] = useState<FilterChip[]>([]);
    const [systemFilters, setSystemFilters] = useState<FilterChip[]>([]);
    const [activeUserFilterIds, setActiveUserFilterIds] = useState<Set<number>>(new Set());
    const [viewMode, setViewModeRaw] = useState<'list' | 'grid'>(() => {
        const saved = localStorage.getItem('viewMode');
        return saved === 'grid' ? 'grid' : 'list';
    });
    const setViewMode = (mode: 'list' | 'grid') => { localStorage.setItem('viewMode', mode); setViewModeRaw(mode); };
    const [rowEdits, setRowEdits] = useState<Record<number, Record<string, string>>>({});
    const topScrollRef = useRef<HTMLDivElement>(null);
    const topInnerRef = useRef<HTMLDivElement>(null);
    const tableContainerRef = useRef<HTMLDivElement>(null);
    const [pinnedIds, setPinnedIds] = useState<Set<number>>(new Set());
    const [showPinnedOnly, setShowPinnedOnly] = useState(false);
    const [stickyColumns, setStickyColumns] = useState<string[]>([]);
    const [stickyWidths, setStickyWidths] = useState<Record<string, number>>({});
    const [columnColors, setColumnColors] = useState<Record<string, string>>({});
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [theme, setTheme] = useState<'dark' | 'light'>(() => {
        const saved = localStorage.getItem('mainUiTheme');
        return saved === 'light' ? 'light' : 'dark';
    });
    const isDark = theme === 'dark';
    const [density, setDensity] = useState<'comfortable' | 'compact' | 'very-compact'>(() => {
        return (localStorage.getItem('mainUiDensity') as any) || 'compact';
    });
    const [showDensitySlider, setShowDensitySlider] = useState(false);

    useEffect(() => {
        localStorage.setItem('mainUiTheme', theme);
    }, [theme]);

    useEffect(() => {
        localStorage.setItem('mainUiDensity', density);
    }, [density]);

    // Sync the top scrollbar ghost width with actual table scroll width
    useEffect(() => {
        const container = tableContainerRef.current;
        const inner = topInnerRef.current;
        if (!container || !inner) return;
        let rafId = 0;
        const sync = () => {
            cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
                if (!container || !inner) return;
                const sw = container.scrollWidth;
                // Only shrink if there's truly no overflow; otherwise keep the larger value
                if (sw > container.clientWidth || !inner.style.width) {
                    inner.style.width = sw + 'px';
                }
            });
        };
        sync();
        const ro = new ResizeObserver(sync);
        ro.observe(container);
        // Observe the table element inside for row changes
        const table = container.querySelector('table');
        if (table) ro.observe(table);
        const mo = new MutationObserver(sync);
        mo.observe(container, { childList: true, subtree: true });
        // Poll briefly after mount to catch late layout
        const t1 = setTimeout(sync, 100);
        const t2 = setTimeout(sync, 500);
        return () => { cancelAnimationFrame(rafId); ro.disconnect(); mo.disconnect(); clearTimeout(t1); clearTimeout(t2); };
    }, [visibleColumns, viewMode, allRecords.length]);

    useEffect(() => {
        loadRecords();
        loadViews();
        loadSavedFilters();
        loadPins();
        loadStickyColumns();
        loadColumnColors();
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
            const values = Array.isArray(f.value) ? f.value : [f.value];
            switch (f.filter_type) {
                case 'contains':
                    filtered = filtered.filter((record) => values.some(v => record[f.column]?.toLowerCase().includes(v.toLowerCase())));
                    break;
                case 'does_not_equal':
                    filtered = filtered.filter((record) => values.every(v => record[f.column]?.toLowerCase() !== v.toLowerCase()));
                    break;
                case 'does_not_contain':
                    filtered = filtered.filter((record) => values.every(v => !record[f.column]?.toLowerCase().includes(v.toLowerCase())));
                    break;
                default: // equals
                    filtered = filtered.filter((record) => values.some(v => record[f.column]?.toLowerCase() === v.toLowerCase()));
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

    const loadStickyColumns = async () => {
        try {
            const res = await stickyColumnsApi.getAll();
            const active = res.data.filter((sc: any) => sc.is_active).map((sc: any) => sc.column_name);
            const widths: Record<string, number> = {};
            res.data.filter((sc: any) => sc.is_active).forEach((sc: any) => { widths[sc.column_name] = sc.column_width || 220; });
            setStickyColumns(active);
            setStickyWidths(widths);
        } catch (err) {
            console.error('Failed to load sticky columns:', err);
        }
    };

    const loadColumnColors = async () => {
        try {
            const res = await columnColorsApi.getAll();
            const colorMap: Record<string, string> = {};
            res.data.filter((cc: any) => cc.is_active).forEach((cc: any) => { colorMap[cc.column_name] = cc.color; });
            setColumnColors(colorMap);
        } catch (err) {
            console.error('Failed to load column colors:', err);
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
            const allFilters = res.data;
            const mapFilter = (f: any): FilterChip => {
                let parsedValue: string | string[];
                try {
                    parsedValue = JSON.parse(f.column_value);
                } catch {
                    parsedValue = [f.column_value];
                }
                return {
                    id: f.id,
                    column: f.column_name,
                    filter_type: f.filter_type || 'equals',
                    value: parsedValue,
                    color: f.row_color || undefined,
                    highlight_type: f.highlight_type || 'row',
                };
            };
            setSystemFilters(allFilters.filter((f: any) => f.is_system).map(mapFilter));
            const dbFilters: FilterChip[] = allFilters
                .filter((f: any) => !f.is_system && f.is_active !== 0)
                .map(mapFilter);
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

    const toggleLegendFilter = (sf: FilterChip) => {
        setActiveFilters((prev) => {
            const isActive = prev.some((f) => f.column === sf.column && JSON.stringify(f.value) === JSON.stringify(sf.value));
            const withoutLegend = prev.filter(
                (f) => !systemFilters.some((l) => l.column === f.column && JSON.stringify(l.value) === JSON.stringify(f.value))
            );
            if (isActive) return withoutLegend;
            return [...withoutLegend, { column: sf.column, value: sf.value, filter_type: sf.filter_type }];
        });
        setActiveUserFilterIds(new Set());
    };

    const toggleUserFilter = (filterId: number) => {
        setActiveFilters((prev) => prev.filter(f =>
            !systemFilters.some(sf => sf.column === f.column && JSON.stringify(sf.value) === JSON.stringify(f.value))
        ));
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

    const isLegendActive = (sf: FilterChip) =>
        activeFilters.some((f) => f.column === sf.column && JSON.stringify(f.value) === JSON.stringify(sf.value));

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
            {/* Left Slide-out Menu */}
            {isMenuOpen && (
                <>
                    <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsMenuOpen(false)} />
                    <div className={`fixed top-0 left-0 h-full w-full sm:w-56 z-50 border-r-4 flex flex-col ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'}`}>
                        <div className="flex items-center justify-between p-4 border-b-2 border-gray-600">
                            <span className="font-mono font-bold text-lg">Menu</span>
                            <button onClick={() => setIsMenuOpen(false)} className={`h-8 w-8 flex items-center justify-center rounded-2px ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>
                                <X size={20} strokeWidth={2.5} />
                            </button>
                        </div>
                        <nav className="flex flex-col p-2 gap-0.5">
                            <button
                                onClick={() => { setIsActivityOpen(true); setIsMenuOpen(false); }}
                                className={`flex items-center gap-2 px-3 py-2 rounded-2px font-mono font-bold text-sm text-left transition-colors ${isDark ? 'text-emerald-300 hover:bg-slate-800' : 'text-emerald-700 hover:bg-gray-100'}`}
                            >
                                <Clock size={18} strokeWidth={2.5} />
                                Activity Feed
                            </button>
                            <button
                                onClick={() => { onNavigateToViews(); setIsMenuOpen(false); }}
                                className={`flex items-center gap-2 px-3 py-2 rounded-2px font-mono font-bold text-sm text-left transition-colors ${isDark ? 'text-violet-300 hover:bg-slate-800' : 'text-violet-700 hover:bg-gray-100'}`}
                            >
                                <Settings2 size={18} strokeWidth={2.5} />
                                Manage Views
                            </button>
                            <button
                                onClick={() => { setIsImportOpen(true); setIsMenuOpen(false); }}
                                className={`flex items-center gap-2 px-3 py-2 rounded-2px font-mono font-bold text-sm text-left transition-colors ${isDark ? 'text-orange-300 hover:bg-slate-800' : 'text-orange-700 hover:bg-gray-100'}`}
                            >
                                <Download size={18} strokeWidth={2.5} />
                                Import Excel Data
                            </button>
                            <button
                                onClick={() => { onNavigateToSettings(); setIsMenuOpen(false); }}
                                className={`flex items-center gap-2 px-3 py-2 rounded-2px font-mono font-bold text-sm text-left transition-colors ${isDark ? 'text-blue-300 hover:bg-slate-800' : 'text-blue-700 hover:bg-gray-100'}`}
                            >
                                <Settings size={18} strokeWidth={2.5} />
                                Settings
                            </button>
                            <button
                                onClick={() => { onNavigateToQueue(); setIsMenuOpen(false); }}
                                className={`flex items-center gap-2 px-3 py-2 rounded-2px font-mono font-bold text-sm text-left transition-colors ${isDark ? 'text-cyan-300 hover:bg-slate-800' : 'text-cyan-700 hover:bg-gray-100'}`}
                            >
                                <Clock size={18} strokeWidth={2.5} />
                                Queue
                            </button>
                        </nav>
                    </div>
                </>
            )}

            {/* Header */}
            <header
                className={`border-b-4 p-3 sm:p-6 shrink-0 ${isDark
                    ? 'bg-gray-900 border-gray-800'
                    : 'bg-white border-gray-300'
                    }`}
            >
                <div className="max-w-full mx-auto">
                    <div className="flex justify-between items-start gap-2 sm:gap-4 mb-4 sm:mb-6">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            <button
                                onClick={() => setIsMenuOpen(true)}
                                aria-label="Open menu"
                                className={`h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-2px ${isDark ? 'text-gray-300 hover:text-white hover:bg-slate-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
                                title="Menu"
                            >
                                <Grip size={20} strokeWidth={2.5} />
                            </button>
                            <div className="min-w-0">
                                <h1 className={`text-base sm:text-xl font-bold font-mono truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    Carroll Middle School – 360
                                </h1>
                                <p className={`text-[10px] sm:text-xs font-mono mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Date tracked to 9/01/2026 as of 04/10/2026
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-1 sm:gap-2 items-center flex-shrink-0">
                            <button
                                onClick={() => setShowPinnedOnly(!showPinnedOnly)}
                                aria-label="Toggle pinned only"
                                className={`font-mono font-bold h-10 w-10 flex items-center justify-center text-xl relative ${showPinnedOnly
                                    ? 'text-red-800'
                                    : isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                title={showPinnedOnly ? 'Show all records' : 'Show pinned only'}
                            >
                                <Pin size={20} strokeWidth={2.5} fill={showPinnedOnly ? 'currentColor' : 'none'} />
                                {pinnedIds.size > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-800 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                                        {pinnedIds.size}
                                    </span>
                                )}
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
                            <div className="relative">
                                <button
                                    onClick={() => setShowDensitySlider(!showDensitySlider)}
                                    aria-label="Row density"
                                    className={`font-mono font-bold h-10 w-10 flex items-center justify-center text-xl ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                                    title="Row density"
                                >
                                    <Rows4 size={20} strokeWidth={2.5} />
                                </button>
                                {showDensitySlider && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setShowDensitySlider(false)} />
                                        <div className={`absolute right-0 top-full mt-1 z-50 rounded-2px border-2 shadow-lg p-3 ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-800'}`}>
                                            <div className="flex flex-col items-center gap-1" style={{ width: '36px', height: '100px' }}>
                                                {(['comfortable', 'compact', 'very-compact'] as const).map((d) => (
                                                    <button
                                                        key={d}
                                                        onClick={() => { setDensity(d); setShowDensitySlider(false); }}
                                                        className={`w-full flex-1 rounded-2px text-[9px] font-mono font-bold flex items-center justify-center transition-colors ${density === d
                                                            ? 'bg-blue-600 text-white'
                                                            : isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                            }`}
                                                        title={d}
                                                    >
                                                        {d === 'comfortable' ? '▁' : d === 'compact' ? '▃' : '▅'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="relative group">
                                <button
                                    aria-label="User"
                                    className={`font-mono font-bold h-10 w-10 flex items-center justify-center text-xl ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                                    title={loggedInUser}
                                >
                                    <User size={20} strokeWidth={2.5} />
                                </button>
                                <div className={`absolute right-0 top-full mt-1 px-3 py-2 rounded-2px font-mono text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-900 text-white'}`}>
                                    {loggedInUser}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex gap-2 sm:gap-4 mb-4 flex-wrap">
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
                        {/* System filter legend chips (from DB) */}
                        {systemFilters.map((sf, i) => {
                            const active = isLegendActive(sf);
                            const colorStyles: Record<string, { active: string; inactive: string; swatch: string }> = {
                                yellow: { active: 'bg-yellow-300 border-yellow-500 text-yellow-900 font-bold', inactive: isDark ? 'border-yellow-600 text-gray-300 hover:bg-yellow-900/30' : 'border-yellow-400 text-gray-700 hover:bg-yellow-50', swatch: 'bg-yellow-100 border-yellow-400' },
                                red: { active: 'bg-red-300 border-red-500 text-red-900 font-bold', inactive: isDark ? 'border-red-600 text-gray-300 hover:bg-red-900/30' : 'border-red-400 text-gray-700 hover:bg-red-50', swatch: 'bg-red-100 border-red-400' },
                                green: { active: 'bg-green-300 border-green-500 text-green-900 font-bold', inactive: isDark ? 'border-green-600 text-gray-300 hover:bg-green-900/30' : 'border-green-400 text-gray-700 hover:bg-green-50', swatch: 'bg-green-100 border-green-400' },
                                blue: { active: 'bg-blue-300 border-blue-500 text-blue-900 font-bold', inactive: isDark ? 'border-blue-600 text-gray-300 hover:bg-blue-900/30' : 'border-blue-400 text-gray-700 hover:bg-blue-50', swatch: 'bg-blue-100 border-blue-400' },
                                purple: { active: 'bg-purple-300 border-purple-500 text-purple-900 font-bold', inactive: isDark ? 'border-purple-600 text-gray-300 hover:bg-purple-900/30' : 'border-purple-400 text-gray-700 hover:bg-purple-50', swatch: 'bg-purple-100 border-purple-400' },
                                orange: { active: 'bg-orange-300 border-orange-500 text-orange-900 font-bold', inactive: isDark ? 'border-orange-600 text-gray-300 hover:bg-orange-900/30' : 'border-orange-400 text-gray-700 hover:bg-orange-50', swatch: 'bg-orange-100 border-orange-400' },
                            };
                            const cs = colorStyles[sf.color || 'blue'] || colorStyles.blue;
                            return (
                                <button
                                    key={`sf-${i}`}
                                    onClick={() => toggleLegendFilter(sf)}
                                    className={`flex items-center gap-2 text-xs font-mono px-2 py-1 border-2 rounded-2px transition-colors ${active ? cs.active : cs.inactive}`}
                                >
                                    <div className={`w-3 h-3 border rounded-2px ${cs.swatch}`} />
                                    {COLUMN_LABELS[sf.column as keyof typeof COLUMN_LABELS] || sf.column} = {Array.isArray(sf.value) ? sf.value.join(' / ') : sf.value}
                                </button>
                            );
                        })}

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
                                    {COLUMN_LABELS[f.column as keyof typeof COLUMN_LABELS] || f.column} {f.filter_type === 'contains' ? '⊃' : f.filter_type === 'does_not_equal' ? '≠' : f.filter_type === 'does_not_contain' ? '⊅' : '='} {Array.isArray(f.value) ? f.value.join(' / ') : f.value}
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
                    className={`overflow-x-scroll overflow-y-hidden rounded-t-2px border-2 border-b-0 border-gray-800 shrink-0 relative z-10 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}
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
                        if (tableContainerRef.current) {
                            setShowScrollTop(tableContainerRef.current.scrollTop > 300);
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
                            activeFilters={[...systemFilters, ...activeFilters, ...userFilters]}
                            stickyColumns={stickyColumns}
                            stickyWidths={stickyWidths}
                            columnColors={columnColors}
                            density={density}
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
                            activeFilters={[...systemFilters, ...activeFilters, ...userFilters]}
                            stickyColumns={stickyColumns}
                            stickyWidths={stickyWidths}
                            columnColors={columnColors}
                            density={density}
                        />
                    )}
                </div>
            </main>

            {/* Scroll to top */}
            {showScrollTop && (
                <button
                    onClick={() => tableContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="fixed bottom-6 right-6 z-40 bg-gray-900 text-white p-3 rounded-2px shadow-lg hover:bg-gray-700 transition-colors border-2 border-gray-600"
                    title="Scroll to top"
                >
                    <ArrowUp size={20} strokeWidth={2.5} />
                </button>
            )}

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

            {/* Activity Feed */}
            <ActivityFeed
                isOpen={isActivityOpen}
                onClose={() => setIsActivityOpen(false)}
                onRecordClick={(recordId) => {
                    setIsActivityOpen(false);
                    const rec = allRecords.find(r => r.id === recordId);
                    if (rec) {
                        setSelectedRecord(rec);
                        setIsFlyoutOpen(true);
                    }
                }}
            />
        </div>
    );
}
