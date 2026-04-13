import { useState } from 'react'
import { MainTable } from './components/MainTable'
import { ViewsPage } from './components/ViewsPage'
import { FiltersPage } from './components/FiltersPage'
import { SettingsPage } from './components/SettingsPage'

function App() {
    const [currentPage, setCurrentPage] = useState<'main' | 'views' | 'filters' | 'settings'>('main')

    return (
        <>
            {currentPage === 'main' ? (
                <MainTable
                    onNavigateToViews={() => setCurrentPage('views')}
                    onNavigateToFilters={() => setCurrentPage('filters')}
                    onNavigateToSettings={() => setCurrentPage('settings')}
                />
            ) : currentPage === 'views' ? (
                <ViewsPage onBack={() => setCurrentPage('main')} />
            ) : currentPage === 'settings' ? (
                <SettingsPage onBack={() => setCurrentPage('main')} />
            ) : (
                <FiltersPage onBack={() => setCurrentPage('main')} />
            )}
        </>
    )
}

export default App
