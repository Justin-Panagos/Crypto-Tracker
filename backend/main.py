# backend/main.py
import logging
import math
import os
from datetime import datetime

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from pycoingecko import CoinGeckoAPI

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Log the static directory contents at startup
static_dir = "dist"  # Changed from "frontend/dist" to "dist"
logger.info(f"Static directory: {static_dir}")
logger.info(f"Static directory exists: {os.path.exists(static_dir)}")
if os.path.exists(static_dir):
    logger.info(f"Contents of static directory: {os.listdir(static_dir)}")
    index_path = os.path.join(static_dir, "index.html")
    logger.info(f"Index file exists: {os.path.exists(index_path)}")
    # Serve the React frontend statically at the root
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")
else:
    logger.error(
        f"Static directory {static_dir} does not exist - skipping static file serving"
    )

cg = CoinGeckoAPI()


# Helper function to calculate Fibonacci-based periods
def get_fibonacci_periods(max_periods=5):
    fib = [1, 1]
    while len(fib) < max_periods:
        fib.append(fib[-1] + fib[-2])
    return fib[2:]  # Start from 2, 3, 5, 8, 13


# Search for cryptocurrencies
@app.get("/api/search/{query}")
async def search_crypto(query: str):
    coins = cg.get_coins_list()
    filtered = [
        coin
        for coin in coins
        if query.lower() in coin["name"].lower()
        or query.lower() in coin["symbol"].lower()
    ]
    return filtered[:10]  # Return top 10 matches


# Get current price and moving averages
@app.get("/api/crypto/{coin_id}")
async def get_crypto_data(coin_id: str):
    # Get current price
    price_data = cg.get_price(ids=coin_id, vs_currencies="usd")
    current_price = price_data.get(coin_id, {}).get("usd", 0)

    # Get 3-minute OHLC data for the last 24 hours
    ohlc_data = cg.get_coin_ohlc_by_id(
        id=coin_id, vs_currency="usd", days=1, interval="3m"
    )

    # Calculate 3-minute simple moving average (SMA)
    prices = [candle[4] for candle in ohlc_data]  # Closing prices
    sma_3min = (
        sum(prices[-20:]) / min(20, len(prices)) if prices else 0
    )  # Last 20 periods (~1 hour)

    # Calculate Fibonacci-based moving averages (e.g., 5, 8, 13 minutes)
    fib_periods = get_fibonacci_periods()  # [2, 3, 5, 8, 13]
    fib_averages = {}
    for period in fib_periods:
        num_candles = period  # Each candle is 3 minutes
        if len(prices) >= num_candles:
            fib_averages[f"sma_{period*3}min"] = (
                sum(prices[-num_candles:]) / num_candles
            )
        else:
            fib_averages[f"sma_{period*3}min"] = 0

    return {
        "current_price": current_price,
        "sma_3min": sma_3min,
        "fib_averages": fib_averages,
    }


# Get daily candlestick data for chart
@app.get("/api/crypto/{coin_id}/candlestick")
async def get_candlestick_data(coin_id: str):
    # Get OHLC data for the last day with 1-hour intervals
    ohlc_data = cg.get_coin_ohlc_by_id(
        id=coin_id, vs_currency="usd", days=1, interval="1h"
    )

    # Format for candlestick chart
    candlesticks = [
        {
            "time": int(datetime.fromtimestamp(candle[0] / 1000).timestamp()),
            "open": candle[1],
            "high": candle[2],
            "low": candle[3],
            "close": candle[4],
            "volume": candle[4]
            * 1000,  # Mock volume (CoinGecko OHLC doesn't include volume)
        }
        for candle in ohlc_data
    ]
    return candlesticks


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8002)
