from fastapi import FastAPI, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import json
import os
import requests

app = FastAPI()
api_key = os.getenv("TOKEN_METRICS_API_KEY")

class Coin(BaseModel):
    id: str
    name: str
    symbol: str
    price: float | None = None

    @classmethod
    def __get_validators__(cls):
        """Yield validators for the Coin model."""
        yield cls.validate_to_json

    @classmethod
    def validate_to_json(cls, value):
        """Coerce input dictionary to Coin model with default values."""
        if isinstance(value, dict):
            return cls(
                id=str(value.get("id", "unknown")),
                name=value.get("name", "Unknown"),
                symbol=value.get("symbol", "N/A"),
                price=value.get("price", None)
            )
        return cls(**value)

def load_watchlist():
    """Load the watchlist from watchlist.json.

    Returns:
        list: List of watchlist coins, empty if file not found.
    """
    try:
        with open("watchlist.json", "r") as f:
            return json.load(f)
    except FileNotFoundError:
        return []

def save_watchlist(watchlist):
    """Save the watchlist to watchlist.json.

    Args:
        watchlist (list): List of coins to save.
    """
    with open("watchlist.json", "w") as f:
        json.dump(watchlist, f)
        

def fetch_coin_prices(coin_ids: list[str]):
    """Fetch prices for multiple coins from Token Metrics.

    Args:
        coin_ids (list[str]): List of coin IDs.

    Returns:
        dict: Mapping of coin_id to price in USD, None if not found.
    """
    if not coin_ids:
        return {}
    prices = {coin_id: None for coin_id in coin_ids}
    headers = {"accept": "application/json", "api_key": api_key}
    
    # Try /v2/price first
    encoded_ids = '%2C'.join(coin_ids)
    url = f"https://api.tokenmetrics.com/v2/price?token_id={encoded_ids}"
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        data = response.json().get("data", [])
        return {
            str(item.get("TOKEN_ID")): float(item.get("CURRENT_PRICE", 0)) or None
            for item in data
        }
    except Exception:
        return {coin_id: None for coin_id in coin_ids}

@app.get("/api/coins")
async def get_all_coins():
    """Fetch all coins from Token Metrics API.

    Returns:
        dict: List of coins with id, name, symbol, or error message.
    """
    url = "https://api.tokenmetrics.com/v2/tokens?limit=1000"
    headers = {
        "accept": "application/json",
        "api_key": api_key
    }
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        data = response.json()
        tokens = data.get("data", [])
        mapped_data = [
            {
                "id": str(t.get("TOKEN_ID", "unknown")),
                "name": t.get("TOKEN_NAME", "Unknown"),
                "symbol": t.get("TOKEN_SYMBOL", "N/A")
            }
            for t in tokens
        ]
        return {"data": mapped_data}
    except Exception as e:
        return {"error": "Failed to fetch coins", "status": response.status_code if 'response' in locals() else 500}

@app.get("/api/search/{query}")
async def search_coins(query: str):
    """Search coins by query string.

    Args:
        query (str): Search term for coin name or symbol.

    Returns:
        dict: Up to 20 matching coins (exact and partial) with id, name, symbol, price, or error message.
    """
    url = "https://api.tokenmetrics.com/v2/tokens?limit=1000"
    headers = {
        "accept": "application/json",
        "api_key": api_key
    }
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        data = response.json()
        tokens = data.get("data", [])
        
        exact_matches = []
        partial_matches = []
        
        query_words = [word.lower().strip() for word in query.split() if word.strip()]
        
        for t in tokens:
            token_name = t.get("TOKEN_NAME", "").lower().strip()
            token_symbol = t.get("TOKEN_SYMBOL", "").lower().strip()
            token_id = str(t.get("TOKEN_ID", "unknown"))
            
            mapped_token = {
                "id": token_id,
                "name": t.get("TOKEN_NAME", "Unknown"),
                "symbol": t.get("TOKEN_SYMBOL", "N/A")
            }
            
            is_exact = False
            for word in query_words:
                if word == token_name or word == token_symbol:
                    exact_matches.append(mapped_token)
                    is_exact = True
                    break
                if word in ["bitcoin", "btc"] and ("bitcoin" in token_name or token_symbol == "btc"):
                    exact_matches.append(mapped_token)
                    is_exact = True
                    break
                if word in ["ethereum", "ether", "eth"] and ("ethereum" in token_name or token_symbol == "eth"):
                    exact_matches.append(mapped_token)
                    is_exact = True
                    break
            
            if not is_exact:
                for word in query_words:
                    if word in token_name or word in token_symbol:
                        partial_matches.append(mapped_token)
                        break
        
        filtered = exact_matches + partial_matches
        # Fetch prices for filtered coins
        # if filtered:
        #     coin_ids = [coin["id"] for coin in filtered]
        #     prices = fetch_coin_prices(coin_ids)
        #     for coin in filtered:
        #         coin["price"] = prices.get(coin["id"], None)
        
        return {"data": filtered[:20]}
    except Exception as e:
        return {"error": "Search failed", "status": response.status_code if 'response' in locals() else 500}
    
    
