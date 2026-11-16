import traceback

from fastapi import APIRouter, Query

from app.models.schemas import ManualOrderRequest, AnalyzeRequest
from app.services.trading_service import trading_service

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
