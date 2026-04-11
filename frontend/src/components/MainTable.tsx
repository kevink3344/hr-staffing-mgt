import React, { useState, useEffect } from 'react';
import { staffApi, viewsApi } from '../api';
import { STAFF_COLUMNS, StaffRecord, COLUMN_LABELS } from '../constants';
import { getRowColorClass, getCellColorClass } from '../utils';
import { EditFlyout } from './EditFlyout';
import { ImportModal } from './ImportModal';

interface DataTableProps {
    records: StaffRecord[];
    visibleColumns: string[];
    onRowClick: (record: StaffRecord) => void;
}

function DataTable({ records, visibleColumns, onRowClick }: DataTableProps) {
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);
    const topScrollRef = React.useRef<HTMLDivElement>(null);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        if (scrollContainerRef.current && topScrollRef.current) {
            topScrollRef.current.scrollLeft = scrollContainerRef.current.scrollLeft;
        }
    };

    const handleTopScroll = (e: React.UIEvent<HTMLDivElement>) => {
        if (scrollContainerRef.current && topScrollRef.current) {
            scrollContainerRef.current.scrollLeft = topScrollRef.current.scrollLeft;
        }
    };

    return (
        <div className="w-full">
            {/* Top scrollbar (visible, synced) */}
            <div
                ref={topScrollRef}
                onScroll={handleTopScroll}
                className="overflow-x-auto w-full bg-gray-100 border-b-2 border-gray-300"
                style={{ height: '12px' }}
            >
                <div style={{ width: '100%', height: '1px' }} />
            </div>

            {/* Main table with synchronized scroll */}
            <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="overflow-x-auto w-full"
            >
                <table className="w-full font-mono border-collapse border-2 border-gray-800">
                    <thead className="bg-gray-900 text-white sticky top-0 z-10">
                        <tr className="border-b-2 border-gray-800">
                            <th className="border-r-2 border-gray-800 px-3 py-2 text-left text-xs font-bold w-12 min-w-12">
                                #
                            </th>
                            {visibleColumns.map((col) => (
                                <th
                                    key={col}
                                    className="border-r-2 border-gray-800 px-3 py-2 text-left text-xs font-bold whitespace-nowrap min-w-40"
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
                                className={`${getRowColorClass(
                                    record
                                )} border-b-2 border-gray-300 cursor-pointer transition-colors`}
                            >
                                <td className="border-r-2 border-gray-800 px-3 py-2 text-xs text-gray-900 font-bold w-12 min-w-12">
                                    {idx + 1}
                                </td>
                                {visibleColumns.map((col) => (
                                    <td
                                        key={`${record.id}-${col}`}
                                        className={`border-r-2 border-gray-800 px-3 py-2 text-xs text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis min-w-40 ${getCellColorClass(
                                            col,
                                            record
                                        )}`}
                                    >
                                        {record[col] || '—'}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

interface MainTableProps {
    onNavigateToViews: () => void;
}

export function MainTable({ onNavigateToViews }: MainTableProps) {
    const [records, setRecords] = useState<StaffRecord[]>([]);
    const [allRecords, setAllRecords] = useState<StaffRecord[]>([]);
    const [selectedRecord, setSelectedRecord] = useState<StaffRecord | null>(null);
    const [isFlyoutOpen, setIsFlyoutOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentView, setCurrentView] = useState('All Column View');
    const [views, setViews] = useState<any[]>([]);
    const [visibleColumns, setVisibleColumns] = useState<string[]>(STAFF_COLUMNS);
    const [isImportOpen, setIsImportOpen] = useState(false);

    useEffect(() => {
        loadRecords();
        loadViews();
    }, []);

    useEffect(() => {
        if (searchTerm) {
            const filtered = allRecords.filter(
                (record) =>
                    record.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    record.position_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    record.pos_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    record.emp_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    record.last_person_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    record.classroom_assign?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setRecords(filtered);
        } else {
            setRecords(allRecords);
        }
    }, [searchTerm, allRecords]);

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
            setViews(res.data);
        } catch (err) {
            console.error('Failed to load views:', err);
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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen font-mono text-gray-700">
                Loading staff records...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100">
            {/* Header */}
            <header className="bg-gray-900 border-b-4 border-gray-800 p-6 sticky top-0 z-20">
                <div className="max-w-full mx-auto">
                    <div className="flex justify-between items-start gap-4 mb-6">
                        <div>
                            <h1 className="text-3xl font-bold font-mono text-white">HR Staffing</h1>
                            <p className="text-sm text-gray-400 font-mono mt-1">
                                Carroll Middle School – 360 · As of 04/10/2026
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsImportOpen(true)}
                                className="bg-orange-600 hover:bg-orange-700 text-white font-mono font-bold py-2 px-4 rounded-2px border-2 border-orange-800"
                                title="Import Excel data"
                            >
                                📥 Import
                            </button>
                            <button
                                onClick={loadRecords}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-mono font-bold py-2 px-4 rounded-2px border-2 border-blue-800"
                                title="Refresh data"
                            >
                                🔄 Refresh
                            </button>
                            <button
                                onClick={onNavigateToViews}
                                className="bg-purple-600 hover:bg-purple-700 text-white font-mono font-bold py-2 px-4 rounded-2px border-2 border-purple-800"
                                title="Manage views"
                            >
                                ⚙ Views
                            </button>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex gap-4 mb-4 flex-wrap">
                        {/* Search */}
                        <div className="flex-1 min-w-48">
                            <input
                                type="text"
                                placeholder="Search by name, position, pos no, emp no, last person, classroom..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-3 py-2 border-2 border-gray-600 rounded-2px font-mono text-sm bg-slate-800 text-slate-100 placeholder-gray-500 focus:outline-none focus:border-blue-500"
                            />
                        </div>

                        {/* View Selector */}
                        <select
                            value={currentView}
                            onChange={(e) => handleViewChange(e.target.value)}
                            className="px-3 py-2 border-2 border-gray-600 rounded-2px font-mono text-sm bg-slate-800 text-slate-100 focus:outline-none focus:border-blue-500"
                        >
                            {views.map((view) => (
                                <option key={view.id} value={view.name}>
                                    {view.name}
                                </option>
                            ))}
                        </select>

                        {/* Record Count */}
                        <div className="bg-gray-800 border-2 border-gray-600 rounded-2px px-3 py-2 font-mono text-sm">
                            <span className="font-bold text-blue-400">{records.length}</span>
                            <span className="text-gray-400"> records</span>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="flex gap-6 text-xs font-mono">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-yellow-100 border-2 border-yellow-300 rounded-2px" />
                            <span className="text-gray-300">Contract = T/TR</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-red-100 border-2 border-red-300 rounded-2px" />
                            <span className="text-gray-300">Pos End = 2026-06-30</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-green-100 border-2 border-green-300 rounded-2px" />
                            <span className="text-gray-300">Pos Start = 2026-07-01</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Table */}
            <main className="p-6">
                <div className="bg-white rounded-2px border-2 border-gray-800 overflow-x-auto shadow-lg">
                    <DataTable
                        records={records}
                        visibleColumns={visibleColumns}
                        onRowClick={(record) => {
                            setSelectedRecord(record);
                            setIsFlyoutOpen(true);
                        }}
                    />
                </div>
            </main>

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
        </div>
    );
}
