import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    WATCHLIST: list[str] = os.getenv("WATCHLIST", "AAPL,MSFT,GOOGL,AMZN,TSLA").split(",")

    ALPACA_API_KEY: str = os.getenv("ALPACA_API_KEY", "").strip()
    ALPACA_SECRET_KEY: str = os.getenv("ALPACA_SECRET_KEY", "").strip()
    ALPACA_BASE_URL: str = os.getenv("ALPACA_BASE_URL", "https://paper-api.alpaca.markets").strip()
    ALPACA_DATA_URL: str = os.getenv("ALPACA_DATA_URL", "https://data.alpaca.markets").strip()

    JEV_API_KEY: str = os.getenv("JEV_API_KEY", "").strip()
    JEV_BASE_URL: str = os.getenv("JEV_BASE_URL", "https://jev-ai.pro/api/v1").strip()

    UPSTASH_REDIS_URL: str = os.getenv("UPSTASH_REDIS_REST_URL", "").strip()
    UPSTASH_REDIS_TOKEN: str = os.getenv("UPSTASH_REDIS_REST_TOKEN", "").strip()

    MIN_CONFIDENCE: float = float(os.getenv("MIN_CONFIDENCE", "0.6"))
    MAX_DAILY_LOSS_PCT: float = float(os.getenv("MAX_DAILY_LOSS_PCT", "0.02"))
    MAX_POSITION_PCT: float = float(os.getenv("MAX_POSITION_PCT", "0.20"))
    MAX_OPEN_POSITIONS: int = int(os.getenv("MAX_OPEN_POSITIONS", "5"))
    STARTING_CAPITAL: float = float(os.getenv("STARTING_CAPITAL", "100000"))

    BINANCE_API_KEY: str = os.getenv("BINANCE_API_KEY", "").strip()
    BINANCE_SECRET_KEY: str = os.getenv("BINANCE_SECRET_KEY", "").strip()

    WATCHLIST_CRYPTO: list[str] = os.getenv("WATCHLIST_CRYPTO", "BTCUSDT,ETHUSDT,SOLUSDT,BNBUSDT,XRPUSDT").split(",")

    WATCHLIST_IN: list[str] = os.getenv("WATCHLIST_IN", "RELIANCE,TCS,INFY,WIPRO,HCLTECH").split(",")

    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "*").strip()


settings = Settings()
