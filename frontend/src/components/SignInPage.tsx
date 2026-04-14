import { useState, useEffect } from 'react';
import { staffApi, filtersApi } from '../api';

interface SignInPageProps {
    onSignIn: (user: string) => void;
}

const USERS = [
    { value: 'testuser1', label: 'Test User 1', email: 'testuser1@staffing.com' },
    { value: 'testuser2', label: 'Test User 2', email: 'testuser2@staffing.com' },
    { value: 'administrator', label: 'Administrator', email: 'admin@staffing.com' },
];

export function SignInPage({ onSignIn }: SignInPageProps) {
    const [selectedUser, setSelectedUser] = useState('');
    const [counts, setCounts] = useState({ contracts: 0, posEnding: 0, posStarting: 0 });

    useEffect(() => {
        Promise.all([staffApi.getAll(), filtersApi.getAll('system')]).then(([staffRes, filtersRes]) => {
            const records = staffRes.data as any[];
            const filters = (filtersRes.data as any[]).filter((f: any) => f.is_system === 1);
            const countForFilter = (f: any) => {
                const values: string[] = JSON.parse(f.column_value);
                return records.filter((r) => {
                    const val = (r[f.column_name] || '').toString().trim();
                    return values.some((v) => val.toLowerCase() === v.toLowerCase());
                }).length;
            };
            setCounts({
                contracts: filters[0] ? countForFilter(filters[0]) : 0,
                posEnding: filters[1] ? countForFilter(filters[1]) : 0,
                posStarting: filters[2] ? countForFilter(filters[2]) : 0,
            });
        }).catch(() => { });
    }, []);

    const handleSignIn = () => {
        if (!selectedUser) return;
        const user = USERS.find((u) => u.value === selectedUser)!;
        localStorage.setItem('userEmail', user.email);
        localStorage.setItem('userName', user.label);
        onSignIn(selectedUser);
    };

    return (
        <div className="min-h-screen flex flex-col md:flex-row">
            {/* Left Side */}
            <div className="w-full md:w-1/2 bg-gradient-to-b from-slate-700 to-slate-900 text-white flex flex-col justify-center px-8 py-12 md:px-16">
                <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center text-sm font-bold mb-10">
                    HR
                </div>
                <p className="text-xs tracking-[0.3em] uppercase text-slate-400 mb-4">
                    Enterprise Staff Support
                </p>
                <h1 className="text-4xl font-bold leading-tight mb-6">
                    Sign in to<br />HR Staffing
                </h1>
                <p className="text-slate-400 text-sm mb-12 max-w-md">
                    Select a user account to access the staffing workspace. View and manage staff records, contracts, and positions.
                </p>
                <div className="flex flex-wrap gap-4">
                    <div className="bg-slate-800 border border-slate-600 px-6 py-4 min-w-[120px]">
                        <span className="text-3xl font-bold font-numbers">{counts.contracts}</span>
                        <p className="text-xs tracking-[0.2em] uppercase text-slate-400 mt-1">Contract T/TR</p>
                    </div>
                    <div className="bg-slate-800 border border-slate-600 px-6 py-4 min-w-[120px]">
                        <span className="text-3xl font-bold font-numbers">{counts.posEnding}</span>
                        <p className="text-xs tracking-[0.2em] uppercase text-slate-400 mt-1">End 06-30</p>
                    </div>
                    <div className="bg-slate-800 border border-slate-600 px-6 py-4 min-w-[120px]">
                        <span className="text-3xl font-bold font-numbers">{counts.posStarting}</span>
                        <p className="text-xs tracking-[0.2em] uppercase text-slate-400 mt-1">Begin 07-01</p>
                    </div>
                </div>
            </div>

            {/* Right Side */}
            <div className="w-full md:w-1/2 bg-gray-100 flex flex-col justify-center px-8 py-12 md:px-16">
                <div className="max-w-md mx-auto w-full">
                    <div className="flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-slate-500 mb-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Authentication
                    </div>
                    <h2 className="text-3xl font-bold text-slate-800 mb-8">Sign In</h2>

                    <div className="bg-white border border-gray-200 p-6 mb-6">
                        <label className="block text-sm text-slate-600 mb-2">Select User</label>
                        <select
                            value={selectedUser}
                            onChange={(e) => setSelectedUser(e.target.value)}
                            className="w-full border border-gray-300 bg-white px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
                        >
                            <option value="">Choose a user...</option>
                            {USERS.map((u) => (
                                <option key={u.value} value={u.value}>{u.label}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={handleSignIn}
                        disabled={!selectedUser}
                        className="w-full bg-blue-600 text-white py-3 text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        Sign In
                    </button>
                </div>
            </div>
        </div>
    );
}
