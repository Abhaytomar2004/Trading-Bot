import hashlib
import hmac
import time
from urllib.parse import urlencode

import httpx

from app.config import settings

BINANCE_PUBLIC = "https://data-api.binance.vision"
BINANCE_TESTNET = "https://testnet.binance.vision"


class BinanceRepository:
    def _sign(self, params: dict) -> dict:
        params["timestamp"] = int(time.time() * 1000)
        query = urlencode(params)
        signature = hmac.new(
            settings.BINANCE_SECRET_KEY.encode(),
            query.encode(),
            hashlib.sha256,
        ).hexdigest()
        params["signature"] = signature
        return params

    def _auth_headers(self) -> dict:
        return {"X-MBX-APIKEY": settings.BINANCE_API_KEY}

    def fetch_bars(self, symbol: str, interval: str = "1d", limit: int = 50) -> list[dict]:
        resp = httpx.get(
            f"{BINANCE_PUBLIC}/api/v3/klines",
            params={"symbol": symbol, "interval": interval, "limit": limit},
        )
        resp.raise_for_status()
        bars = []
        for k in resp.json():
            bars.append({
                "timestamp": k[0],
                "open": float(k[1]),
                "high": float(k[2]),
                "low": float(k[3]),
                "close": float(k[4]),
                "volume": float(k[5]),
            })
        return bars

    def fetch_latest_price(self, symbol: str) -> float:
        resp = httpx.get(
            f"{BINANCE_PUBLIC}/api/v3/ticker/price",
            params={"symbol": symbol},
        )
        resp.raise_for_status()
        return float(resp.json()["price"])

    def search(self, query: str) -> list[dict]:
        resp = httpx.get(f"{BINANCE_PUBLIC}/api/v3/exchangeInfo")
        resp.raise_for_status()
        query_upper = query.upper()
        results = []
        for s in resp.json().get("symbols", []):
            if s["status"] != "TRADING":
                continue
            if s["quoteAsset"] != "USDT":
                continue
            if query_upper in s["symbol"] or query_upper in s["baseAsset"]:
                results.append({
                    "symbol": s["symbol"],
                    "base": s["baseAsset"],
                    "quote": s["quoteAsset"],
                })
            if len(results) >= 20:
                break
        return results

    def get_account(self) -> dict:
        params = self._sign({})
        resp = httpx.get(
            f"{BINANCE_TESTNET}/api/v3/account",
            params=params,
            headers=self._auth_headers(),
        )
        resp.raise_for_status()
        data = resp.json()
        balances = {b["asset"]: float(b["free"]) for b in data.get("balances", []) if float(b["free"]) > 0}
        return balances

    def place_order(self, symbol: str, side: str, qty: float) -> dict:
        params = self._sign({
            "symbol": symbol,
            "side": side.upper(),
            "type": "MARKET",
            "quantity": str(qty),
        })
        resp = httpx.post(
            f"{BINANCE_TESTNET}/api/v3/order",
            params=params,
            headers=self._auth_headers(),
        )
        resp.raise_for_status()
        data = resp.json()
        fills = data.get("fills", [])
        avg_price = sum(float(f["price"]) * float(f["qty"]) for f in fills) / sum(float(f["qty"]) for f in fills) if fills else 0
        return {
            "orderId": data.get("orderId"),
            "symbol": data.get("symbol"),
            "side": data.get("side"),
            "qty": float(data.get("executedQty", 0)),
            "price": round(avg_price, 2),
            "status": data.get("status"),
        }

    def get_open_orders(self, symbol: str = None) -> list[dict]:
        params = self._sign({})
        if symbol:
            params["symbol"] = symbol
        resp = httpx.get(
            f"{BINANCE_TESTNET}/api/v3/openOrders",
            params=params,
            headers=self._auth_headers(),
        )
        resp.raise_for_status()
        return resp.json()


binance_repo = BinanceRepository()
