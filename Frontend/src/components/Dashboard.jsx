import { useState, useCallback, useMemo } from 'react';
import { useDataFetch } from '../hooks/useDataFetch';
import VirtualizedList from './VirtualizedList';

function Dashboard() {
    const [isGenerating, setIsGenerating] = useState(false);
    const [generateError, setGenerateError] = useState(null);

    const { data, loading, error, refetch } = useDataFetch('/api/data/records?limit=10000');

    const records = useMemo(() => {
        return data?.data || [];
    }, [data]);

    const stats = useMemo(() => {
        if (!records.length) return null;

        const statusCounts = records.reduce((acc, record) => {
            acc[record.status] = (acc[record.status] || 0) + 1;
            return acc;
        }, {});

        const avgTemp = records.reduce((sum, r) => sum + r.temperature, 0) / records.length;
        const avgHumidity = records.reduce((sum, r) => sum + r.humidity, 0) / records.length;

        return {
            total: records.length,
            statusCounts,
            avgTemp: avgTemp.toFixed(1),
            avgHumidity: avgHumidity.toFixed(1)
        };
    }, [records]);

    const handleGenerateData = useCallback(async () => {
        try {
            setIsGenerating(true);
            setGenerateError(null);

            const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

            const response = await fetch(`${API_BASE_URL}/api/data/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ count: 5000, batchSize: 1000 })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('Generated data:', result);

            await refetch();

        } catch (err) {
            console.error('Error generating data:', err);
            setGenerateError(err.message);
        } finally {
            setIsGenerating(false);
        }
    }, [refetch]);

    const handleDeleteAll = useCallback(async () => {
        if (!window.confirm('Are you sure you want to delete all records?')) {
            return;
        }

        try {
            const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

            const response = await fetch(`${API_BASE_URL}/api/data/records`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            await refetch();

        } catch (err) {
            console.error('Error deleting data:', err);
            alert('Failed to delete data: ' + err.message);
        }
    }, [refetch]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
                    <h2 className="text-red-800 font-semibold mb-2">Error Loading Data</h2>
                    <p className="text-red-600 text-sm mb-4">{error}</p>
                    <button
                        onClick={refetch}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">

            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Real-Time Sensor Data Dashboard
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        High-frequency data monitoring and visualization
                    </p>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">

                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">

                        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
                            <div className="text-sm text-gray-500 mb-1">Total Records</div>
                            <div className="text-2xl font-bold text-gray-900">{stats.total.toLocaleString()}</div>
                        </div>


                        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
                            <div className="text-sm text-gray-500 mb-1">Avg Temperature</div>
                            <div className="text-2xl font-bold text-blue-600">{stats.avgTemp}°C</div>
                        </div>


                        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
                            <div className="text-sm text-gray-500 mb-1">Avg Humidity</div>
                            <div className="text-2xl font-bold text-green-600">{stats.avgHumidity}%</div>
                        </div>


                        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
                            <div className="text-sm text-gray-500 mb-1">Status</div>
                            <div className="text-sm space-y-1">
                                <div>Active: <span className="font-semibold">{stats.statusCounts.active || 0}</span></div>
                                <div>Inactive: <span className="font-semibold">{stats.statusCounts.inactive || 0}</span></div>
                                <div>Error: <span className="font-semibold">{stats.statusCounts.error || 0}</span></div>
                            </div>
                        </div>
                    </div>
                )}


                <div className="flex gap-4 mb-6">
                    <button
                        onClick={handleGenerateData}
                        disabled={isGenerating}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                        {isGenerating ? 'Generating...' : 'Generate 5000 Records'}
                    </button>

                    <button
                        onClick={refetch}
                        disabled={isGenerating}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                        Refresh Data
                    </button>

                    <button
                        onClick={handleDeleteAll}
                        disabled={isGenerating}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                        Delete All
                    </button>
                </div>

                {generateError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <p className="text-red-600 text-sm">{generateError}</p>
                    </div>
                )}


                {records.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-12 text-center border border-gray-200">
                        <p className="text-gray-500 mb-4">No data available</p>
                        <button
                            onClick={handleGenerateData}
                            disabled={isGenerating}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors font-medium"
                        >
                            Generate Sample Data
                        </button>
                    </div>
                ) : (
                    <VirtualizedList data={records} />
                )}
            </main>
        </div>
    );
}

export default Dashboard;
