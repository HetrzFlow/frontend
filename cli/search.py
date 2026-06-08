#!/usr/bin/env python3
"""Search the stock-token index."""
import argparse, json, os, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def load_chain(chain):
    base = os.path.join(ROOT, "registry", chain)
    if not os.path.isdir(base):
        return []
    out = []
    for fn in os.listdir(base):
        if fn.endswith(".json"):
            out.append(json.load(open(os.path.join(base, fn))))
    return out

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--chain", default="bsc")
    p.add_argument("--ticker", required=True)
    p.add_argument("--json", action="store_true")
    args = p.parse_args()
    for rec in load_chain(args.chain):
        if rec.get("ticker", "").upper() == args.ticker.upper():
            print(json.dumps(rec, indent=2) if args.json else f"{rec['ticker']} | {rec['issuer']} | {rec['wrapper']}")
            sys.exit(0)
    print(f"not found: {args.ticker} on {args.chain}", file=sys.stderr)
    sys.exit(1)

if __name__ == "__main__":
    main()
