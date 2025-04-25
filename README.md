# Crypto Tracker

## Overview
Crypto Tracker is a web application that allows users to monitor cryptocurrency prices and trends. Built with a React frontend and FastAPI backend, it integrates with the Token Metrics API to fetch real-time and historical price data. Users can search for cryptocurrencies, add them to a watchlist, view price charts with various time ranges, and manage their watchlist with drag-and-drop functionality. The app features a clean, responsive UI with light/dark theme support.

**Note:** This project is still a work in progress. While core features are functional, some areas (like data availability for certain coins and additional features) are under development.

## Current Status

### What's Working
- **Search Bar**: Users can search for cryptocurrencies using `/api/coins` and `/api/search/{query}` endpoints. The search bar clears its value after adding a coin or clicking outside.
- **Watchlist**: Users can add coins (e.g., `XRP` ID `3369`, `WXRP` ID `18907`) to a watchlist via `/api/watchlist`. The watchlist supports drag-and-drop reordering (300px width) and includes icons (`Bars3Icon`, `TrashIcon`, `PlusCircleIcon`).
- **Price Charts**: The chart panel displays price history using `lightweight-charts` with `Line` and `Candlestick` views. Time range filters (`1Y`, `3M`, `1M`, `7d`, `1d`, `1h`) allow users to view historical data from `/v2/daily-ohlcv` and `/v2/hourly-ohlcv`.
- **Theme Toggle**: Light/dark theme switching is fully functional.
- **Responsive UI**: The app uses DaisyUI for styling, with tabs (`Line`, `Candlestick`) on the top-right and filters on the top-left of the chart panel.

### What's Not Working
- **Data Availability**: Some coins (e.g., `WXRP` ID `18907`) lack recent OHLC data (last data point: 2025-04-10). Shorter ranges (`7d`, `1d`, `1h`) fall back to `/v2/price` (e.g., `$2.24` on 2025-04-23) if no historical data is available. This needs better handling or an alternative data source.
- **Market Overview**: Integration with `/v2/market-metrics` for a market overview chart is not yet implemented.
- **Performance**: API calls are made per coin and range change without caching, which may lead to slow responses for large watchlists.
- **Additional Features**: Features like a clear button in the search bar, chart zooming, or more time ranges (e.g., `3d`) are not yet implemented.

## Installation and Running

### Prerequisites
- **Docker**: Ensure Docker and Docker Compose are installed on your system.
- **Token Metrics API Key**: Obtain an API key from Token Metrics and set it in your environment variables.

### Steps
1. **Clone the Repository**:
   ```bash
   git clone <repository-url>
   cd crypto-tracker
   ```

2. **Set Up Environment Variables**:
   - For ease of use, I’ve included my `.env` file in the `backend` directory. It contains the Token Metrics API key:
     ```
     TOKEN_METRICS_API_KEY=your_api_key_here
     ```
   - If you need to use your own API key, replace the value in `backend/.env`.

3. **Build and Run with Docker Compose**:
   ```bash
   docker-compose down --volumes
   docker-compose build --no-cache
   docker-compose up
   ```
   - The app will be available at `http://localhost:8002`.

4. **Access the App**:
   - Open your browser and navigate to `http://localhost:8002`.
   - Search for a cryptocurrency (e.g., "XRP"), add it to the watchlist, and view its price chart.

### Project Structure
- `backend/main.py`: FastAPI backend with endpoints (`/api/coins`, `/api/search`, `/api/watchlist`, `/api/price_history`).
- `frontend/src/components/SearchBar.jsx`: Search bar component for adding coins.
- `frontend/src/components/CryptoCharts.jsx`: Chart panel with time range filters and `Line`/`Candlestick` views.
- `frontend/src/components/CryptoList.jsx`: Watchlist component with drag-and-drop.
- `frontend/src/App.jsx`: Main app component integrating all features.

### Troubleshooting
- **No Data for Some Coins**: If a coin (e.g., `WXRP`) shows "No price data available" for recent ranges, it may lack recent data in Token Metrics. Check logs for details.
- **API Errors**: Ensure your Token Metrics API key is valid and has sufficient quota.
- **Frontend Errors**: Open DevTools Console to check for errors (e.g., `Sorted chart data for 3369 (1M): [...]`).