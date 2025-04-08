from fastapi import FastAPI
from pycoingecko import CoinGeckoAPI
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import json
import os
import requests

app = FastAPI()
api_key = os.getenv("COINGECKO_API_KEY")
cg = CoinGeckoAPI(api_key=api_key if api_key else None)



WATCHLIST_FILE = "watchlist.json"
if not os.path.exists(WATCHLIST_FILE):
    with open(WATCHLIST_FILE, "w") as f:
        json.dump([], f)

class Coin(BaseModel):
    id: str
    name: str
    symbol: str


@app.get("/api/coins")
async def get_all_coins():
    url = "https://api.coingecko.com/api/v3/coins/list"
    headers = {
        "accept": "application/json",
        "X-CG-API-Key": api_key
    }
    response = requests.get(url, headers=headers)
    return response.json()

@app.get("/api/search/{query}")
async def search_coins(query: str):
    coins = cg.get_coins_list()
    filtered = [
        {"id": c["id"], "name": c["name"], "symbol": c["symbol"]}
        for c in coins if query.lower() in c["name"].lower() or query.lower() in c["symbol"].lower()
    ]
    return filtered[:10]

@app.get("/api/watchlist")
async def get_watchlist():
    with open(WATCHLIST_FILE, "r") as f:
        return json.load(f)

@app.post("/api/watchlist")
async def add_to_watchlist(coin: Coin):
    with open(WATCHLIST_FILE, "r") as f:
        watchlist = json.load(f)
    if not any(c["id"] == coin.id for c in watchlist):
        watchlist.append(coin.dict())
        with open(WATCHLIST_FILE, "w") as f:
            json.dump(watchlist, f)
    return watchlist

@app.get("/api/trending")
async def get_trending_coins():
    trending = cg.get_search_trending()
    return [{"id": coin["item"]["id"], "name": coin["item"]["name"]} for coin in trending["coins"][:10]]



# Mount static files
app.mount("/", StaticFiles(directory="dist", html=True), name="static")
