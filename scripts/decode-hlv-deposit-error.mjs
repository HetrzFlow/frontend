#!/usr/bin/env node

/**
 * Decode internal revert errors from executeHlvDeposit transactions on BSC Testnet.
 *
 * Usage:
 *   node scripts/decode-hlv-deposit-error.mjs <txHash>
 */

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------------
// Load full CustomErrors ABI from project
// ---------------------------------------------------------------------------
const __dirname = dirname(fileURLToPath(import.meta.url));
const CUSTOM_ERRORS_RAW = await loadCustomErrorsAbi();

async function loadCustomErrorsAbi() {
  const abiPath = resolve(__dirname, "../packages/hertzflow-sdk-v2/src/abis/CustomErrors.ts");
  try {
    const raw = readFileSync(abiPath, "utf-8");
    const jsonStr = raw
      .replace(/^export default\s*/, "")
      .replace(/\s*as\s+const\s*;\s*$/, "")
      .replace(/internalType:\s*"[^"]*",?\s*/g, "")
      .replace(/(\w+)\s*:/g, '"$1":')
      .replace(/,\s*}/g, " }")
      .replace(/,\s*]/g, " ]");
    return JSON.parse(jsonStr);
  } catch (e) {
    console.warn("Warning: Could not load CustomErrors.ts:", e.message);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Keccak-256 via @noble/hashes (available in the monorepo)
// ---------------------------------------------------------------------------
let keccak256Fn;
try {
  const noblePath = resolve(
    __dirname,
    "../node_modules/.pnpm/@noble+hashes@1.8.0/node_modules/@noble/hashes/sha3.js",
  );
  const { keccak_256 } = await import(noblePath);
  keccak256Fn = (text) => {
    const hash = keccak_256(new TextEncoder().encode(text));
    return "0x" + Buffer.from(hash).toString("hex");
  };
} catch {
  console.error("Error: @noble/hashes not found. Run from the web-hub root.");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Build selector -> error lookup from ABI
// ---------------------------------------------------------------------------
function buildErrorMap(abi) {
  const map = new Map();
  for (const item of abi) {
    if (item.type !== "error") continue;
    const types = (item.inputs || []).map((i) => i.type);
    const sig = `${item.name}(${types.join(",")})`;
    const hash = keccak256Fn(sig);
    const selector = hash.slice(0, 10);
    map.set(selector, { name: item.name, sig, inputs: item.inputs || [] });
  }
  return map;
}

const ERROR_MAP = buildErrorMap(CUSTOM_ERRORS_RAW);

// ---------------------------------------------------------------------------
// ABI decoding helpers (no external deps)
// ---------------------------------------------------------------------------
function decodeAbiParams(types, hexData) {
  const data = hexData.startsWith("0x") ? hexData.slice(2) : hexData;
  const values = [];
  let offset = 0;

  for (const type of types) {
    const word = data.slice(offset, offset + 64);
    if (type === "address") {
      values.push("0x" + word.slice(24));
    } else if (type === "uint256") {
      values.push(BigInt("0x" + word));
    } else if (type === "int256") {
      const n = BigInt("0x" + word);
      values.push(n >= 1n << 255n ? n - (1n << 256n) : n);
    } else if (type === "bytes32") {
      values.push("0x" + word);
    } else if (type === "bool") {
      values.push(BigInt("0x" + word) !== 0n);
    } else if (type === "string") {
      try {
        const strOffset = Number(BigInt("0x" + word)) * 2;
        const strLen = Number(BigInt("0x" + data.slice(strOffset, strOffset + 64)));
        const strHex = data.slice(strOffset + 64, strOffset + 64 + strLen * 2);
        values.push(Buffer.from(strHex, "hex").toString("utf-8"));
      } catch {
        values.push("[decode error]");
      }
    } else if (type === "bytes") {
      try {
        const bOffset = Number(BigInt("0x" + word)) * 2;
        const bLen = Number(BigInt("0x" + data.slice(bOffset, bOffset + 64)));
        values.push("0x" + data.slice(bOffset + 64, bOffset + 64 + bLen * 2));
      } catch {
        values.push("[decode error]");
      }
    } else {
      values.push("0x" + word);
    }
    offset += 64;
  }
  return values;
}

// ---------------------------------------------------------------------------
// Error decoding
// ---------------------------------------------------------------------------
function tryDecodeError(outputHex) {
  if (!outputHex || outputHex === "0x" || outputHex.length < 10) return null;

  // Standard Error(string)
  if (outputHex.startsWith("0x08c379a0")) {
    try {
      const data = outputHex.slice(10);
      const strOffset = Number(BigInt("0x" + data.slice(0, 64))) * 2;
      const strLen = Number(BigInt("0x" + data.slice(64, 128)));
      const msg = Buffer.from(data.slice(128, 128 + strLen * 2), "hex").toString("utf-8");
      return { name: "Error(string)", params: { message: msg } };
    } catch { /* fall through */ }
  }

  // Panic(uint256)
  if (outputHex.startsWith("0x4e487b71")) {
    const code = Number(BigInt("0x" + outputHex.slice(10, 74)));
    const PANIC = { 0: "generic", 1: "assert", 17: "overflow", 18: "div-by-zero", 50: "index-oob" };
    return { name: "Panic", params: { code, description: PANIC[code] || "unknown" } };
  }

  // Custom error from ABI
  const selector = outputHex.slice(0, 10);
  const errDef = ERROR_MAP.get(selector);
  if (errDef) {
    const types = errDef.inputs.map((i) => i.type);
    const names = errDef.inputs.map((i) => i.name);
    try {
      const values = decodeAbiParams(types, outputHex.slice(10));
      const params = {};
      for (let i = 0; i < names.length; i++) {
        params[names[i]] = values[i];
      }
      return { name: errDef.name, sig: errDef.sig, params };
    } catch {
      return { name: errDef.name, sig: errDef.sig, params: { raw: outputHex } };
    }
  }

  return { name: "UnknownError", params: { selector, data: outputHex.slice(0, 200) } };
}

// ---------------------------------------------------------------------------
// RPC
// ---------------------------------------------------------------------------
const BSC_TESTNET_RPCS = [
  "https://bsc-testnet.nodereal.io/v1/e9a36765eb8a40b9bd12e680a1fd2bc5",
  "https://data-seed-prebsc-1-s1.binance.org:8545/",
  "https://data-seed-prebsc-2-s1.binance.org:8545/",
];

async function rpcCall(method, params) {
  let lastError;
  for (const rpc of BSC_TESTNET_RPCS) {
    try {
      const res = await fetch(rpc, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", method, params, id: 1 }),
        signal: AbortSignal.timeout(30_000),
      });
      const json = await res.json();
      if (json.error) {
        lastError = new Error(`[${rpc}] ${json.error.message}`);
        continue;
      }
      return json.result;
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError;
}

// ---------------------------------------------------------------------------
// Trace analysis
// ---------------------------------------------------------------------------
function findReverts(call, depth = 0) {
  const results = [];
  if (call.error) {
    results.push({
      depth,
      type: call.type ?? "",
      from: call.from ?? "",
      to: call.to ?? "",
      method: call.input?.slice(0, 10) ?? "0x",
      output: call.output ?? "0x",
      error: call.error,
    });
  }
  for (const sub of call.calls ?? []) {
    results.push(...findReverts(sub, depth + 1));
  }
  return results;
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------
const USD_PRECISION = 10n ** 30n;

function formatUsd(value) {
  if (typeof value !== "bigint") return String(value);
  const sign = value < 0n ? "-" : "";
  const abs = value < 0n ? -value : value;
  const integer = abs / USD_PRECISION;
  const fraction = (abs % USD_PRECISION).toString().padStart(30, "0").slice(0, 2);
  return `${sign}$${Number(integer).toLocaleString("en-US")}.${fraction}`;
}

function formatParam(key, value) {
  if (typeof value === "bigint") {
    const isUsd = /[Uu]sd|[Vv]alue/.test(key);
    return isUsd ? `${value}  (≈ ${formatUsd(value)})` : value.toString();
  }
  return String(value);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const txHash = process.argv[2];
  if (!txHash?.match(/^0x[0-9a-fA-F]{64}$/)) {
    console.error("Usage: node scripts/decode-hlv-deposit-error.mjs <txHash>");
    console.error(
      "Example: node scripts/decode-hlv-deposit-error.mjs 0x9fd1205a5e6552b0e90632cf28c611dbe3384a3a0663fc429c215e15531299be",
    );
    process.exit(1);
  }

  console.log(`\n🔍 Transaction: ${txHash}`);

  // 1. Receipt
  console.log("\nFetching receipt...");
  const receipt = await rpcCall("eth_getTransactionReceipt", [txHash]);
  if (!receipt) {
    console.error("Transaction not found.");
    process.exit(1);
  }
  console.log(`  Status : ${receipt.status === "0x1" ? "✅ Success" : "❌ Failed"}`);
  console.log(`  Gas    : ${parseInt(receipt.gasUsed, 16).toLocaleString()}`);
  console.log(`  Logs   : ${receipt.logs.length}`);

  // 2. Trace
  console.log("\nFetching debug trace...");
  let trace;
  try {
    trace = await rpcCall("debug_traceTransaction", [
      txHash,
      { tracer: "callTracer", tracerConfig: { onlyTopCall: false } },
    ]);
  } catch (e) {
    console.error(`Failed to get trace: ${e.message}`);
    console.error("RPC may not support debug_traceTransaction or state may be pruned.");
    process.exit(1);
  }

  const reverts = findReverts(trace);
  if (reverts.length === 0) {
    console.log("\n✅ No reverted internal calls found.");
    return;
  }

  // 3. Group & display
  console.log(`\n${"═".repeat(70)}`);
  console.log(` Found ${reverts.length} reverted internal call(s)`);
  console.log(`${"═".repeat(70)}`);

  const grouped = new Map();
  for (const r of reverts) {
    const decoded = tryDecodeError(r.output);
    const key = decoded?.name ?? "Unknown";
    if (!grouped.has(key)) grouped.set(key, { decoded, items: [] });
    grouped.get(key).items.push(r);
  }

  for (const [errorName, { decoded, items }] of grouped) {
    console.log(`\n┌─ ${errorName} (${items.length}x)`);
    if (decoded?.sig) {
      console.log(`│  Signature: ${decoded.sig}`);
    }
    if (decoded?.params && errorName !== "UnknownError") {
      console.log(`│  Parameters:`);
      for (const [k, v] of Object.entries(decoded.params)) {
        console.log(`│    ${k}: ${formatParam(k, v)}`);
      }
    }
    console.log(`│`);
    console.log(`│  Call trace:`);
    for (const item of items) {
      console.log(
        `│    [depth=${item.depth}] ${item.type} → ${item.to}  method=${item.method}`,
      );
    }
    console.log(`└${"─".repeat(69)}`);
  }

  console.log();
}

main().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
