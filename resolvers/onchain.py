"""Resolve stock-token metadata directly from chain contracts."""
import json, urllib.request

def call(rpc: str, to: str, data: str) -> str:
    body = json.dumps({"jsonrpc": "2.0", "method": "eth_call", "params": [{"to": to, "data": data}, "latest"], "id": 1}).encode()
    req = urllib.request.Request(rpc, body, {"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read())["result"]

def verify_wrapper(rpc: str, address: str) -> dict:
    name_raw = call(rpc, address, "0x06fdde03")
    sym_raw = call(rpc, address, "0x95d89b41")
    dec_raw = call(rpc, address, "0x313ce567")
    def decode_str(hexstr):
        try:
            ln = int(hexstr[64:128], 16)
            return bytes.fromhex(hexstr[128:128 + ln * 2]).decode()
        except Exception:
            return ""
    return {"name": decode_str(name_raw), "symbol": decode_str(sym_raw),
            "decimals": int(dec_raw, 16) if dec_raw and len(dec_raw) > 2 else 18}
