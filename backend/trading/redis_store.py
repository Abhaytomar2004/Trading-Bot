import json
import httpx
from datetime import datetime, timezone


def _headers():
    from trading.config import UPSTASH_REDIS_TOKEN
    return {"Authorization": f"Bearer {UPSTASH_REDIS_TOKEN}"}


def _url():
    from trading.config import UPSTASH_REDIS_URL
    return UPSTASH_REDIS_URL


def _cmd(*args: str):
    resp = httpx.post(_url(), headers=_headers(), json=list(args))
    resp.raise_for_status()
    return resp.json().get("result")


def _pipeline(commands: list[list[str]]):
    resp = httpx.post(f"{_url()}/pipeline", headers=_headers(), json=commands)
    resp.raise_for_status()
    return resp.json()


def save_trade(trade: dict):
    trade["timestamp"] = datetime.now(timezone.utc).isoformat()
    _cmd("LPUSH", "trades:log", json.dumps(trade))


def get_trades(limit: int = 50) -> list[dict]:
    raw = _cmd("LRANGE", "trades:log", "0", str(limit - 1))
    return [json.loads(r) for r in (raw or [])]


def save_position(symbol: str, position: dict):
    _cmd("HSET", "positions:current", symbol, json.dumps(position))


def remove_position(symbol: str):
    _cmd("HDEL", "positions:current", symbol)


def get_positions() -> dict[str, dict]:
    raw = _cmd("HGETALL", "positions:current")
    if not raw:
        return {}
    if isinstance(raw, dict):
        return {k: json.loads(v) for k, v in raw.items()}
    positions = {}
    for i in range(0, len(raw), 2):
        positions[raw[i]] = json.loads(raw[i + 1])
    return positions


def save_equity_snapshot(snapshot: dict):
    snapshot["date"] = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    _cmd("LPUSH", "equity:history", json.dumps(snapshot))


def get_equity_history(limit: int = 90) -> list[dict]:
    raw = _cmd("LRANGE", "equity:history", "0", str(limit - 1))
    return [json.loads(r) for r in (raw or [])]


def get_bot_state() -> dict:
    raw = _cmd("HGETALL", "bot:state")
    if not raw:
        return {}
    if isinstance(raw, dict):
        return raw
    state = {}
    for i in range(0, len(raw), 2):
        state[raw[i]] = raw[i + 1]
    return state


def set_bot_state(key: str, value: str):
    _cmd("HSET", "bot:state", key, value)
