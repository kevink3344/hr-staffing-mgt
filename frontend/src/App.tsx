import React from 'react'

function App() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-2px shadow-lg p-8">
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">
                        HR Staffing Management System
                    </h1>
                    <p className="text-gray-600 mb-6">
                        A comprehensive solution for managing HR staffing operations.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="bg-blue-50 p-4 rounded-2px border border-blue-200">
                            <h3 className="font-bold text-blue-900">Frontend</h3>
                            <p className="text-sm text-blue-700">React + TypeScript + Tailwind</p>
                        </div>
                        <div className="bg-indigo-50 p-4 rounded-2px border border-indigo-200">
                            <h3 className="font-bold text-indigo-900">Backend</h3>
                            <p className="text-sm text-indigo-700">Express + SQLite API</p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-2px border border-purple-200">
                            <h3 className="font-bold text-purple-900">API Docs</h3>
                            <p className="text-sm text-purple-700">Swagger/OpenAPI</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default App