@app.get("/api/watchlist")
async def get_watchlist():
    """Retrieve the current watchlist with prices.

    Returns:
        list: List of coins with id, name, symbol, price.
    """
    watchlist = load_watchlist()
    if watchlist:
        prices = fetch_coin_prices([coin["id"] for coin in watchlist])
        for coin in watchlist:
            coin["price"] = prices.get(coin["id"], None)
        save_watchlist(watchlist)
    return watchlist

@app.post("/api/watchlist")
async def add_to_watchlist(request: Request, coin: Coin):
    """Add a coin to the watchlist with price.

    Args:
        request (Request): FastAPI request object.
        coin (Coin): Coin data with id, name, symbol.

    Returns:
        list: Updated watchlist.
    """
    watchlist = load_watchlist()
    if not any(c["id"] == coin.id for c in watchlist):
        new_coin = coin.dict()
        prices = fetch_coin_prices([coin.id])
        new_coin["price"] = prices.get(coin.id, None)
        watchlist.append(new_coin)
        save_watchlist(watchlist)
        return watchlist
    return watchlist

@app.put("/api/watchlist")
async def update_watchlist(watchlist: list[Coin]):
    """Update the entire watchlist order with prices.

    Args:
        watchlist (list[Coin]): New ordered list of coins.

    Returns:
        list: Updated watchlist.
    """
    coin_ids = [coin.id for coin in watchlist]
    prices = fetch_coin_prices(coin_ids)
    updated_watchlist = [
        {**coin.dict(), "price": prices.get(coin.id, None)} for coin in watchlist
    ]
    save_watchlist(updated_watchlist)
    return updated_watchlist


@app.delete("/api/watchlist/{coin_id}")
async def delete_from_watchlist(coin_id: str):
    """Remove a coin from the watchlist.

    Args:
        coin_id (str): ID of the coin to remove.

    Returns:
        list: Updated watchlist.

    Raises:
        HTTPException: If coin_id is not found.
    """
    watchlist = load_watchlist()
    updated_watchlist = [c for c in watchlist if c["id"] != coin_id]
    if len(updated_watchlist) == len(watchlist):
        raise HTTPException(status_code=404, detail="Coin not found in watchlist")
    save_watchlist(updated_watchlist)
    return updated_watchlist

@app.get("/api/trending")
async def get_trending():
    """Fetch top 10 trending coins from Token Metrics.

    Returns:
        dict: List of trending coins with id, name, symbol, or error message.
    """
    url = "https://api.tokenmetrics.com/v2/tokens?limit=10"
    headers = {
        "accept": "application/json",
        "api_key": api_key
    }
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        data = response.json()
        tokens = data.get("data", [])
        mapped_data = [
            {
                "id": str(t.get("TOKEN_ID", "unknown")),
                "name": t.get("TOKEN_NAME", "Unknown"),
                "symbol": t.get("TOKEN_SYMBOL", "N/A")
            }
            for t in tokens
        ]
        return {"data": mapped_data}
    except Exception as e:
        return {"error": "Failed to fetch trending", "status": response.status_code if 'response' in locals() else 500}

app.mount("/", StaticFiles(directory="dist", html=True), name="static")