import { useState, useEffect } from 'react';
import { Grip, X, Clock, Settings2, Download, Settings, Pin, Sun, Moon, Rows4, User, LogOut } from 'lucide-react';
import { userSettingsApi } from '../api';

interface AppHeaderProps {
    title: string;
    subtitle?: string;
    onNavigateToMain: () => void;
    onNavigateToViews: () => void;
    onNavigateToFilters: () => void;
    onNavigateToSettings: () => void;
    onNavigateToQueue: () => void;
    onSignOut: () => void;
    onImport?: () => void;
    onActivityFeed?: () => void;
    showPinnedOnly?: boolean;
    onTogglePinned?: () => void;
    pinnedCount?: number;
    density?: 'comfortable' | 'compact' | 'very-compact';
    onDensityChange?: (d: 'comfortable' | 'compact' | 'very-compact') => void;
}

export function AppHeader({
    title,
    subtitle,
    onNavigateToMain,
    onNavigateToViews,
    onNavigateToFilters,
    onNavigateToSettings,
    onNavigateToQueue,
    onSignOut,
    onImport,
    onActivityFeed,
    showPinnedOnly = false,
    onTogglePinned,
    pinnedCount = 0,
    density: densityProp,
    onDensityChange,
}: AppHeaderProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [theme, setThemeState] = useState<'dark' | 'light'>('dark');
    const isDark = theme === 'dark';

    const [density, setDensityState] = useState<'comfortable' | 'compact' | 'very-compact'>('compact');
    const [showDensitySlider, setShowDensitySlider] = useState(false);
    const [settingsLoaded, setSettingsLoaded] = useState(false);

    useEffect(() => {
        userSettingsApi.getAll().then((res) => {
            const s = res.data;
            if (s.theme) setThemeState(s.theme as 'dark' | 'light');
            if (s.density) setDensityState(s.density as any);
            setSettingsLoaded(true);
        }).catch(() => setSettingsLoaded(true));
    }, []);

    const loggedInUser = localStorage.getItem('userEmail') || 'demo@staffing.com';

    const userIconColor = (() => {
        switch (loggedInUser) {
            case 'testuser1@staffing.com': return 'text-blue-400';
            case 'testuser2@staffing.com': return 'text-green-400';
            case 'admin@staffing.com': return 'text-red-400';
            default: return isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700';
        }
    })();

    const setTheme = (t: 'dark' | 'light') => {
        setThemeState(t);
        userSettingsApi.set('theme', t).catch(() => { });
    };

    const currentDensity = densityProp ?? density;
    const setDensity = (d: 'comfortable' | 'compact' | 'very-compact') => {
        if (onDensityChange) onDensityChange(d);
        else {
            setDensityState(d);
            userSettingsApi.set('density', d).catch(() => { });
        }
    };

    return (
        <>
            {/* Left Slide-out Menu */}
            {isMenuOpen && (
                <>
                    <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsMenuOpen(false)} />
                    <div className={`fixed top-0 left-0 h-full w-full sm:w-56 z-50 border-r-4 flex flex-col ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'}`}>
                        <div className="flex items-center justify-between p-4 border-b-2 border-gray-600">
                            <span className="font-mono font-bold text-lg">Menu</span>
                            <button onClick={() => setIsMenuOpen(false)} className={`h-8 w-8 flex items-center justify-center rounded-2px ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>
                                <X size={20} strokeWidth={2.5} />
                            </button>
                        </div>
                        <nav className="flex flex-col p-2 gap-0.5">
                            <button
                                onClick={() => { onNavigateToMain(); setIsMenuOpen(false); }}
                                className={`flex items-center gap-2 px-3 py-2 rounded-2px font-mono font-bold text-sm text-left transition-colors ${isDark ? 'text-gray-300 hover:bg-slate-800' : 'text-gray-700 hover:bg-gray-100'}`}
                            >
                                ← Back to Table
                            </button>
                            {onActivityFeed && (
                                <button
                                    onClick={() => { onActivityFeed(); setIsMenuOpen(false); }}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-2px font-mono font-bold text-sm text-left transition-colors ${isDark ? 'text-emerald-300 hover:bg-slate-800' : 'text-emerald-700 hover:bg-gray-100'}`}
                                >
                                    <Clock size={18} strokeWidth={2.5} />
                                    Activity Feed
                                </button>
                            )}
                            <button
                                onClick={() => { onNavigateToViews(); setIsMenuOpen(false); }}
                                className={`flex items-center gap-2 px-3 py-2 rounded-2px font-mono font-bold text-sm text-left transition-colors ${isDark ? 'text-violet-300 hover:bg-slate-800' : 'text-violet-700 hover:bg-gray-100'}`}
                            >
                                <Settings2 size={18} strokeWidth={2.5} />
                                Manage Views
                            </button>
                            {onImport && (
                                <button
                                    onClick={() => { onImport(); setIsMenuOpen(false); }}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-2px font-mono font-bold text-sm text-left transition-colors ${isDark ? 'text-orange-300 hover:bg-slate-800' : 'text-orange-700 hover:bg-gray-100'}`}
                                >
                                    <Download size={18} strokeWidth={2.5} />
                                    Import Excel Data
                                </button>
                            )}
                            <button
                                onClick={() => { onNavigateToSettings(); setIsMenuOpen(false); }}
                                className={`flex items-center gap-2 px-3 py-2 rounded-2px font-mono font-bold text-sm text-left transition-colors ${isDark ? 'text-blue-300 hover:bg-slate-800' : 'text-blue-700 hover:bg-gray-100'}`}
                            >
                                <Settings size={18} strokeWidth={2.5} />
                                Settings
                            </button>
                            <button
                                onClick={() => { onNavigateToQueue(); setIsMenuOpen(false); }}
                                className={`flex items-center gap-2 px-3 py-2 rounded-2px font-mono font-bold text-sm text-left transition-colors ${isDark ? 'text-cyan-300 hover:bg-slate-800' : 'text-cyan-700 hover:bg-gray-100'}`}
                            >
                                <Clock size={18} strokeWidth={2.5} />
                                Queue
                            </button>
                            <hr className={`my-1 ${isDark ? 'border-slate-700' : 'border-gray-200'}`} />
                            <button
                                onClick={() => { onSignOut(); setIsMenuOpen(false); }}
                                className={`flex items-center gap-2 px-3 py-2 rounded-2px font-mono font-bold text-sm text-left transition-colors ${isDark ? 'text-red-400 hover:bg-slate-800' : 'text-red-600 hover:bg-gray-100'}`}
                            >
                                <LogOut size={18} strokeWidth={2.5} />
                                Sign Out
                            </button>
                        </nav>
                    </div>
                </>
            )}

            {/* Header */}
            <header
                className={`border-b-4 p-3 sm:p-6 shrink-0 ${isDark
                    ? 'bg-gray-900 border-gray-800'
                    : 'bg-white border-gray-300'
                    }`}
            >
                <div className="max-w-full mx-auto">
                    <div className="flex flex-wrap justify-between items-start gap-2 sm:gap-4">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                            <button
                                onClick={() => setIsMenuOpen(true)}
                                aria-label="Open menu"
                                className={`h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-2px ${isDark ? 'text-gray-300 hover:text-white hover:bg-slate-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
                                title="Menu"
                            >
                                <Grip size={20} strokeWidth={2.5} />
                            </button>
                            <div className="min-w-0">
                                <h1 className={`text-base sm:text-xl font-bold font-mono truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {title}
                                </h1>
                                {subtitle && (
                                    <p className={`text-[10px] sm:text-xs font-mono mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {subtitle}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className={`fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around py-2 border-t-2 sm:static sm:border-t-0 sm:py-0 sm:gap-2 sm:w-auto sm:justify-end sm:flex-shrink-0 ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'}`}>
                            {onTogglePinned && (
                                <button
                                    onClick={onTogglePinned}
                                    aria-label="Toggle pinned only"
                                    className={`font-mono font-bold h-10 w-10 flex items-center justify-center text-xl relative ${showPinnedOnly
                                        ? 'text-red-800'
                                        : isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                    title={showPinnedOnly ? 'Show all records' : 'Show pinned only'}
                                >
                                    <Pin size={20} strokeWidth={2.5} fill={showPinnedOnly ? 'currentColor' : 'none'} />
                                    {pinnedCount > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-red-800 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                                            {pinnedCount}
                                        </span>
                                    )}
                                </button>
                            )}
                            <button
                                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                                aria-label="Toggle light/dark surrounding UI"
                                className={`font-mono font-bold h-10 w-10 flex items-center justify-center text-xl ${isDark
                                    ? 'text-yellow-300 hover:text-yellow-200'
                                    : 'text-slate-700 hover:text-slate-900'
                                    }`}
                                title="Toggle light/dark surrounding UI"
                            >
                                {isDark ? (
                                    <Sun size={20} strokeWidth={2.5} />
                                ) : (
                                    <Moon size={20} strokeWidth={2.5} />
                                )}
                            </button>
                            <div className="relative">
                                <button
                                    onClick={() => setShowDensitySlider(!showDensitySlider)}
                                    aria-label="Row density"
                                    className={`font-mono font-bold h-10 w-10 flex items-center justify-center text-xl ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                                    title="Row density"
                                >
                                    <Rows4 size={20} strokeWidth={2.5} />
                                </button>
                                {showDensitySlider && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setShowDensitySlider(false)} />
                                        <div className={`absolute right-0 top-full mt-1 z-50 rounded-2px border-2 shadow-lg p-3 ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-800'}`}>
                                            <div className="flex flex-col items-center gap-1" style={{ width: '36px', height: '100px' }}>
                                                {(['comfortable', 'compact', 'very-compact'] as const).map((d) => (
                                                    <button
                                                        key={d}
                                                        onClick={() => { setDensity(d); setShowDensitySlider(false); }}
                                                        className={`w-full flex-1 rounded-2px text-[9px] font-mono font-bold flex items-center justify-center transition-colors ${currentDensity === d
                                                            ? 'bg-blue-600 text-white'
                                                            : isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                            }`}
                                                        title={d}
                                                    >
                                                        {d === 'comfortable' ? '▁' : d === 'compact' ? '▃' : '▅'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="relative group">
                                <button
                                    aria-label="User"
                                    className={`font-mono font-bold h-10 w-10 flex items-center justify-center text-xl ${userIconColor}`}
                                    title={loggedInUser}
                                >
                                    <User size={20} strokeWidth={2.5} />
                                </button>
                                <div className={`absolute right-0 top-full mt-1 px-3 py-2 rounded-2px font-mono text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-900 text-white'}`}>
                                    {loggedInUser}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>
        </>
    );
}
