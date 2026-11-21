import traceback

from fastapi import APIRouter, Query
from pydantic import BaseModel

from app.models.schemas import ManualOrderRequest, AnalyzeRequest
from app.services.trading_service import trading_service
from app.repositories.binance_repository import binance_repo

router = APIRouter(prefix="/api")



@router.post("/run-cycle")
def run_cycle():
    try:
        return trading_service.run_cycle()
    except Exception as e:
        return {"error": str(e), "trace": traceback.format_exc()}


@router.post("/manual-trade")
def manual_trade(order: ManualOrderRequest):
    try:
        return trading_service.manual_trade(order.symbol, order.side, order.qty)
    except Exception as e:
        return {"error": str(e)}


@router.post("/analyze")
def analyze(req: AnalyzeRequest):
    try:
        return trading_service.analyze(req.symbol)
    except Exception as e:
        return {"error": str(e)}


class CryptoOrderRequest(BaseModel):
    symbol: str
    side: str
    qty: float


@router.post("/crypto/trade")
def crypto_trade(order: CryptoOrderRequest):
    try:
        result = binance_repo.place_order(order.symbol, order.side, order.qty)
        return result
    except Exception as e:
        return {"error": str(e)}
