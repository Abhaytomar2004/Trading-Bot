from pydantic import BaseModel
from typing import Optional


class ManualOrderRequest(BaseModel):
    symbol: str
    side: str
    qty: Optional[int] = None


class AnalyzeRequest(BaseModel):
    symbol: str


class TradeRecord(BaseModel):
    symbol: str
    side: str
    qty: int
    price: float
    confidence: float
    reason: str
    timestamp: Optional[str] = None


class PositionRecord(BaseModel):
    qty: int
    avg_price: float


class CycleResult(BaseModel):
    symbol: str
    status: str
    action: Optional[str] = None
    confidence: Optional[float] = None
    reason: Optional[str] = None
