import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { createChart } from 'lightweight-charts';

function CryptoCharts({ crypto }) {
    const chartContainerRef = useRef(null);
    const chartRef = useRef(null);
    const seriesRef = useRef(null);
    const priceRef = useRef(null);
    const [chartType, setChartType] = useState('line');

    useEffect(() => {
        if (!crypto.id) {
            if (chartRef.current) {
                chartRef.current.remove();
                chartRef.current = null;
                seriesRef.current = null;
            }
            priceRef.current = null;
            return;
        }

        axios
            .get(`http://localhost:8002/api/price_history/${crypto.id}`)
            .then((response) => {
                const data = response.data.data || [];
                if (data.length === 0) {
                    if (chartRef.current) {
                        chartRef.current.remove();
                        chartRef.current = null;
                        seriesRef.current = null;
                    }
                    priceRef.current = null;
                    return;
                }

                const chartData = data
                    .map((item) => {
                        const date = new Date(item.date);
                        if (isNaN(date.getTime())) {
                            console.log(`Invalid date for ${crypto.id}:`, item.date);
                            return null;
                        }
                        const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                        const open = parseFloat(item.open) || 0;
                        const high = parseFloat(item.high) || 0;
                        const low = parseFloat(item.low) || 0;
                        const close = parseFloat(item.close) || 0;
                        if (open <= 0 || high <= 0 || low <= 0 || close <= 0) {
                            return null;
                        }
                        return {
                            time: formattedDate,
                            open: open,
                            high: high,
                            low: low,
                            close: close,
                            value: close,
                        };
                    })
                    .filter((item) => item !== null);

                if (chartData.length === 0) {
                    if (chartRef.current) {
                        chartRef.current.remove();
                        chartRef.current = null;
                        seriesRef.current = null;
                    }
                    priceRef.current = null;
                    return;
                }

                chartData.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

                // Initialize chart
                if (!chartRef.current) {
                    chartRef.current = createChart(chartContainerRef.current, {
                        width: chartContainerRef.current.clientWidth,
                        height: 300,
                        timeScale: { timeVisible: true, secondsVisible: false },
                        rightPriceScale: {
                            visible: true,
                            autoScale: true,
                            borderVisible: false,
                        },
                        grid: { vertLines: { visible: true }, horzLines: { visible: true } },
                    });
                }

                if (seriesRef.current) {
                    chartRef.current.removeSeries(seriesRef.current);
                    seriesRef.current = null;
                }

                priceRef.current = chartData.length === 1 ? chartData[0].close : null;

                if (chartType === 'candlestick' && chartData.length > 1) {
                    seriesRef.current = chartRef.current.addCandlestickSeries({
                        upColor: 'rgba(75, 192, 192, 1)',
                        downColor: 'rgba(255, 99, 132, 1)',
                        borderVisible: false,
                        wickUpColor: 'rgba(75, 192, 192, 1)',
                        wickDownColor: 'rgba(255, 99, 132, 1)',
                    });
                    seriesRef.current.setData(chartData);
                } else {
                    seriesRef.current = chartRef.current.addLineSeries({
                        color: 'rgba(75, 192, 192, 1)',
                        lineWidth: 2,
                    });
                    const lineData = chartData.map((item) => ({
                        time: item.time,
                        value: item.value,
                    }));
                    seriesRef.current.setData(lineData);
                }

                chartRef.current.timeScale().fitContent();
                chartRef.current.priceScale().applyOptions({
                    autoScale: true,
                    mode: 0,
                });

                const handleResize = () => {
                    if (chartRef.current) {
                        chartRef.current.resize(chartContainerRef.current.clientWidth, 300);
                    }
                };
                window.addEventListener('resize', handleResize);
                return () => window.removeEventListener('resize', handleResize);
            })
            .catch((error) => {
                if (chartRef.current) {
                    chartRef.current.remove();
                    chartRef.current = null;
                    seriesRef.current = null;
                }
                priceRef.current = null;
            });

        return () => {
            if (chartRef.current) {
                chartRef.current.remove();
                chartRef.current = null;
                seriesRef.current = null;
            }
            priceRef.current = null;
        };
    }, [crypto.id, chartType]);

    const formatPrice = (price) => {
        if (price === null || price === undefined) return 'N/A';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 8,
        }).format(price);
    };

    return (
        <div className="bg-base-100 p-4 rounded-box">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">
                    {crypto.name ? `${crypto.name} Price (30d)` : 'Select a Crypto'}
                </h3>
                <div className="tabs tabs-boxed">
                    <button
                        className={`tab ${chartType === 'line' ? 'tab-active' : ''}`}
                        onClick={() => setChartType('line')}
                    >
                        Line
                    </button>
                    <button
                        className={`tab ${chartType === 'candlestick' ? 'tab-active' : ''}`}
                        onClick={() => setChartType('candlestick')}
                        disabled={priceRef.current !== null} // Disable candlestick for single point
                    >
                        Candlestick
                    </button>
                </div>
            </div>
            <div
                ref={chartContainerRef}
                style={{ height: '300px', width: '100%' }}
                className="relative"
            >
                {(!crypto.id || (!chartRef.current && !priceRef.current)) && (
                    <p className="text-gray-500 text-center absolute inset-0 flex items-center justify-center">
                        {crypto.id ? 'No price data available' : 'Select a cryptocurrency to view chart'}
                    </p>
                )}
                {priceRef.current && (
                    <p className="text-sm text-gray-500 absolute top-2 left-2">
                        Current Price: {formatPrice(priceRef.current)}
                    </p>
                )}
            </div>
        </div>
    );
}

export default CryptoCharts;