import { useState, useEffect } from 'react'
import { MainTable } from './components/MainTable'
import { ViewsPage } from './components/ViewsPage'
import { FiltersPage } from './components/FiltersPage'
import { SettingsPage } from './components/SettingsPage'
import { QueuePage } from './components/QueuePage'
import { SignInPage } from './components/SignInPage'
import { userSettingsApi } from './api'

function App() {
    const [currentPage, setCurrentPage] = useState<'main' | 'views' | 'filters' | 'settings' | 'queue'>('main')
    const [signedIn, setSignedIn] = useState(() => !!localStorage.getItem('userName'))
    const [settingsReady, setSettingsReady] = useState(false)
    const [initialRecordId, setInitialRecordId] = useState<number | undefined>(undefined)

    // Load user settings from API after sign-in
    useEffect(() => {
        if (signedIn) {
            userSettingsApi.getAll().then((res) => {
                const s = res.data;
                if (s.theme) localStorage.setItem('mainUiTheme', s.theme);
                if (s.density) localStorage.setItem('mainUiDensity', s.density);
                setSettingsReady(true);
            }).catch(() => setSettingsReady(true));
        } else {
            setSettingsReady(false);
        }
    }, [signedIn]);

    useEffect(() => {
        const textFont = localStorage.getItem('fontText');
        const numbersFont = localStorage.getItem('fontNumbers');
        if (textFont) document.documentElement.style.setProperty('--font-text', textFont);
        if (numbersFont) document.documentElement.style.setProperty('--font-numbers', numbersFont);
    }, []);

    if (!signedIn) {
        return <SignInPage onSignIn={() => setSignedIn(true)} />;
    }

    if (!settingsReady) {
        return <div className="h-screen flex items-center justify-center bg-slate-900 text-gray-400 font-mono">Loading...</div>;
    }

    const handleSignOut = () => { localStorage.removeItem('userName'); localStorage.removeItem('userEmail'); setSignedIn(false); };
    const navProps = {
        onNavigateToMain: () => { setInitialRecordId(undefined); setCurrentPage('main'); },
        onNavigateToViews: () => setCurrentPage('views'),
        onNavigateToFilters: () => setCurrentPage('filters'),
        onNavigateToSettings: () => setCurrentPage('settings'),
        onNavigateToQueue: () => setCurrentPage('queue'),
        onSignOut: handleSignOut,
    };

    return (
        <>
            {currentPage === 'main' ? (
                <MainTable
                    onNavigateToViews={navProps.onNavigateToViews}
                    onNavigateToFilters={navProps.onNavigateToFilters}
                    onNavigateToSettings={navProps.onNavigateToSettings}
                    onNavigateToQueue={navProps.onNavigateToQueue}
                    onSignOut={handleSignOut}
                    initialRecordId={initialRecordId}
                    onInitialRecordHandled={() => setInitialRecordId(undefined)}
                />
            ) : currentPage === 'views' ? (
                <ViewsPage {...navProps} />
            ) : currentPage === 'settings' ? (
                <SettingsPage {...navProps} />
            ) : currentPage === 'queue' ? (
                <QueuePage {...navProps} onGoToRecord={(id: number) => { setInitialRecordId(id); setCurrentPage('main'); }} />
            ) : (
                <FiltersPage {...navProps} />
            )}
        </>
    )
}

export default App
