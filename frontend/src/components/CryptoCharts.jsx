import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { createChart } from 'lightweight-charts';

function CryptoCharts({ crypto }) {
    const chartContainerRef = useRef(null);
    const chartRef = useRef(null);
    const seriesRef = useRef(null);
    const priceRef = useRef(null);
    const [chartType, setChartType] = useState('line'); // Default to line chart
    const [timeRange, setTimeRange] = useState('1M'); // Default to 1 month

    useEffect(() => {
        if (!crypto.id) {
            console.log('No crypto ID provided, clearing chart');
            if (chartRef.current) {
                chartRef.current.remove();
                chartRef.current = null;
                seriesRef.current = null;
            }
            priceRef.current = null;
            return;
        }

        axios
            .get(`http://localhost:8002/api/price_history/${crypto.id}`, {
                params: { range: timeRange }
            })
            .then((response) => {
                console.log(`Price history for ${crypto.id} (${timeRange}):`, response.data.data);
                const data = response.data.data || [];
                if (data.length === 0) {
                    console.log(`No data available for ${crypto.id} (${timeRange})`);
                    if (chartRef.current) {
                        chartRef.current.remove();
                        chartRef.current = null;
                        seriesRef.current = null;
                    }
                    priceRef.current = null;
                    return;
                }

                // Parse and validate data
                const chartData = data
                    .map((item) => {
                        const date = new Date(item.date);
                        if (isNaN(date.getTime())) {
                            console.log(`Invalid date for ${crypto.id}:`, item.date);
                            return null;
                        }
                        const formattedDate = timeRange === '1h'
                            ? date.toISOString().slice(0, 16).replace('T', ' ') // YYYY-MM-DD HH:mm for 1h
                            : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; // YYYY-MM-DD for others
                        const open = parseFloat(item.open) || 0;
                        const high = parseFloat(item.high) || 0;
                        const low = parseFloat(item.low) || 0;
                        const close = parseFloat(item.close) || 0;
                        if (open <= 0 || high <= 0 || low <= 0 || close <= 0) {
                            console.log(`Skipping invalid data point for ${crypto.id}:`, item);
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
                    console.log(`No valid data points after filtering for ${crypto.id} (${timeRange})`);
                    if (chartRef.current) {
                        chartRef.current.remove();
                        chartRef.current = null;
                        seriesRef.current = null;
                    }
                    priceRef.current = null;
                    return;
                }

                // Sort data by time in ascending order
                chartData.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
                console.log(`Sorted chart data for ${crypto.id} (${timeRange}):`, chartData);

                // Initialize chart
                if (!chartRef.current) {
                    chartRef.current = createChart(chartContainerRef.current, {
                        width: chartContainerRef.current.clientWidth,
                        height: 300,
                        timeScale: {
                            timeVisible: true,
                            secondsVisible: false,
                            tickMarkFormatter: (time, tickMarkType, locale) => {
                                const date = new Date(timeRange === '1h' ? time + 'Z' : time);
                                if (timeRange === '1h') {
                                    return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
                                }
                                return `${date.getDate()} ${date.toLocaleString('default', { month: 'short' })}`;
                            },
                        },
                        rightPriceScale: {
                            visible: true,
                            autoScale: true,
                            borderVisible: false,
                        },
                        grid: { vertLines: { visible: true }, horzLines: { visible: true } },
                    });
                }

                // Clear previous series
                if (seriesRef.current) {
                    chartRef.current.removeSeries(seriesRef.current);
                    seriesRef.current = null;
                }

                // Set current price for display (only for single valid point)
                priceRef.current = chartData.length === 1 ? chartData[0].close : null;

                // Render chart based on chartType
                if (chartType === 'candlestick' && chartData.length > 1) {
                    console.log(`Rendering candlestick chart for ${crypto.id} (${timeRange})`);
                    seriesRef.current = chartRef.current.addCandlestickSeries({
                        upColor: 'rgba(75, 192, 192, 1)',
                        downColor: 'rgba(255, 99, 132, 1)',
                        borderVisible: false,
                        wickUpColor: 'rgba(75, 192, 192, 1)',
                        wickDownColor: 'rgba(255, 99, 132, 1)',
                    });
                    seriesRef.current.setData(chartData);
                } else {
                    console.log(`Rendering line chart for ${crypto.id} (${timeRange})`);
                    seriesRef.current = chartRef.current.addLineSeries({
                        color: 'rgba(75, 192, 192, 1)',
                        lineWidth: 2,
                    });
                    const lineData = chartData.map((item) => ({
                        time: item.time,
                        value: item.value,
                    }));
                    console.log(`Line chart data for ${crypto.id} (${timeRange}):`, lineData);
                    seriesRef.current.setData(lineData);
                }

                // Auto-fit price and time scales
                chartRef.current.timeScale().fitContent();
                chartRef.current.priceScale().applyOptions({
                    autoScale: true,
                    mode: 0,
                });

                // Handle resize
                const handleResize = () => {
                    if (chartRef.current) {
                        chartRef.current.resize(chartContainerRef.current.clientWidth, 300);
                    }
                };
                window.addEventListener('resize', handleResize);
                return () => window.removeEventListener('resize', handleResize);
            })
            .catch((error) => {
                console.error(`Error fetching price history for ${crypto.id} (${timeRange}):`, error);
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
    }, [crypto.id, chartType, timeRange]);

    const formatPrice = (price) => {
        if (price === null || price === undefined) return 'N/A';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 8,
        }).format(price);
    };

    const timeRanges = ['1Y', '3M', '1M', '7d', '1d', '1h'];

    return (
        <div className="bg-base-100 p-4 rounded-box">
            <div className="flex justify-between items-center mb-2">
                <div className="flex space-x-2">
                    {timeRanges.map((range) => (
                        <button
                            key={range}
                            className={`btn btn-xs ${timeRange === range ? 'btn-primary' : 'btn-ghost'}`}
                            onClick={() => setTimeRange(range)}
                        >
                            {range}
                        </button>
                    ))}
                </div>
                <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-semibold">
                        {crypto ? `Price : ${formatPrice(crypto.price)}` : 'Select a Crypto'}
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
                            disabled={priceRef.current !== null}
                        >
                            Candlestick
                        </button>
                    </div>
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