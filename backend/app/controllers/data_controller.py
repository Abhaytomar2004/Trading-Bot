from fastapi import APIRouter, Query

from app.repositories.alpaca_repository import alpaca_repo
from app.repositories.yahoo_repository import yahoo_repo
from app.repositories.binance_repository import binance_repo
from app.repositories.redis_repository import redis_repo
from app.config import settings

router = APIRouter(prefix="/api")


# --- Health ---
@router.get("/health")
def health():
    try:
        redis_ok = redis_repo.ping()
    except Exception as e:
        redis_ok = str(e)
    return {"ok": True, "redis": redis_ok}


# --- US Market (Alpaca) ---
@router.get("/trades")
def trades(limit: int = Query(50, ge=1, le=500)):
    try:
        return redis_repo.get_trades(limit)
    except Exception as e:
        return {"error": str(e)}


@router.get("/positions")
def positions():
    try:
        return redis_repo.get_positions()
    except Exception as e:
        return {"error": str(e)}


@router.get("/chart-data")
def chart_data(symbol: str = Query(...), limit: int = Query(50, ge=1, le=200)):
    try:
        return alpaca_repo.fetch_bars(symbol, timeframe="1Day", limit=limit)
    except Exception as e:
        return {"error": str(e)}


@router.get("/equity")
def equity(limit: int = Query(90, ge=1, le=365)):
    try:
        return redis_repo.get_equity_history(limit)
    except Exception as e:
        return {"error": str(e)}


@router.get("/status")
def status():
    try:
        return redis_repo.get_bot_state()
    except Exception as e:
        return {"error": str(e)}


# --- India Market (Yahoo Finance) ---
@router.get("/in/chart-data")
def in_chart_data(
    symbol: str = Query(...),
    limit: int = Query(50, ge=1, le=200),
    exchange: str = Query("NSE"),
):
    try:
        return yahoo_repo.fetch_bars(symbol, exchange=exchange, limit=limit)
    except Exception as e:
        return {"error": str(e)}


@router.get("/in/price")
def in_price(
    symbol: str = Query(...),
    exchange: str = Query("NSE"),
):
    try:
        return yahoo_repo.fetch_latest_price(symbol, exchange)
    except Exception as e:
        return {"error": str(e)}


@router.get("/in/search")
def in_search(q: str = Query(..., min_length=1)):
    try:
        return yahoo_repo.search(q)
    except Exception as e:
        return {"error": str(e)}


@router.get("/in/watchlist")
def in_watchlist():
    return settings.WATCHLIST_IN


# --- Crypto Market (Binance Testnet) ---
@router.get("/crypto/chart-data")
def crypto_chart_data(
    symbol: str = Query(...),
    limit: int = Query(50, ge=1, le=200),
    interval: str = Query("1d"),
):
    try:
        return binance_repo.fetch_bars(symbol, interval=interval, limit=limit)
    except Exception as e:
        return {"error": str(e)}


@router.get("/crypto/price")
def crypto_price(symbol: str = Query(...)):
    try:
        price = binance_repo.fetch_latest_price(symbol)
        return {"symbol": symbol, "price": price}
    except Exception as e:
        return {"error": str(e)}


@router.get("/crypto/search")
def crypto_search(q: str = Query(..., min_length=1)):
    try:
        return binance_repo.search(q)
    except Exception as e:
        return {"error": str(e)}


@router.get("/crypto/account")
def crypto_account():
    try:
        return binance_repo.get_account()
    except Exception as e:
        return {"error": str(e)}


@router.get("/crypto/watchlist")
def crypto_watchlist():
    return settings.WATCHLIST_CRYPTO
