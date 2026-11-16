from fastapi import APIRouter, Query

from app.repositories.alpaca_repository import alpaca_repo
from app.repositories.redis_repository import redis_repo

router = APIRouter(prefix="/api")


@router.get("/health")
def health():
    try:
        redis_ok = redis_repo.ping()
    except Exception as e:
        redis_ok = str(e)
    return {"ok": True, "redis": redis_ok}


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
