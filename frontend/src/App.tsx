import { useState, useEffect } from 'react'
import { MainTable } from './components/MainTable'
import { ViewsPage } from './components/ViewsPage'
import { FiltersPage } from './components/FiltersPage'
import { SettingsPage } from './components/SettingsPage'
import { QueuePage } from './components/QueuePage'

function App() {
    const [currentPage, setCurrentPage] = useState<'main' | 'views' | 'filters' | 'settings' | 'queue'>('main')

    useEffect(() => {
        const textFont = localStorage.getItem('fontText');
        const numbersFont = localStorage.getItem('fontNumbers');
        if (textFont) document.documentElement.style.setProperty('--font-text', textFont);
        if (numbersFont) document.documentElement.style.setProperty('--font-numbers', numbersFont);
    }, []);

    return (
        <>
            {currentPage === 'main' ? (
                <MainTable
                    onNavigateToViews={() => setCurrentPage('views')}
                    onNavigateToFilters={() => setCurrentPage('filters')}
                    onNavigateToSettings={() => setCurrentPage('settings')}
                    onNavigateToQueue={() => setCurrentPage('queue')}
                />
            ) : currentPage === 'views' ? (
                <ViewsPage onBack={() => setCurrentPage('main')} />
            ) : currentPage === 'settings' ? (
                <SettingsPage onBack={() => setCurrentPage('main')} />
            ) : currentPage === 'queue' ? (
                <QueuePage onBack={() => setCurrentPage('main')} />
            ) : (
                <FiltersPage onBack={() => setCurrentPage('main')} />
            )}
        </>
    )
}

export default App
