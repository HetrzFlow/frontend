#!/usr/bin/env python3
"""Nightly registry verification — files an issue on drift."""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from resolvers.onchain import verify_wrapper

def main():
    base = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "registry")
    failed = []
    for chain in ["bsc", "evm"]:
        for fn in os.listdir(os.path.join(base, chain)):
            if not fn.endswith(".json"):
                continue
            rec = json.load(open(os.path.join(base, chain, fn)))
            try:
                meta = verify_wrapper("https://bsc-dataseed.binance.org", rec["wrapper"])
                if meta["symbol"].upper() != rec["ticker"].upper():
                    failed.append((rec["ticker"], "symbol mismatch"))
            except Exception as e:
                failed.append((rec["ticker"], str(e)[:40]))
    print("FAILED:", failed if failed else "none")

if __name__ == "__main__":
    main()
