import { useState, useEffect } from 'react'
import { MainTable } from './components/MainTable'
import { ViewsPage } from './components/ViewsPage'
import { FiltersPage } from './components/FiltersPage'
import { SettingsPage } from './components/SettingsPage'
import { QueuePage } from './components/QueuePage'
import { SignInPage } from './components/SignInPage'

function App() {
    const [currentPage, setCurrentPage] = useState<'main' | 'views' | 'filters' | 'settings' | 'queue'>('main')
    const [signedIn, setSignedIn] = useState(() => !!localStorage.getItem('userName'))

    useEffect(() => {
        const textFont = localStorage.getItem('fontText');
        const numbersFont = localStorage.getItem('fontNumbers');
        if (textFont) document.documentElement.style.setProperty('--font-text', textFont);
        if (numbersFont) document.documentElement.style.setProperty('--font-numbers', numbersFont);
    }, []);

    if (!signedIn) {
        return <SignInPage onSignIn={() => setSignedIn(true)} />;
    }

    const handleSignOut = () => { localStorage.removeItem('userName'); localStorage.removeItem('userEmail'); setSignedIn(false); };
    const navProps = {
        onNavigateToMain: () => setCurrentPage('main'),
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
                />
            ) : currentPage === 'views' ? (
                <ViewsPage {...navProps} />
            ) : currentPage === 'settings' ? (
                <SettingsPage {...navProps} />
            ) : currentPage === 'queue' ? (
                <QueuePage {...navProps} />
            ) : (
                <FiltersPage {...navProps} />
            )}
        </>
    )
}

export default App
