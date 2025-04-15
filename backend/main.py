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
                symbol=value.get("symbol", "N/A")
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

@app.get("/test")
async def test():
    """Test endpoint to verify backend is running.

    Returns:
        dict: Message indicating backend status.
    """
    return {"message": "Backend is alive"}

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
        dict: Up to 10 matching coins (exact and partial), or error message.
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
        return {"data": filtered[:10]}
    except Exception as e:
        return {"error": "Search failed", "status": response.status_code if 'response' in locals() else 500}

@app.get("/api/watchlist")
async def get_watchlist():
    """Retrieve the current watchlist.

    Returns:
        list: List of coins in the watchlist.
    """
    watchlist = load_watchlist()
    return watchlist

@app.post("/api/watchlist")
async def add_to_watchlist(request: Request, coin: Coin):
    """Add a coin to the watchlist.

    Args:
        request (Request): FastAPI request object.
        coin (Coin): Coin data with id, name, symbol.

    Returns:
        list: Updated watchlist.
    """
    watchlist = load_watchlist()
    if not any(c["id"] == coin.id for c in watchlist):
        watchlist.append(coin.dict())
        save_watchlist(watchlist)
        return watchlist
    return watchlist

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