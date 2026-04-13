import { useState } from 'react'
import { MainTable } from './components/MainTable'
import { ViewsPage } from './components/ViewsPage'
import { FiltersPage } from './components/FiltersPage'
import { SettingsPage } from './components/SettingsPage'
import { QueuePage } from './components/QueuePage'

function App() {
    const [currentPage, setCurrentPage] = useState<'main' | 'views' | 'filters' | 'settings' | 'queue'>('main')

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
