import { useState, useEffect } from 'react';
import { stickyColumnsApi } from '../api';
import { STAFF_COLUMNS, COLUMN_LABELS } from '../constants';

interface SettingsPageProps {
    onBack: () => void;
}

export function SettingsPage({ onBack }: SettingsPageProps) {
    const [stickyColumns, setStickyColumns] = useState<any[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [newColumn, setNewColumn] = useState<string>(STAFF_COLUMNS[0]);
    const [newWidth, setNewWidth] = useState<number>(220);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadStickyColumns();
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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen font-mono text-gray-700">
                Loading settings...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 font-mono">
            {/* Header */}
            <header className="bg-gray-900 border-b-4 border-gray-800 p-6">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <h1 className="text-3xl font-bold">Settings</h1>
                    <button
                        onClick={onBack}
                        className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-2px border-2 border-gray-800"
                    >
                        ← Back to Table
                    </button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto p-6">
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
                                    className={`border-2 rounded-2px p-4 flex items-center justify-between ${sc.is_active
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
            </main>
        </div>
    );
}
