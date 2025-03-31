import { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';

function CandlestickChart({ crypto }) {
    const chartContainerRef = useRef(null);
    const chartRef = useRef(null);

    useEffect(() => {
        if (!crypto.id) return;

        const chart = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight,
            layout: {
                backgroundColor: '#ffffff',
                textColor: '#333',
            },
            grid: {
                vertLines: { color: '#f0f0f0' },
                horzLines: { color: '#f0f0f0' },
            },
        });

        const candlestickSeries = chart.addCandlestickSeries();
        chartRef.current = chart;

        fetch(`/api/crypto/${crypto.id}/candlestick`)
            .then((res) => res.json())
            .then((data) => {
                candlestickSeries.setData(data);
            })
            .catch((err) => console.error('Error fetching chart data:', err));

        const handleResize = () => {
            chart.applyOptions({
                width: chartContainerRef.current.clientWidth,
                height: chartContainerRef.current.clientHeight,
            });
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, [crypto]);

    return (
        <div className="h-[calc(100vh-18rem)]">
            {crypto.id ? (
                <div ref={chartContainerRef} className="w-full h-full" />
            ) : (
                <p className="text-gray-500">Select a cryptocurrency to view its chart.</p>
            )}
        </div>
    );
}

export default CandlestickChart;