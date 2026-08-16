#!/usr/bin/env node

/**
 * Dump all HLV on-chain fields for every vault + market pair on BSC Testnet.
 */

import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const { keccak_256 } = await import(
  resolve(__dirname, "../node_modules/.pnpm/@noble+hashes@1.8.0/node_modules/@noble/hashes/sha3.js")
);

const RPC = "https://bsc-testnet.nodereal.io/v1/e9a36765eb8a40b9bd12e680a1fd2bc5";
const DATASTORE = "0x61d4746598170E8ec96f90135307e329bcb3c244";
const HLV_READER = "0x14b29a0b286dE45A908400596A198398fbC2C770";

function keccak(data) {
  return Buffer.from(keccak_256(data));
}

function hashString(str) {
  return "0x" + keccak(new TextEncoder().encode(str)).toString("hex");
}

function abiEncode(types, values) {
  let hex = "";
  for (let i = 0; i < types.length; i++) {
    const t = types[i], v = values[i];
    if (t === "bytes32") hex += v.replace("0x", "").padStart(64, "0");
    else if (t === "address") hex += v.replace("0x", "").toLowerCase().padStart(64, "0");
    else if (t === "uint256") hex += BigInt(v).toString(16).padStart(64, "0");
    else if (t === "bool") hex += (v ? "1" : "0").padStart(64, "0");
  }
  return hex;
}

function hashData(types, values) {
  return "0x" + keccak(Buffer.from(abiEncode(types, values), "hex")).toString("hex");
}

