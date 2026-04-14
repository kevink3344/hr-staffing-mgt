import { useState, useEffect } from 'react';
import { queueApi } from '../api';
import { Trash2 } from 'lucide-react';
import { AppHeader } from './AppHeader';

interface QueuePageProps {
    onNavigateToMain: () => void;
    onNavigateToViews: () => void;
    onNavigateToFilters: () => void;
    onNavigateToSettings: () => void;
    onNavigateToQueue: () => void;
    onSignOut: () => void;
    onGoToRecord?: (id: number) => void;
}

const STATUSES = ['Pending', 'In Progress', 'Completed', 'Error', 'Cancelled', 'Hold'];

const STATUS_COLORS: Record<string, string> = {
    'Pending': 'bg-yellow-200 text-yellow-900 border-yellow-400',
    'In Progress': 'bg-blue-200 text-blue-900 border-blue-400',
    'Completed': 'bg-green-200 text-green-900 border-green-400',
    'Error': 'bg-red-200 text-red-900 border-red-400',
    'Cancelled': 'bg-gray-200 text-gray-600 border-gray-400',
    'Hold': 'bg-orange-200 text-orange-900 border-orange-400',
};

interface QueueItem {
    id: number;
    staff_record_id: number;
    employee_name: string;
    employee_no: string;
    position_name: string;
    pos_no: string;
    effective_date: string;
    status: string;
    created_by: string;
    created_at: string;
    updated_at: string;
}

export function QueuePage({ onNavigateToMain, onNavigateToViews, onNavigateToFilters, onNavigateToSettings, onNavigateToQueue, onSignOut, onGoToRecord }: QueuePageProps) {
    const [items, setItems] = useState<QueueItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<Partial<QueueItem>>({});
    const theme = localStorage.getItem('mainUiTheme') || 'dark';
    const isDark = theme === 'dark';

    useEffect(() => {
        loadItems();
    }, [statusFilter]);

    const loadItems = async () => {
        try {
            setIsLoading(true);
            const res = await queueApi.getAll(statusFilter || undefined);
            setItems(res.data);
        } catch (err) {
            console.error('Failed to load queue:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusChange = async (id: number, status: string) => {
        try {
            await queueApi.updateStatus(id, status);
            loadItems();
        } catch (err) {
            console.error('Failed to update status:', err);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this queue item?')) return;
        try {
            await queueApi.delete(id);
            loadItems();
        } catch (err) {
            console.error('Failed to delete:', err);
        }
    };

    const startEdit = (item: QueueItem) => {
        setEditingId(item.id);
        setEditForm({
            employee_name: item.employee_name,
            employee_no: item.employee_no,
            position_name: item.position_name,
            pos_no: item.pos_no,
            effective_date: item.effective_date,
        });
    };

    const handleSaveEdit = async () => {
        if (!editingId) return;
        try {
            await queueApi.update(editingId, {
                employee_name: editForm.employee_name || '',
                employee_no: editForm.employee_no || '',
                position_name: editForm.position_name || '',
                pos_no: editForm.pos_no || '',
                effective_date: editForm.effective_date || '',
            });
            setEditingId(null);
            loadItems();
        } catch (err) {
            console.error('Failed to update:', err);
        }
    };

    return (
        <div className={`min-h-screen font-mono ${isDark ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
            <AppHeader
                title="Queue"
                onNavigateToMain={onNavigateToMain}
                onNavigateToViews={onNavigateToViews}
                onNavigateToFilters={onNavigateToFilters}
                onNavigateToSettings={onNavigateToSettings}
                onNavigateToQueue={onNavigateToQueue}
                onSignOut={onSignOut}
            />

            <div className="max-w-6xl mx-auto px-6 pt-4">
                <div className="flex items-center gap-3 mb-4">
                    <label className={`text-sm font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Filter by Status:</label>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className={`border-2 rounded-2px px-3 py-1.5 font-mono text-sm ${isDark ? 'border-gray-600 bg-gray-800 text-gray-100' : 'border-gray-800 bg-white text-gray-900'}`}
                    >
                        <option value="">All</option>
                        {STATUSES.map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                    <span className={`text-sm ml-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{items.length} item{items.length !== 1 ? 's' : ''}</span>
                </div>
            </div>

            <main className="max-w-6xl mx-auto p-6">
                {isLoading ? (
                    <p className="text-gray-500 text-center py-8">Loading...</p>
                ) : items.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No queue items{statusFilter ? ` with status "${statusFilter}"` : ''}.</p>
                ) : (
                    <div className={`overflow-x-auto border-2 rounded-2px ${isDark ? 'border-gray-700' : 'border-gray-800'}`}>
                        <table className="w-full text-sm">
                            <thead className="bg-gray-900 text-white">
                                <tr>
                                    <th className="text-left px-3 py-2 font-bold">#</th>
                                    <th className="text-left px-3 py-2 font-bold">Future Employee</th>
                                    <th className="text-left px-3 py-2 font-bold">Emp No.</th>
                                    <th className="text-left px-3 py-2 font-bold">Position Name</th>
                                    <th className="text-left px-3 py-2 font-bold">Pos No.</th>
                                    <th className="text-left px-3 py-2 font-bold">Effective Date</th>
                                    <th className="text-left px-3 py-2 font-bold">Status</th>
                                    <th className="text-left px-3 py-2 font-bold">Created</th>
                                    <th className="text-left px-3 py-2 font-bold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, idx) => (
                                    <tr key={item.id} className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-300'} ${idx % 2 === 0 ? (isDark ? 'bg-gray-900' : 'bg-white') : (isDark ? 'bg-gray-800' : 'bg-gray-50')} ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                                        <td className={`px-3 py-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{idx + 1}</td>
                                        {editingId === item.id ? (
                                            <>
                                                <td className="px-3 py-2"><button type="button" onClick={() => onGoToRecord?.(item.staff_record_id)} className="text-blue-500 hover:text-blue-400 underline cursor-pointer bg-transparent border-none p-0 font-inherit">{item.employee_name}</button></td>
                                                <td className="px-3 py-2">{item.employee_no}</td>
                                                <td className="px-3 py-2">{item.position_name}</td>
                                                <td className="px-3 py-2">{item.pos_no}</td>
                                                <td className="px-3 py-2">{item.effective_date}</td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="px-3 py-2"><button type="button" onClick={() => onGoToRecord?.(item.staff_record_id)} className="text-blue-500 hover:text-blue-400 underline cursor-pointer bg-transparent border-none p-0 font-inherit">{item.employee_name}</button></td>
                                                <td className="px-3 py-2">{item.employee_no}</td>
                                                <td className="px-3 py-2">{item.position_name}</td>
                                                <td className="px-3 py-2">{item.pos_no}</td>
                                                <td className="px-3 py-2">{item.effective_date}</td>
                                            </>
                                        )}
                                        <td className="px-3 py-2">
                                            <select
                                                value={item.status}
                                                onChange={(e) => handleStatusChange(item.id, e.target.value)}
                                                className={`border rounded-2px px-2 py-1 font-mono text-xs font-bold ${STATUS_COLORS[item.status] || ''}`}
                                            >
                                                {STATUSES.map(s => (
                                                    <option key={s} value={s}>{s}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className={`px-3 py-2 whitespace-nowrap ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                            {new Date(item.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-3 py-2">
                                            <div className="flex gap-1">
                                                <button onClick={() => handleDelete(item.id)} className="p-1 text-red-600 hover:text-red-800" title="Delete">
                                                    <Trash2 size={16} strokeWidth={2.5} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
}
