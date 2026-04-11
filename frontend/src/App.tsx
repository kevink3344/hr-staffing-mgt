import React, { useState } from 'react'
import { MainTable } from './components/MainTable'
import { ViewsPage } from './components/ViewsPage'

function App() {
    const [currentPage, setCurrentPage] = useState<'main' | 'views'>('main')

    return (
        <>
            {currentPage === 'main' ? (
                <MainTable onNavigateToViews={() => setCurrentPage('views')} />
            ) : (
                <ViewsPage onBack={() => setCurrentPage('main')} />
            )}
        </>
    )
}

export default App
