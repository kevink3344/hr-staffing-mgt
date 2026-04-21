import { useState, useEffect, useCallback } from 'react';
import { staffApi, historyApi, queueApi, panelDisplayApi, futureAssignmentsApi } from '../api';
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

interface FutureAssignmentRow {
    id?: number;
    classroom_assign: string;
    pos_no_new: string;
    mos: string;
}

export function EditFlyout({ record, isOpen, onClose, onSave }: EditFlyoutProps) {
    const [activeTab, setActiveTab] = useState<'principal' | 'staff-admin' | 'history'>('principal');
    const [formData, setFormData] = useState<any>(record || {});
    const [history, setHistory] = useState<any[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [queueItemId, setQueueItemId] = useState<number | null>(null);
    const [isQueuing, setIsQueuing] = useState(false);
    const [isPinned, setIsPinned] = useState(() => localStorage.getItem('editFlyoutPinned') === 'true');
    const [futureAssignments, setFutureAssignments] = useState<FutureAssignmentRow[]>([]);
    const [initialFutureAssignments, setInitialFutureAssignments] = useState<FutureAssignmentRow[]>([]);
    const [assignmentsError, setAssignmentsError] = useState('');
    const [panelWidth, setPanelWidth] = useState(() => {
        const saved = localStorage.getItem('editFlyoutWidth');
        return saved ? Math.max(MIN_PANEL_WIDTH, Math.min(MAX_PANEL_WIDTH, parseInt(saved, 10))) : DEFAULT_PANEL_WIDTH;
    });
    const [isDragging, setIsDragging] = useState(false);
    const currentUserEmail = localStorage.getItem('userEmail') || 'demo@staffing.com';
    const isAdmin = currentUserEmail === 'admin@staffing.com';
    const isStaffAdminUser = currentUserEmail === 'testuser2@staffing.com';
    const canSeeStaffAdminTab = isAdmin || isStaffAdminUser;
    const canAccessQueue = isAdmin || isStaffAdminUser;
    const [principalFields, setPrincipalFields] = useState<string[]>([...EDITABLE_FIELDS]);

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
            setActiveTab(isStaffAdminUser ? 'staff-admin' : 'principal');
            setFormData(record);
            setAssignmentsError('');
            loadHistory(record.id);
            if (canAccessQueue) {
                checkQueueStatus(record.id);
            } else {
                setQueueItemId(null);
            }
            loadFutureAssignments(record.id);
        }
    }, [record, canAccessQueue, isStaffAdminUser]);

    useEffect(() => {
        if (!canSeeStaffAdminTab && activeTab === 'staff-admin') {
            setActiveTab('principal');
        }
    }, [activeTab, canSeeStaffAdminTab]);

    useEffect(() => {
        panelDisplayApi.get().then((res) => {
            const fields = res.data?.principal_fields;
            if (Array.isArray(fields)) {
                setPrincipalFields(fields.filter((f: string) => EDITABLE_FIELDS.includes(f as any)));
            }
        }).catch(() => {
            setPrincipalFields([...EDITABLE_FIELDS]);
        });
    }, []);

    const loadHistory = async (recordId: number) => {
        try {
            const res = await historyApi.getByRecordId(recordId);
            setHistory(res.data);
        } catch (err) {
            console.error('Failed to load history:', err);
        }
    };

    const loadFutureAssignments = async (recordId: number) => {
        try {
            const res = await futureAssignmentsApi.getByRecordId(recordId);
            const rows = (res.data || []).map((r: any) => ({
                id: r.id,
                classroom_assign: r.classroom_assign || '',
                pos_no_new: r.pos_no_new || '',
                mos: r.mos || '',
            }));
            setFutureAssignments(rows);
            setInitialFutureAssignments(rows);
        } catch (err) {
            console.error('Failed to load future assignments:', err);
            setFutureAssignments([]);
            setInitialFutureAssignments([]);
        }
    };

    const hasAssignmentChanges = () => JSON.stringify(futureAssignments) !== JSON.stringify(initialFutureAssignments);

    const saveFutureAssignments = async (recordId: number, nextFormData: any) => {
        const futureEmployeeNo = (nextFormData.last_person_no || '').toString().trim();
        if (futureAssignments.length > 0 && !futureEmployeeNo) {
            setAssignmentsError('Enter Future Employee No. before saving assignment rows.');
            throw new Error('Future Employee No required');
        }

        const normalizedRows = futureAssignments
            .map((r) => ({
                classroom_assign: (r.classroom_assign || '').trim(),
                pos_no_new: (r.pos_no_new || '').trim(),
                mos: (r.mos || '').trim(),
            }))
            .filter((r) => r.classroom_assign || r.pos_no_new || r.mos);

        await futureAssignmentsApi.replaceForRecord(recordId, normalizedRows);
        setInitialFutureAssignments(normalizedRows);
        setFutureAssignments(normalizedRows);
        setAssignmentsError('');
    };

    const handleAddAssignmentRow = () => {
        if (!(formData.last_person_no || '').toString().trim()) {
            setAssignmentsError('Enter Future Employee No. before adding assignment rows.');
            return;
        }
        setAssignmentsError('');
        setFutureAssignments((prev) => ([
            ...prev,
            { classroom_assign: '', pos_no_new: '', mos: '' },
        ]));
    };

    const handleRemoveAssignmentRow = (index: number) => {
        if (!window.confirm('Are you sure you want to remove this row?')) {
            return;
        }
        setFutureAssignments((prev) => prev.filter((_, i) => i !== index));
    };

    const handleAssignmentChange = (index: number, key: keyof FutureAssignmentRow, value: string) => {
        setFutureAssignments((prev) => prev.map((row, i) => i === index ? { ...row, [key]: value } : row));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await staffApi.update(record!.id, formData);
            await saveFutureAssignments(record!.id, formData);
            onSave(res.data);
            onClose();
        } catch (err) {
            console.error('Failed to save:', err);
            if (!assignmentsError) {
                alert('Failed to save changes');
            }
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
            const hasRecordChanges = Object.keys(formData).some(k => formData[k] !== (record as any)[k]);
            if (hasRecordChanges) {
                const res = await staffApi.update(record.id, formData);
                onSave(res.data);
            }
            if (hasAssignmentChanges()) {
                await saveFutureAssignments(record.id, formData);
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
                                {canAccessQueue && queueItemId && (
                                    <span className="w-2 h-2 rounded-full bg-blue-500" title="Pending in queue" />
                                )}
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
                        <div className="bg-blue-50 border-b-2 border-blue-200 px-4 py-3">
                            <p className="text-xs text-gray-500 font-mono font-bold tracking-wider mb-1">POSITION</p>
                            <p className="text-sm font-bold font-mono text-gray-900">{record.position_name || '—'}</p>
                            <p className="text-xs text-gray-500 font-mono mt-1">
                                Pos# {record.pos_no || '—'} · {record.classroom_teaching_assignment || '—'}
                            </p>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b-2 border-gray-800 bg-gray-100">
                            <button
                                onClick={() => setActiveTab('principal')}
                                className={`flex-1 py-3 px-4 font-mono text-sm font-bold border-b-2 ${activeTab === 'principal'
                                    ? 'bg-white border-blue-500 text-blue-700'
                                    : 'border-transparent text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                Principal
                            </button>
                            {canSeeStaffAdminTab && (
                                <button
                                    onClick={() => setActiveTab('staff-admin')}
                                    className={`flex-1 py-3 px-4 font-mono text-sm font-bold border-b-2 ${activeTab === 'staff-admin'
                                        ? 'bg-white border-blue-500 text-blue-700'
                                        : 'border-transparent text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    Staff Admin
                                </button>
                            )}
                            <button
                                onClick={() => setActiveTab('history')}
                                className={`flex-1 py-3 px-4 font-mono text-sm font-bold border-b-2 ${activeTab === 'history'
                                    ? 'bg-white border-blue-500 text-blue-700'
                                    : 'border-transparent text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                History
                            </button>
                        </div>

                        {/* Content */}
                        <div className="overflow-y-auto flex-1">
                            {activeTab === 'principal' || activeTab === 'staff-admin' ? (
                                <div className="p-4 space-y-4">
                                    {/* Editable fields */}
                                    <div>
                                        <h3 className="font-mono font-bold text-xs text-gray-700 mb-3">
                                            {activeTab === 'principal' ? 'PRINCIPAL FIELDS' : 'STAFF ADMIN FIELDS'}
                                        </h3>
                                        {(activeTab === 'principal' ? principalFields : editableFields).map((field) => (
                                            <div key={field} className="mb-3">
                                                {field === 'future_assignments' ? (
                                                    <>
                                                        <label className="text-xs font-mono text-gray-600 block mb-1">
                                                            Assignments
                                                        </label>
                                                        <div className="border-2 border-gray-300 rounded-2px p-3 bg-gray-50">
                                                            <div className="text-xs text-gray-500 font-mono mb-2">
                                                                Future Employee No: <span className="font-bold text-gray-900">{(formData.last_person_no || '').toString().trim() || 'Not set'}</span>
                                                            </div>
                                                            {!(formData.last_person_no || '').toString().trim() && (
                                                                <p className="text-xs text-amber-700 font-mono mb-2">
                                                                    Enter Future Employee No. before adding assignment rows.
                                                                </p>
                                                            )}
                                                            {assignmentsError && (
                                                                <p className="text-xs text-red-600 font-mono mb-2">{assignmentsError}</p>
                                                            )}
                                                            {futureAssignments.length > 0 && (
                                                                <div className="grid grid-cols-12 gap-2 mb-2">
                                                                    <div className="col-span-5 text-[10px] text-gray-500 font-mono font-bold">Classroom Assign</div>
                                                                    <div className="col-span-3 text-[10px] text-gray-500 font-mono font-bold">Pos No. (New)</div>
                                                                    <div className="col-span-3 text-[10px] text-gray-500 font-mono font-bold">Mos.</div>
                                                                    <div className="col-span-1"></div>
                                                                </div>
                                                            )}
                                                            <div className="space-y-2">
                                                                {futureAssignments.map((row, idx) => (
                                                                    <div key={`${idx}-${row.id || 'new'}`} className="grid grid-cols-12 gap-2 items-end">
                                                                        <div className="col-span-5">
                                                                            <input
                                                                                type="text"
                                                                                value={row.classroom_assign}
                                                                                onChange={(e) => handleAssignmentChange(idx, 'classroom_assign', e.target.value)}
                                                                                className="w-full px-2 py-2 border-0 border-b-2 border-gray-300 bg-transparent font-mono text-sm text-gray-900 focus:outline-none focus:border-blue-500"
                                                                            />
                                                                        </div>
                                                                        <div className="col-span-3">
                                                                            <input
                                                                                type="text"
                                                                                value={row.pos_no_new}
                                                                                onChange={(e) => handleAssignmentChange(idx, 'pos_no_new', e.target.value)}
                                                                                className="w-full px-2 py-2 border-0 border-b-2 border-gray-300 bg-transparent font-mono text-sm text-gray-900 focus:outline-none focus:border-blue-500"
                                                                            />
                                                                        </div>
                                                                        <div className="col-span-3">
                                                                            <input
                                                                                type="text"
                                                                                value={row.mos}
                                                                                onChange={(e) => handleAssignmentChange(idx, 'mos', e.target.value)}
                                                                                className="w-full px-2 py-2 border-0 border-b-2 border-gray-300 bg-transparent font-mono text-sm text-gray-900 focus:outline-none focus:border-blue-500"
                                                                            />
                                                                        </div>
                                                                        <div className="col-span-1">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleRemoveAssignmentRow(idx)}
                                                                                className="w-full text-red-600 hover:text-red-800 font-bold text-lg leading-none py-2"
                                                                                title="Remove row"
                                                                            >
                                                                                ×
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                                {futureAssignments.length === 0 && (
                                                                    <p className="text-xs text-gray-500 font-mono">No assignment rows yet.</p>
                                                                )}
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={handleAddAssignmentRow}
                                                                className="mt-3 font-mono font-bold text-sm text-gray-500 hover:text-gray-700 disabled:text-gray-400"
                                                            >
                                                                + Add Row
                                                            </button>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
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
                                                        ) : field === 'contract_type' ? (
                                                            <div className="inline-flex border-2 border-gray-300 rounded-2px overflow-hidden">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setFormData({ ...formData, contract_type: 'Certified' })}
                                                                    className={`px-3 py-2 text-sm font-mono font-bold ${formData.contract_type === 'Certified'
                                                                        ? 'bg-blue-600 text-white'
                                                                        : 'bg-white text-gray-700 hover:bg-gray-100'
                                                                        }`}
                                                                >
                                                                    Certified
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setFormData({ ...formData, contract_type: 'Non-Certified' })}
                                                                    className={`px-3 py-2 text-sm font-mono font-bold border-l-2 border-gray-300 ${formData.contract_type === 'Non-Certified'
                                                                        ? 'bg-blue-600 text-white'
                                                                        : 'bg-white text-gray-700 hover:bg-gray-100'
                                                                        }`}
                                                                >
                                                                    Non-Certified
                                                                </button>
                                                            </div>
                                                        ) : field === 'track_new' ? (
                                                            <select
                                                                value={formData[field] || ''}
                                                                onChange={(e) =>
                                                                    setFormData({ ...formData, [field]: e.target.value })
                                                                }
                                                                className="w-full px-2 py-2 border-2 border-gray-300 rounded-2px font-mono text-sm text-gray-900 focus:outline-none focus:border-blue-500 bg-white"
                                                            >
                                                                <option value="">Select track...</option>
                                                                <option value="Track 1">Track 1</option>
                                                                <option value="Track 2">Track 2</option>
                                                                <option value="Track 3">Track 3</option>
                                                                <option value="Track 4">Track 4</option>
                                                            </select>
                                                        ) : (
                                                            <input
                                                                type="text"
                                                                value={formData[field] || ''}
                                                                onChange={(e) => {
                                                                    setFormData({ ...formData, [field]: e.target.value });
                                                                    if (field === 'last_person_no') setAssignmentsError('');
                                                                }}
                                                                className="w-full px-2 py-2 border-2 border-gray-300 rounded-2px font-mono text-sm text-gray-900 focus:outline-none focus:border-blue-500"
                                                            />
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                        {activeTab === 'principal' && principalFields.length === 0 && (
                                            <p className="text-sm text-gray-500 font-mono">
                                                No fields are currently visible for Principal. Configure Panel Display in Administration.
                                            </p>
                                        )}
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
                                                                    {field === 'future_assignments' ? (
                                                                        <div className="ml-2 mt-1 space-y-1">
                                                                            <div className="text-red-600 line-through">
                                                                                ← {(() => { try { return `${JSON.parse(change.from || '[]').length} row(s)`; } catch { return '(empty)'; } })()}
                                                                            </div>
                                                                            <div className="text-green-600">
                                                                                → {(() => { try { return `${JSON.parse(change.to || '[]').length} row(s)`; } catch { return '(empty)'; } })()}
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="ml-2 mt-1 space-y-1">
                                                                            <div className="text-red-600 line-through">
                                                                                ← {change.from || '(empty)'}
                                                                            </div>
                                                                            <div className="text-green-600">
                                                                                → {change.to || '(empty)'}
                                                                            </div>
                                                                        </div>
                                                                    )}
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

                        {/* Footer */}
                        <div className="border-t-2 border-gray-800 p-4 bg-gray-100 flex gap-2">
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-mono font-bold py-2 px-4 rounded-2px border-2 border-green-800"
                            >
                                {isSaving ? 'Saving...' : 'Save'}
                            </button>
                            {canAccessQueue && (
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
                            )}
                            <button
                                onClick={onClose}
                                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-mono font-bold py-2 px-4 rounded-2px border-2 border-gray-700"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
