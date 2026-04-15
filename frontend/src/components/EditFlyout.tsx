import { useState, useEffect, useRef, useCallback } from 'react';
import { staffApi, historyApi, commentsApi, queueApi } from '../api';
import { COLUMN_LABELS, EDITABLE_FIELDS, StaffRecord } from '../constants';

interface EditFlyoutProps {
    record: StaffRecord | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (record: StaffRecord) => void;
}

const MIN_PANEL_WIDTH = 320;
const MAX_PANEL_WIDTH = 900;
const DEFAULT_PANEL_WIDTH = 384; // sm:w-96 = 24rem = 384px

export function EditFlyout({ record, isOpen, onClose, onSave }: EditFlyoutProps) {
    const [activeTab, setActiveTab] = useState<'details' | 'history' | 'comments'>('details');
    const [formData, setFormData] = useState<any>(record || {});
    const [history, setHistory] = useState<any[]>([]);
    const [comments, setComments] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [queueItemId, setQueueItemId] = useState<number | null>(null);
    const [isQueuing, setIsQueuing] = useState(false);
    const [isPinned, setIsPinned] = useState(() => localStorage.getItem('editFlyoutPinned') === 'true');
    const [panelWidth, setPanelWidth] = useState(() => {
        const saved = localStorage.getItem('editFlyoutWidth');
        return saved ? Math.max(MIN_PANEL_WIDTH, Math.min(MAX_PANEL_WIDTH, parseInt(saved, 10))) : DEFAULT_PANEL_WIDTH;
    });
    const [isDragging, setIsDragging] = useState(false);
    const commentsEndRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        const newWidth = Math.max(MIN_PANEL_WIDTH, Math.min(MAX_PANEL_WIDTH, window.innerWidth - e.clientX));
        setPanelWidth(newWidth);
    }, []);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        // Save width after drag ends
        setPanelWidth(w => { localStorage.setItem('editFlyoutWidth', String(w)); return w; });
    }, [handleMouseMove]);

    const handleDragStart = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [handleMouseMove, handleMouseUp]);

    const togglePin = () => {
        setIsPinned(prev => {
            const next = !prev;
            localStorage.setItem('editFlyoutPinned', String(next));
            return next;
        });
    };

    useEffect(() => {
        if (record) {
            setFormData(record);
            loadHistory(record.id);
            loadComments(record.id);
            checkQueueStatus(record.id);
        }
    }, [record]);

    const loadHistory = async (recordId: number) => {
        try {
            const res = await historyApi.getByRecordId(recordId);
            setHistory(res.data);
        } catch (err) {
            console.error('Failed to load history:', err);
        }
    };

    const loadComments = async (recordId: number) => {
        try {
            const res = await commentsApi.getByRecordId(recordId);
            setComments(res.data);
            setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        } catch (err) {
            console.error('Failed to load comments:', err);
        }
    };

    const handleSendComment = async () => {
        if (!newMessage.trim() || !record) return;
        try {
            await commentsApi.create(record.id, newMessage.trim());
            setNewMessage('');
            loadComments(record.id);
        } catch (err) {
            console.error('Failed to send comment:', err);
        }
    };

    const handleDeleteComment = async (commentId: number) => {
        try {
            await commentsApi.delete(commentId);
            loadComments(record!.id);
        } catch (err) {
            console.error('Failed to delete comment:', err);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await staffApi.update(record!.id, formData);
            onSave(res.data);
            onClose();
        } catch (err) {
            console.error('Failed to save:', err);
            alert('Failed to save changes');
        } finally {
            setIsSaving(false);
        }
    };

    const checkQueueStatus = async (recordId: number) => {
        try {
            const res = await queueApi.getAll(undefined, recordId);
            const active = res.data.length > 0 ? res.data[0] : null;
            setQueueItemId(active ? active.id : null);
        } catch (err) {
            console.error('Failed to check queue status:', err);
            setQueueItemId(null);
        }
    };

    const handleQueue = async () => {
        if (!record) return;
        const action = queueItemId ? 'remove this item from' : 'add this item to';
        if (!window.confirm(`Are you sure you want to ${action} the Queue?`)) return;
        setIsQueuing(true);
        try {
            // Save any pending form changes first
            const hasChanges = Object.keys(formData).some(k => formData[k] !== (record as any)[k]);
            if (hasChanges) {
                const res = await staffApi.update(record.id, formData);
                onSave(res.data);
            }

            if (queueItemId) {
                await queueApi.delete(queueItemId);
                setQueueItemId(null);
            } else {
                const res = await queueApi.create(record.id);
                setQueueItemId(res.data.id);
            }
        } catch (err) {
            console.error('Failed to update queue:', err);
            alert('Failed to update queue');
        } finally {
            setIsQueuing(false);
        }
    };

    console.log('[EditFlyout] isOpen:', isOpen, 'record:', record ? record.employee_name : 'null');

    if (!isOpen || !record) {
        return null;
    }

    const editableFields = EDITABLE_FIELDS;

    return (
        <>
            {isOpen && (
                <div className={`fixed inset-0 z-50 ${isPinned ? 'pointer-events-none' : ''}`} style={isDragging ? { cursor: 'col-resize', pointerEvents: 'auto' } : undefined}>
                    {/* Overlay - hidden when pinned */}
                    {!isPinned && (
                        <div
                            className="absolute inset-0 bg-black bg-opacity-50 z-40"
                            onClick={onClose}
                        />
                    )}

                    {/* Panel - positioned on the right */}
                    <div
                        className="absolute top-0 right-0 bottom-0 bg-white shadow-2xl flex flex-col border-l-2 border-gray-800 z-50 pointer-events-auto"
                        style={{ width: window.innerWidth < 640 ? '100%' : `${panelWidth}px` }}
                    >
                        {/* Drag handle */}
                        <div
                            className="absolute top-0 left-0 bottom-0 w-1.5 cursor-col-resize z-50 hover:bg-blue-500 transition-colors"
                            style={isDragging ? { backgroundColor: 'rgb(59, 130, 246)' } : undefined}
                            onMouseDown={handleDragStart}
                        />
                        {/* Header */}
                        <div className="bg-gray-900 text-white p-4 border-b-2 border-gray-800">
                            <h2 className="text-lg font-bold font-mono pr-16">{record.employee_name || 'None'}</h2>
                            <div className="absolute top-4 right-4 flex items-center gap-2">
                                <button
                                    onClick={togglePin}
                                    className={`text-white hover:text-gray-200 text-lg leading-none ${isPinned ? 'opacity-100' : 'opacity-50'}`}
                                    title={isPinned ? 'Unpin panel' : 'Pin panel open'}
                                >
                                    📌
                                </button>
                                <button
                                    onClick={onClose}
                                    className="text-white hover:text-gray-200 text-2xl leading-none"
                                >
                                    ×
                                </button>
                            </div>
                        </div>

                        {/* Position Info */}
                        <div className="bg-gray-50 border-b-2 border-gray-300 px-4 py-3">
                            <p className="text-xs text-gray-500 font-mono font-bold tracking-wider mb-1">POSITION</p>
                            <p className="text-sm font-bold font-mono text-gray-900">{record.position_name || '—'}</p>
                            <p className="text-xs text-gray-500 font-mono mt-1">
                                Pos# {record.pos_no || '—'} · {record.classroom_teaching_assignment || '—'}
                            </p>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b-2 border-gray-800 bg-gray-100">
                            <button
                                onClick={() => setActiveTab('details')}
                                className={`flex-1 py-3 px-4 font-mono text-sm font-bold border-b-2 ${activeTab === 'details'
                                    ? 'bg-white border-blue-500 text-blue-700'
                                    : 'border-transparent text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                Details
                            </button>
                            <button
                                onClick={() => setActiveTab('history')}
                                className={`flex-1 py-3 px-4 font-mono text-sm font-bold border-b-2 ${activeTab === 'history'
                                    ? 'bg-white border-blue-500 text-blue-700'
                                    : 'border-transparent text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                History
                            </button>
                            <button
                                onClick={() => { setActiveTab('comments'); setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100); }}
                                className={`flex-1 py-3 px-4 font-mono text-sm font-bold border-b-2 relative ${activeTab === 'comments'
                                    ? 'bg-white border-blue-500 text-blue-700'
                                    : 'border-transparent text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                Chat
                                {comments.length > 0 && (
                                    <span className="ml-1 bg-blue-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
                                        {comments.length}
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* Content */}
                        <div className={`overflow-y-auto ${activeTab === 'comments' ? 'hidden' : 'flex-1'}`}>
                            {activeTab === 'details' ? (
                                <div className="p-4 space-y-4">
                                    {/* Editable fields */}
                                    <div>
                                        <h3 className="font-mono font-bold text-xs text-gray-700 mb-3">
                                            EDITABLE FIELDS
                                        </h3>
                                        {editableFields.map((field) => (
                                            <div key={field} className="mb-3">
                                                <label className="text-xs font-mono text-gray-600 block mb-1">
                                                    {COLUMN_LABELS[field as keyof typeof COLUMN_LABELS]}
                                                </label>
                                                {field === 'comments' ? (
                                                    <textarea
                                                        rows={4}
                                                        value={formData[field] || ''}
                                                        onChange={(e) =>
                                                            setFormData({ ...formData, [field]: e.target.value })
                                                        }
                                                        className="w-full px-2 py-2 border-2 border-gray-300 rounded-2px font-mono text-sm text-gray-900 focus:outline-none focus:border-blue-500 resize-y"
                                                    />
                                                ) : field === 'contract_start_date' || field === 'contract_end_date' || field === 'effective_date' ? (
                                                    <input
                                                        type="date"
                                                        value={formData[field] || ''}
                                                        onChange={(e) =>
                                                            setFormData({ ...formData, [field]: e.target.value })
                                                        }
                                                        className="w-full px-2 py-2 border-2 border-gray-300 rounded-2px font-mono text-sm text-gray-900 focus:outline-none focus:border-blue-500"
                                                    />
                                                ) : (
                                                    <input
                                                        type="text"
                                                        value={formData[field] || ''}
                                                        onChange={(e) =>
                                                            setFormData({ ...formData, [field]: e.target.value })
                                                        }
                                                        className="w-full px-2 py-2 border-2 border-gray-300 rounded-2px font-mono text-sm text-gray-900 focus:outline-none focus:border-blue-500"
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4">
                                    {history.length === 0 ? (
                                        <p className="text-sm text-gray-500 font-mono">No history yet</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {history.map((entry) => (
                                                <div
                                                    key={entry.id}
                                                    className="border-2 border-gray-300 p-3 rounded-2px bg-gray-50"
                                                >
                                                    <div className="flex justify-between mb-2">
                                                        <span className="font-mono text-xs font-bold text-gray-700">
                                                            {entry.changed_by}
                                                        </span>
                                                        <span className="text-xs text-gray-500 font-mono">
                                                            {new Date(entry.created_at + 'Z').toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <div className="space-y-1">
                                                        {Object.entries(entry.changes).map(
                                                            ([field, change]: [string, any]) => (
                                                                <div key={field} className="text-xs font-mono">
                                                                    <span className="font-bold text-gray-900">
                                                                        {COLUMN_LABELS[field as keyof typeof COLUMN_LABELS] || field}
                                                                    </span>
                                                                    <div className="ml-2 mt-1 space-y-1">
                                                                        <div className="text-red-600 line-through">
                                                                            ← {change.from || '(empty)'}
                                                                        </div>
                                                                        <div className="text-green-600">
                                                                            → {change.to || '(empty)'}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Comments tab content */}
                        {activeTab === 'comments' && (
                            <>
                                <div className="flex-1 overflow-y-auto p-4">
                                    {comments.length === 0 ? (
                                        <p className="text-sm text-gray-500 font-mono text-center mt-8">No comments yet. Start the conversation!</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {comments.map((c: any) => {
                                                const currentUser = localStorage.getItem('userEmail') || 'demo@staffing.com';
                                                const isOwn = c.author === currentUser;
                                                return (
                                                    <div key={c.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                                        <div className={`max-w-[80%] rounded-2px p-3 ${isOwn ? 'bg-blue-100 border-2 border-blue-300' : 'bg-gray-100 border-2 border-gray-300'}`}>
                                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                                <span className="font-mono text-xs font-bold text-gray-700">{c.author}</span>
                                                                {isOwn && (
                                                                    <button
                                                                        onClick={() => handleDeleteComment(c.id)}
                                                                        className="text-red-400 hover:text-red-600 text-xs font-bold"
                                                                        title="Delete comment"
                                                                    >
                                                                        ×
                                                                    </button>
                                                                )}
                                                            </div>
                                                            <p className="font-mono text-sm text-gray-900 whitespace-pre-wrap">{c.message}</p>
                                                            <span className="font-mono text-[10px] text-gray-400 mt-1 block">
                                                                {new Date(c.created_at + 'Z').toLocaleString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            <div ref={commentsEndRef} />
                                        </div>
                                    )}
                                </div>
                                {/* Chat input */}
                                <div className="border-t-2 border-gray-800 p-3 bg-gray-100 flex gap-2">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
                                        placeholder="Type a message..."
                                        className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-2px font-mono text-sm text-gray-900 focus:outline-none focus:border-blue-500"
                                    />
                                    <button
                                        onClick={handleSendComment}
                                        disabled={!newMessage.trim()}
                                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-mono font-bold py-2 px-4 rounded-2px border-2 border-blue-800"
                                    >
                                        Send
                                    </button>
                                </div>
                            </>
                        )}

                        {/* Footer - only show Save/Cancel on details/history tabs */}
                        {activeTab !== 'comments' && (
                            <div className="border-t-2 border-gray-800 p-4 bg-gray-100 flex gap-2">
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-mono font-bold py-2 px-4 rounded-2px border-2 border-green-800"
                                >
                                    {isSaving ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                    onClick={handleQueue}
                                    disabled={isQueuing}
                                    className={`flex-1 font-mono font-bold py-2 px-4 rounded-2px border-2 ${queueItemId
                                        ? 'bg-orange-500 hover:bg-orange-600 border-orange-700 text-white'
                                        : 'bg-blue-600 hover:bg-blue-700 border-blue-800 text-white'
                                        } disabled:bg-gray-400`}
                                >
                                    {isQueuing ? '...' : queueItemId ? 'Remove' : 'Queue'}
                                </button>
                                <button
                                    onClick={onClose}
                                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-mono font-bold py-2 px-4 rounded-2px border-2 border-gray-700"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
