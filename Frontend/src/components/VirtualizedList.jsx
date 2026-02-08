import { useMemo } from 'react';
import { useVirtualization } from '../hooks/useVirtualization';
import DataRow from './DataRow';

function VirtualizedList({ data }) {

    const ITEM_HEIGHT = 72;
    const CONTAINER_HEIGHT = 600;
    const OVERSCAN = 10;

    const {
        visibleItems,
        containerProps,
        viewportProps,
        itemsWrapperProps,
        visibleRange
    } = useVirtualization(data, ITEM_HEIGHT, CONTAINER_HEIGHT, OVERSCAN);

    const header = useMemo(() => (
        <div className="sticky top-0 z-10 bg-gray-100 border-b-2 border-gray-300">
            <div className="flex items-center gap-4 p-4 font-semibold text-sm text-gray-700">
                <div className="w-32 flex-shrink-0">Record ID</div>
                <div className="w-48 flex-shrink-0">Timestamp</div>
                <div className="w-24 flex-shrink-0">Temperature</div>
                <div className="w-24 flex-shrink-0">Humidity</div>
                <div className="w-32 flex-shrink-0">Location</div>
                <div className="w-24 flex-shrink-0">Status</div>
            </div>
        </div>
    ), []);

    return (
        <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
            {header}

            <div {...containerProps} className="bg-white">
                <div {...viewportProps}>
                    <div {...itemsWrapperProps}>
                        {visibleItems.map((item) => (
                            <DataRow key={item.recordId} item={item} />
                        ))}
                    </div>
                </div>
            </div>

            <div className="p-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
                Displaying {visibleRange.start + 1}-{visibleRange.end} of {data.length} records
            </div>
        </div>
    );
}

export default VirtualizedList;
