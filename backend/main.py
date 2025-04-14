from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import json
import os
import requests

app = FastAPI()
api_key = os.getenv("TM_API_KEY")

# Watchlist model
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
        print("Coins response:", data.get("data", [])[:2])
        mapped_data = [
            {
                "id": t.get("TOKEN_ID", "unknown"),
                "name": t.get("TOKEN_NAME", "Unknown"),
                "symbol": t.get("TOKEN_SYMBOL", "N/A"),
                "price": t.get("TOKEN_PRICE", 0.0)
            }
            for t in data.get("data", [])
        ]
        # Sort by price descending
        mapped_data.sort(key=lambda x: x["price"], reverse=True)
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
    
    exact_matches = []
    partial_matches = []
    
    query_lower = query.lower()
    for t in tokens:
        token_name = t.get("TOKEN_NAME", "").lower()
        token_symbol = t.get("TOKEN_SYMBOL", "").lower()
        mapped_token = {
            "id": t.get("TOKEN_ID", "unknown"),
            "name": t.get("TOKEN_NAME", "Unknown"),
            "symbol": t.get("TOKEN_SYMBOL", "N/A"),
            "price": t.get("TOKEN_PRICE", 0.0)
        }
        
        if query_lower == token_name or query_lower == token_symbol:
            exact_matches.append(mapped_token)
        elif query_lower in token_name or query_lower in token_symbol:
            partial_matches.append(mapped_token)
    
    # Sort exact and partial matches by price descending
    exact_matches.sort(key=lambda x: x["price"], reverse=True)
    partial_matches.sort(key=lambda x: x["price"], reverse=True)
    
    filtered = exact_matches + partial_matches
    print("Filtered coins:", filtered[:10])
    return {"data": filtered[:10]}

@app.get("/api/watchlist")
async def get_watchlist():
    return load_watchlist()

@app.post("/api/watchlist")
async def add_to_watchlist(coin: Coin):
    watchlist = load_watchlist()
    watchlist.append(coin.dict())
    save_watchlist(watchlist)
    return watchlist

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
        mapped_data = [
            {
                "id": t.get("TOKEN_ID", "unknown"),
                "name": t.get("TOKEN_NAME", "Unknown"),
                "symbol": t.get("TOKEN_SYMBOL", "N/A"),
                "price": t.get("TOKEN_PRICE", 0.0)
            }
            for t in data.get("data", [])
        ]
        mapped_data.sort(key=lambda x: x["price"], reverse=True)
        return {"data": mapped_data}
    return {"error": "Failed to fetch trending", "status": response.status_code}

# Static files
app.mount("/", StaticFiles(directory="dist", html=True), name="static")