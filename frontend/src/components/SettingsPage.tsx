import { useState, useEffect } from 'react';
import { stickyColumnsApi, columnColorsApi } from '../api';
import { STAFF_COLUMNS, COLUMN_LABELS } from '../constants';
import { AppHeader } from './AppHeader';

interface SettingsPageProps {
    onNavigateToMain: () => void;
    onNavigateToViews: () => void;
    onNavigateToFilters: () => void;
    onNavigateToSettings: () => void;
    onNavigateToQueue: () => void;
    onSignOut: () => void;
}

export function SettingsPage({ onNavigateToMain, onNavigateToViews, onNavigateToFilters, onNavigateToSettings, onNavigateToQueue, onSignOut }: SettingsPageProps) {
    const [stickyColumns, setStickyColumns] = useState<any[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [newColumn, setNewColumn] = useState<string>(STAFF_COLUMNS[0]);
    const [newWidth, setNewWidth] = useState<number>(220);
    const [isLoading, setIsLoading] = useState(true);

    // Column Colors state
    const [columnColors, setColumnColors] = useState<any[]>([]);
    const [isCreatingColor, setIsCreatingColor] = useState(false);
    const [editingColorId, setEditingColorId] = useState<number | null>(null);
    const [colorColumn, setColorColumn] = useState<string>(STAFF_COLUMNS[0]);
    const [colorValue, setColorValue] = useState<string>('#e0f2fe');

    useEffect(() => {
        loadStickyColumns();
        loadColumnColors();
    }, []);

    const loadStickyColumns = async () => {
        try {
            const res = await stickyColumnsApi.getAll();
            setStickyColumns(res.data);
        } catch (err) {
            console.error('Failed to load sticky columns:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setIsCreating(false);
        setEditingId(null);
        setNewColumn(STAFF_COLUMNS[0]);
        setNewWidth(220);
    };

    const handleEdit = (sc: any) => {
        setEditingId(sc.id);
        setIsCreating(true);
        setNewColumn(sc.column_name);
        setNewWidth(sc.column_width || 220);
    };

    const handleSave = async () => {
        try {
            if (editingId) {
                await stickyColumnsApi.update(editingId, newColumn, newWidth);
            } else {
                await stickyColumnsApi.create(newColumn, newWidth);
            }
            loadStickyColumns();
            resetForm();
        } catch (err: any) {
            console.error('Failed to save sticky column:', err);
            if (err?.response?.status === 500 && err?.response?.data?.error?.includes('UNIQUE')) {
                alert('This column is already configured as sticky');
            } else {
                alert('Failed to save sticky column');
            }
        }
    };

    const handleToggle = async (id: number) => {
        try {
            await stickyColumnsApi.toggle(id);
            loadStickyColumns();
        } catch (err) {
            console.error('Failed to toggle sticky column:', err);
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm('Delete this sticky column?')) {
            try {
                await stickyColumnsApi.delete(id);
                loadStickyColumns();
            } catch (err) {
                console.error('Failed to delete sticky column:', err);
                alert('Failed to delete sticky column');
            }
        }
    };

    // Column Colors handlers
    const loadColumnColors = async () => {
        try {
            const res = await columnColorsApi.getAll();
            setColumnColors(res.data);
        } catch (err) {
            console.error('Failed to load column colors:', err);
        }
    };

    const resetColorForm = () => {
        setIsCreatingColor(false);
        setEditingColorId(null);
        setColorColumn(STAFF_COLUMNS[0]);
        setColorValue('#e0f2fe');
    };

    const handleEditColor = (cc: any) => {
        setEditingColorId(cc.id);
        setIsCreatingColor(true);
        setColorColumn(cc.column_name);
        setColorValue(cc.color);
    };

    const handleSaveColor = async () => {
        try {
            if (editingColorId) {
                await columnColorsApi.update(editingColorId, colorColumn, colorValue);
            } else {
                await columnColorsApi.create(colorColumn, colorValue);
            }
            loadColumnColors();
            resetColorForm();
        } catch (err: any) {
            console.error('Failed to save column color:', err);
            if (err?.response?.status === 500 && err?.response?.data?.error?.includes('UNIQUE')) {
                alert('This column already has a color assigned');
            } else {
                alert('Failed to save column color');
            }
        }
    };

    const handleToggleColor = async (id: number) => {
        try {
            await columnColorsApi.toggle(id);
            loadColumnColors();
        } catch (err) {
            console.error('Failed to toggle column color:', err);
        }
    };

    const handleDeleteColor = async (id: number) => {
        if (confirm('Delete this column color?')) {
            try {
                await columnColorsApi.delete(id);
                loadColumnColors();
            } catch (err) {
                console.error('Failed to delete column color:', err);
                alert('Failed to delete column color');
            }
        }
    };

    const PASTEL_PRESETS = [
        { label: 'Blue', value: '#bfdbfe' },
        { label: 'Green', value: '#bbf7d0' },
        { label: 'Yellow', value: '#fef08a' },
        { label: 'Pink', value: '#fbcfe8' },
        { label: 'Purple', value: '#e9d5ff' },
        { label: 'Orange', value: '#fed7aa' },
        { label: 'Teal', value: '#99f6e4' },
        { label: 'Red', value: '#fecaca' },
        { label: 'Indigo', value: '#c7d2fe' },
        { label: 'Lime', value: '#d9f99d' },
        { label: 'Amber', value: '#fde68a' },
        { label: 'Gray', value: '#e5e7eb' },
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen font-mono text-gray-700">
                Loading settings...
            </div>
        );
    }

    return (
        <div className={`min-h-screen font-mono ${localStorage.getItem('mainUiTheme') === 'light' ? 'bg-slate-100 text-slate-900' : 'bg-slate-900 text-slate-100'}`}>
            <AppHeader
                title="Settings"
                onNavigateToMain={onNavigateToMain}
                onNavigateToViews={onNavigateToViews}
                onNavigateToFilters={onNavigateToFilters}
                onNavigateToSettings={onNavigateToSettings}
                onNavigateToQueue={onNavigateToQueue}
                onSignOut={onSignOut}
            />

            <main className="max-w-6xl mx-auto p-6">
                {/* Included Columns Section */}
                <IncludedColumnsSection />

                {/* Sticky Columns Section */}
                <section className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h2 className="text-xl font-bold text-blue-400">Sticky Columns</h2>
                            <p className="text-sm text-gray-400 mt-1">Configure columns that stay fixed during horizontal scroll</p>
                        </div>
                        {!isCreating && (
                            <button
                                onClick={() => { setIsCreating(true); setEditingId(null); setNewColumn(STAFF_COLUMNS[0]); }}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-2px border-2 border-blue-800"
                            >
                                + Add Sticky Column
                            </button>
                        )}
                    </div>

                    {/* Create/Edit Form */}
                    {isCreating && (
                        <div className="border-2 border-blue-600 bg-blue-900/20 rounded-2px p-4 mb-4">
                            <h3 className="text-lg font-bold mb-3">
                                {editingId ? 'Edit Sticky Column' : 'Add Sticky Column'}
                            </h3>
                            <div className="flex items-end gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm text-gray-400 mb-1">Column</label>
                                    <select
                                        value={newColumn}
                                        onChange={(e) => setNewColumn(e.target.value)}
                                        className="w-full bg-gray-800 border-2 border-gray-600 text-white p-2 rounded-2px font-mono"
                                    >
                                        {STAFF_COLUMNS.map((col) => (
                                            <option key={col} value={col}>
                                                {COLUMN_LABELS[col as keyof typeof COLUMN_LABELS] || col}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="w-32">
                                    <label className="block text-sm text-gray-400 mb-1">Column Width (px)</label>
                                    <input
                                        type="number"
                                        min={100}
                                        max={500}
                                        value={newWidth}
                                        onChange={(e) => setNewWidth(Math.max(100, Math.min(500, parseInt(e.target.value) || 220)))}
                                        className="w-full bg-gray-800 border-2 border-gray-600 text-white p-2 rounded-2px font-mono"
                                    />
                                </div>
                                <button
                                    onClick={handleSave}
                                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-2px border-2 border-green-800"
                                >
                                    {editingId ? 'Update' : 'Add'}
                                </button>
                                <button
                                    onClick={resetForm}
                                    className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-2px border-2 border-gray-800"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Sticky Columns List */}
                    {stickyColumns.length === 0 ? (
                        <div className="border-2 border-gray-700 rounded-2px p-8 text-center text-gray-500">
                            No sticky columns configured. Add one to keep columns visible during horizontal scroll.
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {stickyColumns.map((sc, index) => (
                                <div
                                    key={sc.id}
                                    className={`border-2 rounded-2px p-4 flex flex-wrap items-center justify-between gap-3 ${sc.is_active
                                        ? 'border-blue-600 bg-blue-900/20'
                                        : 'border-gray-700 bg-gray-900/20 opacity-60'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="text-gray-500 text-sm w-6">#{index + 1}</span>
                                        <div>
                                            <div className="font-bold text-lg">
                                                {COLUMN_LABELS[sc.column_name as keyof typeof COLUMN_LABELS] || sc.column_name}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                {sc.column_name} · {sc.column_width || 220}px · {sc.is_active ? 'Active' : 'Inactive'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex gap-1 border-2 border-gray-600 rounded-2px p-1 bg-slate-900">
                                            <button
                                                onClick={() => !sc.is_active && handleToggle(sc.id)}
                                                className={`px-3 py-1 rounded-2px font-mono text-xs font-bold transition-colors ${sc.is_active
                                                    ? 'bg-blue-600 text-white'
                                                    : 'text-gray-400 hover:text-gray-100 hover:bg-slate-700'
                                                    }`}
                                            >
                                                Active
                                            </button>
                                            <button
                                                onClick={() => sc.is_active && handleToggle(sc.id)}
                                                className={`px-3 py-1 rounded-2px font-mono text-xs font-bold transition-colors ${!sc.is_active
                                                    ? 'bg-blue-600 text-white'
                                                    : 'text-gray-400 hover:text-gray-100 hover:bg-slate-700'
                                                    }`}
                                            >
                                                Inactive
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => handleEdit(sc)}
                                            className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-1 px-3 rounded-2px border-2 border-yellow-800 text-sm"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(sc.id)}
                                            className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded-2px border-2 border-red-800 text-sm"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Column Colors Section */}
                <section className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h2 className="text-xl font-bold text-blue-400">Column Colors</h2>
                            <p className="text-sm text-gray-400 mt-1">Set pastel background colors for columns. Row filter colors take precedence.</p>
                        </div>
                        {!isCreatingColor && (
                            <button
                                onClick={() => { setIsCreatingColor(true); setEditingColorId(null); setColorColumn(STAFF_COLUMNS[0]); }}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-2px border-2 border-blue-800"
                            >
                                + Add Column Color
                            </button>
                        )}
                    </div>

                    {/* Create/Edit Color Form */}
                    {isCreatingColor && (
                        <div className="border-2 border-blue-600 bg-blue-900/20 rounded-2px p-4 mb-4">
                            <h3 className="text-lg font-bold mb-3">
                                {editingColorId ? 'Edit Column Color' : 'Add Column Color'}
                            </h3>
                            <div className="flex flex-wrap items-end gap-4">
                                <div className="flex-1 min-w-full sm:min-w-0">
                                    <label className="block text-sm text-gray-400 mb-1">Column</label>
                                    <select
                                        value={colorColumn}
                                        onChange={(e) => setColorColumn(e.target.value)}
                                        className="w-full bg-gray-800 border-2 border-gray-600 text-white p-2 rounded-2px font-mono"
                                    >
                                        <optgroup label="Special Columns">
                                            <option value="__pin__">[Pin]</option>
                                            <option value="__edit__">[Edit]</option>
                                            <option value="__row__">[Row #]</option>
                                        </optgroup>
                                        <optgroup label="Data Columns">
                                            {STAFF_COLUMNS.map((col) => (
                                                <option key={col} value={col}>
                                                    {COLUMN_LABELS[col as keyof typeof COLUMN_LABELS] || col}
                                                </option>
                                            ))}
                                        </optgroup>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Color</label>
                                    <div className="flex items-center gap-2">
                                        <div className="flex gap-1">
                                            {PASTEL_PRESETS.map((p) => (
                                                <button
                                                    key={p.value}
                                                    onClick={() => setColorValue(p.value)}
                                                    className={`w-6 h-6 rounded-2px border-2 ${colorValue === p.value ? 'border-blue-400 scale-110' : 'border-gray-600'}`}
                                                    style={{ backgroundColor: p.value }}
                                                    title={p.label}
                                                />
                                            ))}
                                        </div>
                                        <input
                                            type="color"
                                            value={colorValue}
                                            onChange={(e) => setColorValue(e.target.value)}
                                            className="w-8 h-8 rounded-2px border-2 border-gray-600 cursor-pointer bg-transparent"
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={handleSaveColor}
                                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-2px border-2 border-green-800"
                                >
                                    {editingColorId ? 'Update' : 'Add'}
                                </button>
                                <button
                                    onClick={resetColorForm}
                                    className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-2px border-2 border-gray-800"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Column Colors List */}
                    {columnColors.length === 0 ? (
                        <div className="border-2 border-gray-700 rounded-2px p-8 text-center text-gray-500">
                            No column colors configured. Add one to highlight entire columns with a pastel background.
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {columnColors.map((cc) => (
                                <div
                                    key={cc.id}
                                    className={`border-2 rounded-2px p-4 flex items-center justify-between ${cc.is_active
                                        ? 'border-blue-600 bg-blue-900/20'
                                        : 'border-gray-700 bg-gray-900/20 opacity-60'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div
                                            className="w-8 h-8 rounded-2px border-2 border-gray-500"
                                            style={{ backgroundColor: cc.color }}
                                        />
                                        <div>
                                            <div className="font-bold text-lg">
                                                {cc.column_name === '__pin__' ? '[Pin]' : cc.column_name === '__edit__' ? '[Edit]' : cc.column_name === '__row__' ? '[Row #]' : (COLUMN_LABELS[cc.column_name as keyof typeof COLUMN_LABELS] || cc.column_name)}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                {cc.column_name} · {cc.color} · {cc.is_active ? 'Active' : 'Inactive'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex gap-1 border-2 border-gray-600 rounded-2px p-1 bg-slate-900">
                                            <button
                                                onClick={() => !cc.is_active && handleToggleColor(cc.id)}
                                                className={`px-3 py-1 rounded-2px font-mono text-xs font-bold transition-colors ${cc.is_active
                                                    ? 'bg-blue-600 text-white'
                                                    : 'text-gray-400 hover:text-gray-100 hover:bg-slate-700'
                                                    }`}
                                            >
                                                Active
                                            </button>
                                            <button
                                                onClick={() => cc.is_active && handleToggleColor(cc.id)}
                                                className={`px-3 py-1 rounded-2px font-mono text-xs font-bold transition-colors ${!cc.is_active
                                                    ? 'bg-blue-600 text-white'
                                                    : 'text-gray-400 hover:text-gray-100 hover:bg-slate-700'
                                                    }`}
                                            >
                                                Inactive
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => handleEditColor(cc)}
                                            className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-1 px-3 rounded-2px border-2 border-yellow-800 text-sm"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteColor(cc.id)}
                                            className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded-2px border-2 border-red-800 text-sm"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Font Settings Section */}
                <FontSettings />
            </main>
        </div>
    );
}

const FONT_OPTIONS = {
    text: [
        { label: 'JetBrains Mono', value: "'JetBrains Mono', monospace" },
        { label: 'Inter', value: "'Inter', sans-serif" },
        { label: 'IBM Plex Sans', value: "'IBM Plex Sans', sans-serif" },
        { label: 'Source Sans 3', value: "'Source Sans 3', sans-serif" },
        { label: 'System Default', value: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
    ],
    numbers: [
        { label: 'JetBrains Mono', value: "'JetBrains Mono', monospace" },
        { label: 'Fira Code', value: "'Fira Code', monospace" },
        { label: 'IBM Plex Mono', value: "'IBM Plex Mono', monospace" },
        { label: 'System Monospace', value: 'monospace' },
    ],
};

function IncludedColumnsSection() {
    const isAdmin = localStorage.getItem('userEmail') === 'admin@staffing.com';
    const isDark = localStorage.getItem('mainUiTheme') !== 'light';
    const [selectedColumns, setSelectedColumns] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem('includedColumns');
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });
    const [isEditing, setIsEditing] = useState(false);
    const [editColumns, setEditColumns] = useState<string[]>([]);

    const startEdit = () => {
        setEditColumns([...selectedColumns]);
        setIsEditing(true);
    };

    const toggleColumn = (col: string) => {
        setEditColumns((prev) =>
            prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
        );
    };

    const handleSave = () => {
        setSelectedColumns(editColumns);
        localStorage.setItem('includedColumns', JSON.stringify(editColumns));
        setIsEditing(false);
    };

    return (
        <section className="mb-8">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-xl font-bold text-blue-400">Included Columns</h2>
                    <p className="text-sm text-gray-400 mt-1">Select columns to be sent to the Oracle team when a queued item is processed{!isAdmin ? ' (administrators only)' : ''}.</p>
                </div>
                {!isEditing && (
                    <button
                        onClick={startEdit}
                        disabled={!isAdmin}
                        className={`font-bold py-2 px-4 rounded-2px border-2 ${isAdmin ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-800 cursor-pointer' : 'bg-gray-600 text-gray-400 border-gray-700 cursor-not-allowed opacity-50'}`}
                    >
                        {selectedColumns.length > 0 ? 'Edit' : '+ Configure'}
                    </button>
                )}
            </div>

            {isEditing && (
                <div className="border-2 border-blue-600 bg-blue-900/20 rounded-2px p-6 mb-4">
                    <h3 className="text-lg font-bold mb-3">Select Columns ({editColumns.length})</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-96 overflow-y-auto mb-4">
                        {STAFF_COLUMNS.map((col, idx) => (
                            <label
                                key={col}
                                className="flex items-center gap-2 cursor-pointer hover:bg-gray-700 p-2 rounded-2px"
                            >
                                <input
                                    type="checkbox"
                                    checked={editColumns.includes(col)}
                                    onChange={() => toggleColumn(col)}
                                    className="w-4 h-4"
                                />
                                <span className="text-sm">
                                    <span className="text-gray-400">{idx + 1}.</span> {COLUMN_LABELS[col]}
                                </span>
                            </label>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleSave}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-2px border-2 border-green-800"
                        >
                            Save
                        </button>
                        <button
                            onClick={() => setIsEditing(false)}
                            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-2px border-2 border-gray-800"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {!isEditing && selectedColumns.length === 0 ? (
                <div className="border-2 border-gray-700 rounded-2px p-8 text-center text-gray-500">
                    No columns configured. Click Configure to select which columns are sent to Oracle.
                </div>
            ) : !isEditing && (
                <div className={`border-2 rounded-2px p-4 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}>
                    <div className="flex flex-wrap gap-2">
                        {selectedColumns.map((col) => (
                            <span
                                key={col}
                                className={`px-2 py-1 rounded-2px text-xs ${isDark ? 'bg-blue-900 text-blue-100' : 'bg-blue-100 text-blue-900'}`}
                            >
                                {COLUMN_LABELS[col as keyof typeof COLUMN_LABELS] || col}
                            </span>
                        ))}
                    </div>
                    <div className="text-xs text-gray-400 mt-3">{selectedColumns.length} column{selectedColumns.length !== 1 ? 's' : ''} selected</div>
                </div>
            )}
        </section>
    );
}

function FontSettings() {
    const [textFont, setTextFont] = useState(() => localStorage.getItem('fontText') || FONT_OPTIONS.text[0].value);
    const [numbersFont, setNumbersFont] = useState(() => localStorage.getItem('fontNumbers') || FONT_OPTIONS.numbers[0].value);

    useEffect(() => {
        document.documentElement.style.setProperty('--font-text', textFont);
        document.documentElement.style.setProperty('--font-numbers', numbersFont);
    }, [textFont, numbersFont]);

    const handleTextFont = (value: string) => {
        setTextFont(value);
        localStorage.setItem('fontText', value);
    };

    const handleNumbersFont = (value: string) => {
        setNumbersFont(value);
        localStorage.setItem('fontNumbers', value);
    };

    return (
        <section className="mb-8">
            <div className="mb-4">
                <h2 className="text-xl font-bold text-blue-400">Font Settings</h2>
                <p className="text-sm text-gray-400 mt-1">Choose fonts for text and numeric columns</p>
            </div>
            <div className="bg-gray-800 border-2 border-gray-700 rounded-2px p-6 space-y-6">
                <div>
                    <label className="block text-xs font-bold tracking-wider mb-2 text-gray-300">TEXT FONT</label>
                    <select
                        value={textFont}
                        onChange={(e) => handleTextFont(e.target.value)}
                        className="w-full max-w-md px-3 py-2 rounded-2px border-2 border-gray-600 bg-gray-700 text-white text-sm outline-none focus:border-blue-500"
                    >
                        {FONT_OPTIONS.text.map((f) => (
                            <option key={f.value} value={f.value}>{f.label}</option>
                        ))}
                    </select>
                    <p className="mt-2 text-xs text-gray-400" style={{ fontFamily: textFont }}>
                        Preview: The quick brown fox jumps over the lazy dog
                    </p>
                </div>
                <div>
                    <label className="block text-xs font-bold tracking-wider mb-2 text-gray-300">NUMBERS / CODE FONT</label>
                    <select
                        value={numbersFont}
                        onChange={(e) => handleNumbersFont(e.target.value)}
                        className="w-full max-w-md px-3 py-2 rounded-2px border-2 border-gray-600 bg-gray-700 text-white text-sm outline-none focus:border-blue-500"
                    >
                        {FONT_OPTIONS.numbers.map((f) => (
                            <option key={f.value} value={f.value}>{f.label}</option>
                        ))}
                    </select>
                    <p className="mt-2 text-xs text-gray-400" style={{ fontFamily: numbersFont }}>
                        Preview: 0123456789 $1,234.56 #A1B2C3
                    </p>
                </div>
                <button
                    onClick={() => { handleTextFont(FONT_OPTIONS.text[0].value); handleNumbersFont(FONT_OPTIONS.numbers[0].value); }}
                    className="text-xs font-bold text-gray-400 hover:text-white"
                >
                    Reset to defaults
                </button>
            </div>
        </section>
    );
}
