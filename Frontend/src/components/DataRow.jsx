import React from 'react';


const DataRow = React.memo(({ item }) => {

    const statusColors = {
        active: 'bg-green-100 text-green-800',
        inactive: 'bg-gray-100 text-gray-800',
        error: 'bg-red-100 text-red-800'
    };

    const statusColor = statusColors[item.status] || 'bg-gray-100 text-gray-800';

    const formattedTime = new Date(item.timestamp).toLocaleString();

    return (
        <div className="flex items-center gap-4 p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors">

            <div className="w-32 flex-shrink-0">
                <span className="font-mono text-sm text-gray-600">{item.recordId}</span>
            </div>

            <div className="w-48 flex-shrink-0">
                <span className="text-sm text-gray-500">{formattedTime}</span>
            </div>

            <div className="w-24 flex-shrink-0">
                <div className="text-sm">
                    <span className="font-semibold">{item.temperature.toFixed(1)}°C</span>
                </div>
            </div>

            <div className="w-24 flex-shrink-0">
                <div className="text-sm">
                    <span className="font-semibold">{item.humidity.toFixed(1)}%</span>
                </div>
            </div>

            <div className="w-32 flex-shrink-0">
                <span className="text-sm text-gray-700">{item.location}</span>
            </div>

            <div className="w-24 flex-shrink-0">
                <span className={`px-2 py-1 rounded text-xs font-medium ${statusColor}`}>
                    {item.status}
                </span>
            </div>
        </div>
    );
}, (prevProps, nextProps) => {
    return prevProps.item.recordId === nextProps.item.recordId;
});

DataRow.displayName = 'DataRow';

export default DataRow;
