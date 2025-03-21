import { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';
import axios from 'axios';

export default function CandlestickChart({ crypto }) {
    const chartContainerRef = useRef(null);
    const chartRef = useRef(null);

    useEffect(() => {
        if (!crypto) return;

        const fetchData = async () => {
            const response = await axios.get(`/api/crypto/${crypto.id}/candlestick`);
            const candlestickData = response.data;

            if (chartContainerRef.current) {
                if (chartRef.current) {
                    chartRef.current.remove();
                }

                const chart = createChart(chartContainerRef.current, {
                    width: chartContainerRef.current.clientWidth,
                    height: 400,
                    timeScale: { timeVisible: true, secondsVisible: false },
                });

                const candlestickSeries = chart.addCandlestickSeries();
                candlestickSeries.setData(candlestickData);

                const volumeSeries = chart.addHistogramSeries({
                    color: '#26a69a',
                    priceFormat: { type: 'volume' },
                    priceScale: { scaleMargins: { top: 0.8, bottom: 0 } },
                });
                volumeSeries.setData(candlestickData.map((d) => ({
                    time: d.time,
                    value: d.volume,
                    color: d.open < d.close ? '#26a69a' : '#ef5350',
                })));

                chartRef.current = chart;

                const handleResize = () => {
                    chart.applyOptions({ width: chartContainerRef.current.clientWidth });
                };
                window.addEventListener('resize', handleResize);
                return () => window.removeEventListener('resize', handleResize);
            }
        };

        fetchData();
    }, [crypto]);

    return (
        <div className="w-3/4 p-4">
            {crypto ? (
                <>
                    <h2 className="text-lg font-bold mb-4">{crypto.name} Daily Chart</h2>
                    <div ref={chartContainerRef} />
                </>
            ) : (
                <p className="text-gray-400">Select a cryptocurrency to view its chart.</p>
            )}
        </div>
    );
}