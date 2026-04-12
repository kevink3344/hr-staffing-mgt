import React, { useState } from 'react'
import { MainTable } from './components/MainTable'
import { ViewsPage } from './components/ViewsPage'
import { FiltersPage } from './components/FiltersPage'

function App() {
    const [currentPage, setCurrentPage] = useState<'main' | 'views' | 'filters'>('main')

    return (
        <>
            {currentPage === 'main' ? (
                <MainTable
                    onNavigateToViews={() => setCurrentPage('views')}
                    onNavigateToFilters={() => setCurrentPage('filters')}
                />
            ) : currentPage === 'views' ? (
                <ViewsPage onBack={() => setCurrentPage('main')} />
            ) : (
                <FiltersPage onBack={() => setCurrentPage('main')} />
            )}
        </>
    )
}

export default App
