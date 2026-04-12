import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { historyApi } from '../api';
import { COLUMN_LABELS } from '../constants';

interface ActivityEntry {
    id: number;
    record_id: number;
    changed_by: string;
    changes: Record<string, { from: string; to: string }>;
    created_at: string;
    employee_name?: string;
    pos_no?: string;
}

interface ActivityFeedProps {
    isOpen: boolean;
    onClose: () => void;
    onRecordClick?: (recordId: number) => void;
}

function formatDate(dateStr: string): string {
    const d = new Date(dateStr + (dateStr.endsWith('Z') ? '' : 'Z'));
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    const entryDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

    if (entryDate.getTime() === today.getTime()) return 'Today';
    if (entryDate.getTime() === yesterday.getTime()) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(dateStr: string): string {
    const d = new Date(dateStr + (dateStr.endsWith('Z') ? '' : 'Z'));
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function ActivityFeed({ isOpen, onClose, onRecordClick }: ActivityFeedProps) {
    const [entries, setEntries] = useState<ActivityEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        if (isOpen) {
            loadEntries(true);
        }
    }, [isOpen]);

    const loadEntries = async (reset = false) => {
        setIsLoading(true);
        try {
            const offset = reset ? 0 : entries.length;
            const res = await historyApi.getActivityFeed(50, offset);
            const data: ActivityEntry[] = res.data;
            if (reset) {
                setEntries(data);
            } else {
                setEntries(prev => [...prev, ...data]);
            }
            setHasMore(data.length === 50);
        } catch (err) {
            console.error('Failed to load activity feed:', err);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    // Group entries by date
    const grouped: { date: string; items: ActivityEntry[] }[] = [];
    for (const entry of entries) {
        const date = formatDate(entry.created_at);
        const last = grouped[grouped.length - 1];
        if (last && last.date === date) {
            last.items.push(entry);
        } else {
            grouped.push({ date, items: [entry] });
        }
    }

    return (
        <div className="fixed inset-0 z-50">
            {/* Overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-30" onClick={onClose} />

            {/* Slide-out panel */}
            <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white border-l-4 border-gray-800 shadow-xl flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-gray-900 text-white border-b-2 border-gray-800">
                    <h2 className="font-mono font-bold text-lg">Activity Feed</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors p-1"
                    >
                        <X size={20} strokeWidth={2.5} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {entries.length === 0 && !isLoading && (
                        <p className="text-sm text-gray-500 font-mono p-6 text-center">No activity yet</p>
                    )}

                    {grouped.map((group) => (
                        <div key={group.date}>
                            <div className="sticky top-0 bg-gray-100 border-b border-gray-300 px-4 py-2">
                                <span className="font-mono font-bold text-xs text-gray-600 uppercase">{group.date}</span>
                            </div>
                            {group.items.map((entry) => {
                                const changeKeys = Object.keys(entry.changes);
                                return (
                                    <div
                                        key={entry.id}
                                        onClick={() => onRecordClick?.(entry.record_id)}
                                        className="px-4 py-3 border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                                    >
                                        <div className="flex items-start justify-between mb-1">
                                            <div className="font-mono text-sm font-bold text-gray-900 truncate">
                                                {entry.employee_name || `Record #${entry.record_id}`}
                                            </div>
                                            <span className="font-mono text-xs text-gray-400 whitespace-nowrap ml-2">
                                                {formatTime(entry.created_at)}
                                            </span>
                                        </div>
                                        {entry.pos_no && (
                                            <div className="font-mono text-xs text-gray-500 mb-1">
                                                Pos: {entry.pos_no}
                                            </div>
                                        )}
                                        <div className="space-y-1">
                                            {changeKeys.map((field) => {
                                                const c = entry.changes[field];
                                                const label = COLUMN_LABELS[field as keyof typeof COLUMN_LABELS] || field;
                                                return (
                                                    <div key={field} className="font-mono text-xs">
                                                        <span className="text-gray-500">{label}:</span>{' '}
                                                        <span className="text-red-500 line-through">{c.from || '—'}</span>{' '}
                                                        <span className="text-gray-400">→</span>{' '}
                                                        <span className="text-green-700 font-bold">{c.to || '—'}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div className="font-mono text-xs text-gray-400 mt-1">
                                            by {entry.changed_by}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}

                    {hasMore && entries.length > 0 && (
                        <div className="p-4 text-center">
                            <button
                                onClick={() => loadEntries(false)}
                                disabled={isLoading}
                                className="font-mono text-sm font-bold text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                            >
                                {isLoading ? 'Loading...' : 'Load more'}
                            </button>
                        </div>
                    )}

                    {isLoading && entries.length === 0 && (
                        <p className="text-sm text-gray-500 font-mono p-6 text-center">Loading...</p>
                    )}
                </div>
            </div>
        </div>
    );
}
