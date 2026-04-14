import { useState, useEffect } from 'react';
import { viewsApi } from '../api';
import { STAFF_COLUMNS, COLUMN_LABELS } from '../constants';
import { AppHeader } from './AppHeader';

interface ViewsPageProps {
    onNavigateToMain: () => void;
    onNavigateToViews: () => void;
    onNavigateToFilters: () => void;
    onNavigateToSettings: () => void;
    onNavigateToQueue: () => void;
    onSignOut: () => void;
}

export function ViewsPage({ onNavigateToMain, onNavigateToViews, onNavigateToFilters, onNavigateToSettings, onNavigateToQueue, onSignOut }: ViewsPageProps) {
    const [views, setViews] = useState<any[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [newViewName, setNewViewName] = useState('');
    const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const isAdmin = localStorage.getItem('userEmail') === 'admin@staffing.com';

    useEffect(() => {
        loadViews();
    }, []);

    const loadViews = async () => {
        try {
            const userEmail = localStorage.getItem('userEmail') || 'demo@staffing.com';
            const res = await viewsApi.getAll(userEmail);
            setViews(res.data);
        } catch (err) {
            console.error('Failed to load views:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateNew = () => {
        setIsCreating(true);
        setEditingId(null);
        setNewViewName('');
        setSelectedColumns([]);
    };

    const handleEdit = (view: any) => {
        setIsCreating(true);
        setEditingId(view.id);
        setNewViewName(view.name);
        setSelectedColumns(view.column_keys);
    };

    const handleSave = async () => {
        if (!newViewName.trim() || selectedColumns.length === 0) {
            alert('View name and at least one column are required');
            return;
        }

        try {
            const userEmail = localStorage.getItem('userEmail') || 'demo@staffing.com';

            if (editingId) {
                await viewsApi.update(editingId, {
                    name: newViewName,
                    column_keys: selectedColumns,
                });
            } else {
                await viewsApi.create({
                    name: newViewName,
                    column_keys: selectedColumns,
                    created_by: userEmail,
                });
            }

            loadViews();
            setIsCreating(false);
            setNewViewName('');
            setSelectedColumns([]);
            setEditingId(null);
        } catch (err) {
            console.error('Failed to save view:', err);
            alert('Failed to save view');
        }
    };

    const handleToggleView = async (id: number) => {
        try {
            await viewsApi.toggle(id);
            loadViews();
        } catch (err) {
            console.error('Failed to toggle view:', err);
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm('Delete this view?')) {
            try {
                await viewsApi.delete(id);
                loadViews();
            } catch (err) {
                console.error('Failed to delete view:', err);
                alert('Failed to delete view');
            }
        }
    };

    const toggleColumn = (col: string) => {
        setSelectedColumns((prev) =>
            prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
        );
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen font-mono text-gray-700">
                Loading views...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 font-mono">
            <AppHeader
                title="Manage Views"
                onNavigateToMain={onNavigateToMain}
                onNavigateToViews={onNavigateToViews}
                onNavigateToFilters={onNavigateToFilters}
                onNavigateToSettings={onNavigateToSettings}
                onNavigateToQueue={onNavigateToQueue}
                onSignOut={onSignOut}
            />

            <main className="max-w-6xl mx-auto p-6">
                {/* System Views (read-only) */}
                <section className="mb-8">
                    <h2 className="text-xl font-bold mb-1 text-blue-400">System Views</h2>
                    {!isAdmin && <p className="text-xs text-gray-500 mb-4">Only administrators can edit system views</p>}
                    <div className="grid gap-4">
                        {views
                            .filter((v) => v.is_system)
                            .map((view) => (
                                <div
                                    key={view.id}
                                    className="bg-gray-800 border-2 border-gray-700 rounded-2px p-4"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="font-bold text-lg">{view.name}</div>
                                        {isAdmin && (
                                            <button
                                                onClick={() => handleEdit(view)}
                                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded-2px text-sm border-2 border-blue-800"
                                            >
                                                Edit
                                            </button>
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-400 mb-3">
                                        {view.column_keys.length} columns
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {view.column_keys.map((col: string) => (
                                            <span
                                                key={col}
                                                className="bg-blue-900 text-blue-100 px-2 py-1 rounded-2px text-xs"
                                            >
                                                {COLUMN_LABELS[col as keyof typeof COLUMN_LABELS] || col}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                    </div>
                </section>

                {/* User Views */}
                <section className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-green-400">Your Custom Views</h2>
                        {!isCreating && (
                            <button
                                onClick={handleCreateNew}
                                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-2px border-2 border-green-800"
                            >
                                + New View
                            </button>
                        )}
                    </div>

                    {isCreating && (
                        <div className="bg-yellow-900 border-2 border-yellow-700 rounded-2px p-6 mb-6">
                            <h3 className="font-bold text-lg mb-4 text-yellow-100">
                                {editingId ? 'Edit View' : 'Create New View'}
                            </h3>

                            <div className="mb-4">
                                <label className="block text-sm font-bold mb-2">View Name</label>
                                <input
                                    type="text"
                                    value={newViewName}
                                    onChange={(e) => setNewViewName(e.target.value)}
                                    className="w-full px-3 py-2 border-2 border-gray-600 rounded-2px bg-slate-800 text-slate-100"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-bold mb-3">
                                    Select Columns ({selectedColumns.length})
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-96 overflow-y-auto">
                                    {STAFF_COLUMNS.map((col, idx) => (
                                        <label
                                            key={col}
                                            className="flex items-center gap-2 cursor-pointer hover:bg-gray-700 p-2 rounded-2px"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedColumns.includes(col)}
                                                onChange={() => toggleColumn(col)}
                                                className="w-4 h-4"
                                            />
                                            <span className="text-sm">
                                                <span className="text-gray-400">{idx + 1}.</span> {COLUMN_LABELS[col]}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={handleSave}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-2px border-2 border-green-800"
                                >
                                    Save View
                                </button>
                                <button
                                    onClick={() => {
                                        setIsCreating(false);
                                        setNewViewName('');
                                        setSelectedColumns([]);
                                        setEditingId(null);
                                    }}
                                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-2px border-2 border-gray-800"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="grid gap-4">
                        {views
                            .filter((v) => !v.is_system)
                            .map((view) => (
                                <div
                                    key={view.id}
                                    className="bg-gray-800 border-2 border-gray-700 rounded-2px p-4"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <div className="font-bold text-lg">{view.name}</div>
                                            <div className="text-xs text-gray-400">
                                                Created by {view.created_by}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex gap-1 border-2 border-gray-600 rounded-2px p-1 bg-slate-900">
                                                <button
                                                    onClick={() => !view.is_active && handleToggleView(view.id)}
                                                    className={`px-3 py-1 rounded-2px font-mono text-xs font-bold transition-colors ${view.is_active
                                                        ? 'bg-blue-600 text-white'
                                                        : 'text-gray-400 hover:text-gray-100 hover:bg-slate-700'
                                                        }`}
                                                >
                                                    Active
                                                </button>
                                                <button
                                                    onClick={() => view.is_active && handleToggleView(view.id)}
                                                    className={`px-3 py-1 rounded-2px font-mono text-xs font-bold transition-colors ${!view.is_active
                                                        ? 'bg-blue-600 text-white'
                                                        : 'text-gray-400 hover:text-gray-100 hover:bg-slate-700'
                                                        }`}
                                                >
                                                    Inactive
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => handleEdit(view)}
                                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded-2px text-sm border-2 border-blue-800"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(view.id)}
                                                className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded-2px text-sm border-2 border-red-800"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-400 mb-3">
                                        {view.column_keys.length} columns
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {view.column_keys.map((col: string) => (
                                            <span
                                                key={col}
                                                className="bg-green-900 text-green-100 px-2 py-1 rounded-2px text-xs"
                                            >
                                                {COLUMN_LABELS[col as keyof typeof COLUMN_LABELS] || col}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        {views.filter((v) => !v.is_system).length === 0 && !isCreating && (
                            <div className="text-center py-8 text-gray-500">
                                No custom views yet. Create one to get started!
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}
