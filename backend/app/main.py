from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.controllers.trading_controller import router as trading_router
from app.controllers.data_controller import router as data_router

app = FastAPI(title="DhanBot Trading API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(trading_router)
app.include_router(data_router)
