import { useState, useEffect, useRef, useMemo, useCallback } from 'react';

export function useVirtualization(items, itemHeight, containerHeight, overscan = 5) {
    const [scrollTop, setScrollTop] = useState(0);
    const scrollingContainerRef = useRef(null);

    const { startIndex, endIndex, totalHeight, offsetY } = useMemo(() => {
        const itemCount = items.length;
        const visibleCount = Math.ceil(containerHeight / itemHeight);

        const start = Math.floor(scrollTop / itemHeight);
        const end = start + visibleCount;

        const startWithOverscan = Math.max(0, start - overscan);
        const endWithOverscan = Math.min(itemCount, end + overscan);

        return {
            startIndex: startWithOverscan,
            endIndex: endWithOverscan,
            totalHeight: itemCount * itemHeight,
            offsetY: startWithOverscan * itemHeight
        };
    }, [items.length, scrollTop, itemHeight, containerHeight, overscan]);

    const visibleItems = useMemo(() => {
        return items.slice(startIndex, endIndex).map((item, idx) => ({
            ...item,
            index: startIndex + idx
        }));
    }, [items, startIndex, endIndex]);

    const handleScroll = useCallback((e) => {
        const scrollTop = e.target.scrollTop;
        setScrollTop(scrollTop);
    }, []);

    useEffect(() => {
        const container = scrollingContainerRef.current;
        if (!container) return;

        container.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            container.removeEventListener('scroll', handleScroll);
        };
    }, [handleScroll]);

    const containerProps = {
        ref: scrollingContainerRef,
        style: {
            height: `${containerHeight}px`,
            overflow: 'auto',
            position: 'relative'
        }
    };

    const viewportProps = {
        style: {
            height: `${totalHeight}px`,
            position: 'relative'
        }
    };

    const itemsWrapperProps = {
        style: {
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
        }
    };

    return {
        visibleItems,
        containerProps,
        viewportProps,
        itemsWrapperProps,
        scrollTop,
        totalItems: items.length,
        visibleRange: { start: startIndex, end: endIndex }
    };
}