async function rpc(method, params) {
  const res = await fetch(RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", method, params, id: 1 }),
    signal: AbortSignal.timeout(15000),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  return json.result;
}

async function ethCall(to, data) {
  return rpc("eth_call", [{ to, data }, "latest"]);
}

async function readUint(key) {
  const r = await ethCall(DATASTORE, "0xbd02d0f5" + key.replace("0x", ""));
  return r === "0x" ? 0n : BigInt(r);
}

async function readBool(key) {
  const r = await ethCall(DATASTORE, "0x7ae1cfca" + key.replace("0x", ""));
  return r === "0x" ? false : BigInt(r) !== 0n;
}

async function readBalance(token, account) {
  const sig = "0x70a08231" + account.replace("0x", "").toLowerCase().padStart(64, "0");
  const r = await ethCall(token, sig);
  return r === "0x" ? 0n : BigInt(r);
}

// All known HLV key string constants
const KEY_STRINGS = {
  max_cap: "max_cap",
  HLV_MAX_MARKET_TOKEN_BALANCE_AMOUNT: "HLV_MAX_MARKET_TOKEN_BALANCE_AMOUNT",
  HLV_MAX_MARKET_TOKEN_BALANCE_USD: "HLV_MAX_MARKET_TOKEN_BALANCE_USD",
  MAX_MARKET_TOKEN_BALANCE_USD: "MAX_MARKET_TOKEN_BALANCE_USD",
  IS_HLV_MARKET_DISABLED: "IS_HLV_MARKET_DISABLED",
  HLV_SHIFT_LAST_EXECUTED_AT: "HLV_SHIFT_LAST_EXECUTED_AT",
  HLV_SHIFT_MIN_INTERVAL: "HLV_SHIFT_MIN_INTERVAL",
};

function fmtUsd30(v) {
  if (v === 0n) return "$0";
  const integer = v / (10n ** 30n);
  const frac = ((v % (10n ** 30n)) * 100n / (10n ** 30n));
  return `$${Number(integer).toLocaleString("en-US")}.${frac.toString().padStart(2, "0")}`;
}
function fmtToken18(v) {
  if (v === 0n) return "0";
  const integer = v / (10n ** 18n);
  const frac = ((v % (10n ** 18n)) * 1000000n / (10n ** 18n));
  return `${Number(integer).toLocaleString("en-US")}.${frac.toString().padStart(6, "0")}`;
}

async function getHlvList() {
  const selector = "461e64f4";
  const params = abiEncode(["address", "uint256", "uint256"], [DATASTORE, "0", "100"]);
  return ethCall(HLV_READER, "0x" + selector + params);
}

async function main() {
  console.log("Fetching HLV list from HlvReader...");
  
  const listData = await getHlvList();
  
  // Decode: returns tuple[]  where tuple = (tuple(hlvToken,longToken,shortToken), address[])
  // The ABI encoding is complex. Let me just use a simpler approach - 
  // manually decode the returned data
  const hex = listData.slice(2);
  
  // First word: offset to array
  const arrayOffset = parseInt(hex.slice(0, 64), 16) * 2;
  // Array length
  const arrayLen = parseInt(hex.slice(arrayOffset, arrayOffset + 64), 16);
  
  console.log(`Found ${arrayLen} HLV vault(s)\n`);
  
  if (arrayLen === 0) {
    console.log("No vaults found.");
    return;
  }
  
  // Parse each HLV entry - offsets first
  const entryOffsets = [];
  for (let i = 0; i < arrayLen; i++) {
    const offsetPos = arrayOffset + 64 + i * 64;
    entryOffsets.push(arrayOffset + 64 + parseInt(hex.slice(offsetPos, offsetPos + 64), 16) * 2);
  }
  
  const hlvList = [];
  for (let i = 0; i < arrayLen; i++) {
    const base = entryOffsets[i];
    // Each entry: (tuple(hlvToken, longToken, shortToken), address[])
    // hlvToken at offset 0
    const hlvToken = "0x" + hex.slice(base + 24, base + 64);
    // longToken at offset 64
    const longToken = "0x" + hex.slice(base + 64 + 24, base + 64 + 64);
    // shortToken at offset 128
    const shortToken = "0x" + hex.slice(base + 128 + 24, base + 128 + 64);
    // markets array offset (relative to base)
    const marketsRelOffset = parseInt(hex.slice(base + 192, base + 256), 16) * 2;
    const marketsBase = base + marketsRelOffset;
    const marketsLen = parseInt(hex.slice(marketsBase, marketsBase + 64), 16);
    const markets = [];
    for (let j = 0; j < marketsLen; j++) {
      const mPos = marketsBase + 64 + j * 64;
      markets.push("0x" + hex.slice(mPos + 24, mPos + 64));
    }
    hlvList.push({ hlvToken, longToken, shortToken, markets });
  }
  
  // Now for each HLV + market pair, read all DataStore fields
  for (const hlv of hlvList) {
    console.log("═".repeat(80));
    console.log(`HLV Token:   ${hlv.hlvToken}`);
    console.log(`Long Token:  ${hlv.longToken}`);
    console.log(`Short Token: ${hlv.shortToken}`);
    console.log(`Markets:     ${hlv.markets.length}`);
    
    // HLV-level keys
    const shiftLastExec = await readUint(
      hashData(["bytes32", "address"], [hashString("HLV_SHIFT_LAST_EXECUTED_AT"), hlv.hlvToken])
    );
    const shiftMinInterval = await readUint(
      hashData(["bytes32", "address"], [hashString("HLV_SHIFT_MIN_INTERVAL"), hlv.hlvToken])
    );
    console.log(`\n  HLV-level fields:`);
    console.log(`    shiftLastExecutedAt: ${shiftLastExec}`);
    console.log(`    shiftMinInterval:    ${shiftMinInterval}`);
    
    for (const market of hlv.markets) {
      console.log(`\n  ── Market: ${market}`);
      
      // Read ALL candidate keys for this HLV + market pair
      const keysToCheck = [
        { name: "hlvMaxMarketTokenBalanceAmount", keyStr: "HLV_MAX_MARKET_TOKEN_BALANCE_AMOUNT", type: "uint", fmt: "token18" },
        { name: "hlvMaxMarketTokenBalanceUsd(max_cap)", keyStr: "max_cap", type: "uint", fmt: "usd30" },
        { name: "hlvMaxMarketTokenBalanceUsd(HLV_MAX_MARKET_TOKEN_BALANCE_USD)", keyStr: "HLV_MAX_MARKET_TOKEN_BALANCE_USD", type: "uint", fmt: "usd30" },
        { name: "isHlvDisabled", keyStr: "IS_HLV_MARKET_DISABLED", type: "bool" },
      ];
      
      for (const { name, keyStr, type, fmt } of keysToCheck) {
        const hash = hashString(keyStr);
        const storageKey = hashData(["bytes32", "address", "address"], [hash, hlv.hlvToken, market]);
        
        if (type === "bool") {
          const val = await readBool(storageKey);
          console.log(`    ${name}: ${val}`);
        } else {
          const val = await readUint(storageKey);
          const display = val === 0n ? "0 (NOT SET)" :
            fmt === "usd30" ? `${val}  (${fmtUsd30(val)})` :
            fmt === "token18" ? `${val}  (${fmtToken18(val)} tokens)` :
            val.toString();
          console.log(`    ${name}: ${display}`);
        }
      }
      
      // Read hzlp balance (balanceOf on market token)
      const balance = await readBalance(market, hlv.hlvToken);
      console.log(`    hzlpBalance (balanceOf): ${balance}  (${fmtToken18(balance)} tokens)`);
    }
    console.log();
  }
  
  console.log("═".repeat(80));
  console.log("Done.");
}

main().catch(e => { console.error("Fatal:", e.message); process.exit(1); });
