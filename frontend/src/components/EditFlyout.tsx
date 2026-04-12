import React, { useState, useEffect } from 'react';
import { staffApi, historyApi } from '../api';
import { COLUMN_LABELS, EDITABLE_FIELDS, StaffRecord } from '../constants';

interface EditFlyoutProps {
    record: StaffRecord | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (record: StaffRecord) => void;
}

export function EditFlyout({ record, isOpen, onClose, onSave }: EditFlyoutProps) {
    const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');
    const [formData, setFormData] = useState<any>(record || {});
    const [history, setHistory] = useState<any[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (record) {
            setFormData(record);
            loadHistory(record.id);
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

    console.log('[EditFlyout] isOpen:', isOpen, 'record:', record ? record.employee_name : 'null');

    if (!isOpen || !record) {
        return null;
    }

    const editableFields = EDITABLE_FIELDS;

    return (
        <>
            {isOpen && (
                <div className="fixed inset-0 z-50">
                    {/* Overlay */}
                    <div
                        className="absolute inset-0 bg-black bg-opacity-50 z-40"
                        onClick={onClose}
                    />

                    {/* Panel - positioned on the right */}
                    <div className="absolute top-0 right-0 bottom-0 w-96 bg-white shadow-2xl flex flex-col border-l-2 border-gray-800 z-50">
                        {/* Header */}
                        <div className="bg-gray-900 text-white p-4 border-b-2 border-gray-800">
                            <h2 className="text-lg font-bold font-mono">{record.employee_name}</h2>
                            <p className="text-xs text-gray-300 mt-1">
                                {record.position_name || 'No position assigned'}
                            </p>
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 text-white hover:text-gray-200 text-2xl leading-none"
                            >
                                ×
                            </button>
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
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto">
                            {activeTab === 'details' ? (
                                <div className="p-4 space-y-4">
                                    {/* Position name only */}
                                    <div className="bg-gray-100 p-3 rounded-2px border-2 border-gray-300">
                                        <label className="text-xs font-mono text-gray-600">
                                            {COLUMN_LABELS.position_name}
                                        </label>
                                        <div className="text-sm font-mono text-gray-900 mt-1">
                                            {formData.position_name || '—'}
                                        </div>
                                    </div>

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
                                                <input
                                                    type="text"
                                                    value={formData[field] || ''}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, [field]: e.target.value })
                                                    }
                                                    className="w-full px-2 py-2 border-2 border-gray-300 rounded-2px font-mono text-sm text-gray-900 focus:outline-none focus:border-blue-500"
                                                />
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
                                                            {new Date(entry.created_at).toLocaleString()}
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

                        {/* Footer */}
                        <div className="border-t-2 border-gray-800 p-4 bg-gray-100 flex gap-2">
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-mono font-bold py-2 px-4 rounded-2px border-2 border-green-800"
                            >
                                {isSaving ? 'Saving...' : 'Save'}
                            </button>
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
