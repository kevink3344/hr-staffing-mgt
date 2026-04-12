import React, { useState } from 'react';
import { importApi } from '../api';

interface ImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImportSuccess: () => void;
}

export function ImportModal({ isOpen, onClose, onImportSuccess }: ImportModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [message, setMessage] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
        }
    };

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const res = await importApi.exportExcel();
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement('a');
            a.href = url;
            a.download = 'staff-records-export.xlsx';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            setMessage('✅ Export downloaded!');
        } catch (err) {
            console.error('Export failed:', err);
            setMessage('❌ Export failed');
        } finally {
            setIsExporting(false);
        }
    };

    const handleDeleteAll = async () => {
        if (!window.confirm('⚠️  Delete ALL staff records? This cannot be undone.')) {
            return;
        }
        setIsDeleting(true);
        try {
            const { staffDeleteApi } = await import('../api.js');
            const res = await staffDeleteApi.deleteAll();
            setMessage(`🗑️  Deleted ${res.data.deleted} records!`);
            setTimeout(() => {
                onImportSuccess();
            }, 1000);
        } catch (err) {
            console.error('Delete failed:', err);
            setMessage('❌ Delete failed');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleImport = async () => {
        if (!file) {
            alert('Please select a file');
            return;
        }

        setIsImporting(true);
        try {
            const res = await importApi.uploadExcel(file);
            setMessage(`✅ Successfully imported ${res.data.imported} records!`);
            setTimeout(() => {
                onImportSuccess();
                setFile(null);
                setMessage('');
                onClose();
            }, 1500);
        } catch (err) {
            console.error('Import failed:', err);
            setMessage('❌ Import failed');
        } finally {
            setIsImporting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black bg-opacity-50"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2px border-2 border-gray-800 p-6 w-full max-w-md shadow-xl">
                <h2 className="text-xl font-bold font-mono mb-4 text-gray-900">
                    Import Excel Data
                </h2>

                <div className="mb-4">
                    <label className="block text-sm font-mono font-bold text-gray-700 mb-2">
                        Select Excel File
                    </label>
                    <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileChange}
                        disabled={isImporting}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-2px font-mono text-sm focus:outline-none focus:border-blue-500"
                    />
                    {file && (
                        <p className="text-xs text-gray-600 font-mono mt-2">
                            Selected: {file.name}
                        </p>
                    )}
                </div>

                {message && (
                    <div className="mb-4 p-3 bg-blue-50 border-2 border-blue-300 rounded-2px font-mono text-sm text-blue-900">
                        {message}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={handleImport}
                        disabled={!file || isImporting || isExporting || isDeleting}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-mono font-bold py-2 px-4 rounded-2px border-2 border-green-800"
                    >
                        {isImporting ? 'Importing...' : 'Import'}
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={isImporting || isExporting || isDeleting}
                        title="Export all staff records to Excel"
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-mono font-bold py-2 px-4 rounded-2px border-2 border-blue-800"
                    >
                        {isExporting ? 'Exporting...' : 'Export'}
                    </button>
                    <button
                        onClick={handleDeleteAll}
                        disabled={isImporting || isExporting || isDeleting}
                        title="Delete all staff records (demo reset)"
                        className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-mono font-bold py-2 px-4 rounded-2px border-2 border-red-800"
                    >
                        {isDeleting ? 'Deleting...' : 'Delete All'}
                    </button>
                    <button
                        onClick={onClose}
                        disabled={isImporting || isExporting || isDeleting}
                        className="bg-gray-500 hover:bg-gray-600 text-white font-mono font-bold py-2 px-4 rounded-2px border-2 border-gray-700"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
