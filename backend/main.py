from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import json
import os
import requests

app = FastAPI()
api_key = os.getenv("TM_API_KEY")
class Coin(BaseModel):
    id: str
    name: str
    symbol: str

def load_watchlist():
    try:
        with open("watchlist.json", "r") as f:
            return json.load(f)
    except FileNotFoundError:
        return []

def save_watchlist(watchlist):
    with open("watchlist.json", "w") as f:
        json.dump(watchlist, f)

def fetch_prices():
    url = "https://api.tokenmetrics.com/v2/price"
    headers = {
        "accept": "application/json",
        "api_key": api_key
    }
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        data = response.json().get("data", [])
        print("Market data:", data[:2])
        return {str(item.get("TOKEN_ID")): item.get("USD_PRICE", 0.0) for item in data}
    print("Market data failed:", response.status_code)
    return {}

@app.get("/test")
async def test():
    return {"message": "Backend is alive"}

@app.get("/api/coins")
async def get_all_coins():
    url = "https://api.tokenmetrics.com/v2/tokens?limit=1000"
    headers = {
        "accept": "application/json",
        "api_key": api_key
    }
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        data = response.json()
        tokens = data.get("data", [])
        print("Coins full token:", tokens[0] if tokens else "Empty")
        prices = fetch_prices()
        mapped_data = [
            {
                "id": t.get("TOKEN_ID", "unknown"),
                "name": t.get("TOKEN_NAME", "Unknown"),
                "symbol": t.get("TOKEN_SYMBOL", "N/A"),
                "price": prices.get(str(t.get("TOKEN_ID", "unknown")), 0.0)
            }
            for t in tokens
        ]
        return {"data": mapped_data}
    return {"error": "Failed to fetch coins", "status": response.status_code}

@app.get("/api/search/{query}")
async def search_coins(query: str):
    url = "https://api.tokenmetrics.com/v2/tokens?limit=1000"
    headers = {
        "accept": "application/json",
        "api_key": api_key
    }
    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        return {"error": "Search failed", "status": response.status_code}
    
    tokens = response.json().get("data", [])
    print("Tokens received:", tokens[:2])
    prices = fetch_prices()
    
    exact_matches = []
    partial_matches = []
    
    query_lower = query.lower().strip()
    for t in tokens:
        token_name = t.get("TOKEN_NAME", "").lower().strip()
        token_symbol = t.get("TOKEN_SYMBOL", "").lower().strip()
        mapped_token = {
            "id": t.get("TOKEN_ID", "unknown"),
            "name": t.get("TOKEN_NAME", "Unknown"),
            "symbol": t.get("TOKEN_SYMBOL", "N/A"),
            "price": prices.get(str(t.get("TOKEN_ID", "unknown")), 0.0)
        }
        
        if query_lower == token_name or query_lower == token_symbol:
            exact_matches.append(mapped_token)
        elif query_lower in token_name or query_lower in token_symbol:
            partial_matches.append(mapped_token)
    
    print("Exact matches:", exact_matches)
    print("Partial matches:", partial_matches)
    
    filtered = exact_matches + partial_matches
    print("Filtered coins:", filtered[:10])
    return {"data": filtered[:10]}

@app.get("/api/watchlist")
async def get_watchlist():
    watchlist = load_watchlist()
    print("Watchlist fetched:", watchlist)
    return watchlist

@app.post("/api/watchlist")
async def add_to_watchlist(coin: Coin):
    watchlist = load_watchlist()
    if not any(c["id"] == coin.id for c in watchlist):
        watchlist.append(coin.dict())
        save_watchlist(watchlist)
        print("Watchlist updated:", watchlist)
        return watchlist
    print("Coin already in watchlist:", coin)
    return watchlist

@app.delete("/api/watchlist/{coin_id}")
async def delete_from_watchlist(coin_id: str):
    watchlist = load_watchlist()
    updated_watchlist = [c for c in watchlist if c["id"] != coin_id]
    if len(updated_watchlist) == len(watchlist):
        print("Coin not found in watchlist:", coin_id)
        raise HTTPException(status_code=404, detail="Coin not found in watchlist")
    save_watchlist(updated_watchlist)
    print("Watchlist updated after delete:", updated_watchlist)
    return updated_watchlist

@app.get("/api/trending")
async def get_trending():
    url = "https://api.tokenmetrics.com/v2/tokens?limit=10"
    headers = {
        "accept": "application/json",
        "api_key": api_key
    }
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        data = response.json()
        tokens = data.get("data", [])
        prices = fetch_prices()
        mapped_data = [
            {
                "id": t.get("TOKEN_ID", "unknown"),
                "name": t.get("TOKEN_NAME", "Unknown"),
                "symbol": t.get("TOKEN_SYMBOL", "N/A"),
                "price": prices.get(str(t.get("TOKEN_ID", "unknown")), 0.0)
            }
            for t in tokens
        ]
        return {"data": mapped_data}
    return {"error": "Failed to fetch trending", "status": response.status_code}

app.mount("/", StaticFiles(directory="dist", html=True), name="static")