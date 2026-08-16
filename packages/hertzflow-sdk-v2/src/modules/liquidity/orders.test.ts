import { beforeEach, describe, expect, it, vi } from "vitest";
import { decodeFunctionData } from "viem";

import { getContract } from "configs/contracts";
import { accountDepositListKey } from "configs/dataStore";

import { cancelLiquidityOrder, cancelLiquidityOrders, getLiquidityOrders, type LiquidityOrder } from "./orders";

describe("liquidity orders", () => {
  const account = "0x1111111111111111111111111111111111111111";
  const market = "0x2222222222222222222222222222222222222222";
  const otherMarket = "0x3333333333333333333333333333333333333333";
  const firstDepositReceiver = "0x0000000000000000000000000000000000000001";
  const depositKey = `0x${"1".repeat(64)}` as const;
  const withdrawalKey = `0x${"2".repeat(64)}` as const;
  const transactionHash = `0x${"3".repeat(64)}` as const;
  const readContract = vi.fn();
  const multicall = vi.fn();
  const callContract = vi.fn();
  const sdk = {
    account,
    chainId: 97,
    publicClient: { readContract, multicall },
    callContract,
  } as never;

  beforeEach(() => {
    readContract.mockReset();
    multicall.mockReset();
    callContract.mockReset();
    callContract.mockResolvedValue(transactionHash);
  });

  it("queries the account pending-order lists and filters by market", async () => {
    const depositListKey = accountDepositListKey(account);
    readContract.mockImplementation(({ args }) => {
      return Promise.resolve(args[0] === depositListKey ? [depositKey] : [withdrawalKey]);
    });
    multicall.mockImplementation(({ contracts }) => {
      if (contracts[0]?.functionName === "getDeposit") {
        return Promise.resolve([
          {
            status: "success",
            result: {
              addresses: { account, receiver: account, market },
              numbers: {
                initialLongTokenAmount: 10n,
                initialShortTokenAmount: 0n,
                updatedAtTime: 10n,
                executionFee: 1n,
              },
            },
          },
        ]);
      }
      return Promise.resolve([
        {
          status: "success",
          result: {
            addresses: { account, receiver: account, market: otherMarket },
            numbers: {
              marketTokenAmount: 10n,
              updatedAtTime: 20n,
              executionFee: 1n,
            },
          },
        },
      ]);
    });

    const result = await getLiquidityOrders(sdk, { account, marketAddress: market, scope: "market" });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ key: depositKey, owner: account, kind: "deposit", scope: "market" });
    expect(readContract).toHaveBeenCalledTimes(2);
    expect(multicall).toHaveBeenCalledTimes(2);
    expect(readContract.mock.calls.every(([params]) => !("blockNumber" in params))).toBe(true);
    expect(multicall.mock.calls.every(([params]) => !("blockNumber" in params))).toBe(true);
    expect(readContract.mock.calls.every(([params]) => params.functionName === "getBytes32ValuesAt")).toBe(true);
  });

  it("ignores keys whose details no longer exist", async () => {
    readContract.mockResolvedValue([depositKey]);
    multicall.mockResolvedValue([
      {
        status: "success",
        result: {
          addresses: {
            account: "0x0000000000000000000000000000000000000000",
            receiver: "0x0000000000000000000000000000000000000000",
            market: "0x0000000000000000000000000000000000000000",
          },
          numbers: { updatedAtTime: 0n, executionFee: 0n },
        },
      },
    ]);

    await expect(getLiquidityOrders(sdk, { account, scope: "market" })).resolves.toEqual([]);
  });

  it("loads withdrawals directly from the account list even when the receiver differs", async () => {
    const depositListKey = accountDepositListKey(account);
    readContract.mockImplementation(({ args }) => {
      return Promise.resolve(args[0] === depositListKey ? [] : [withdrawalKey]);
    });
    multicall.mockResolvedValue([
      {
        status: "success",
        result: {
          addresses: { account, receiver: otherMarket, market },
          numbers: {
            marketTokenAmount: 10n,
            minLongTokenAmount: 5n,
            minShortTokenAmount: 5n,
            updatedAtTime: 20n,
            executionFee: 1n,
          },
        },
      },
    ]);

    const result = await getLiquidityOrders(sdk, { account, marketAddress: market, scope: "market" });

    expect(result).toMatchObject([
      { key: withdrawalKey, owner: account, kind: "withdrawal", addresses: { receiver: otherMarket } },
    ]);
    expect(multicall).toHaveBeenCalledTimes(1);
    expect(multicall.mock.calls[0]?.[0].contracts[0]?.functionName).toBe("getWithdrawal");
  });

  it("does not return first-deposit receiver orders", async () => {
    readContract.mockResolvedValue([depositKey]);
    multicall.mockResolvedValue([
      {
        status: "success",
        result: {
          addresses: { account, receiver: firstDepositReceiver, market },
          numbers: {
            initialLongTokenAmount: 10n,
            initialShortTokenAmount: 0n,
            updatedAtTime: 10n,
            executionFee: 1n,
          },
        },
      },
    ]);

    await expect(getLiquidityOrders(sdk, { account, marketAddress: market, scope: "market" })).resolves.toEqual([]);
  });

  it("loads no more than the configured number of account keys", async () => {
    const depositListKey = accountDepositListKey(account);
    const recentKeys = Array.from(
      { length: 250 },
      (_, index) => `0x${(index + 10).toString(16).padStart(64, "0")}` as `0x${string}`
    );
    readContract.mockResolvedValue(recentKeys);
    multicall.mockResolvedValue([]);

    await expect(
      getLiquidityOrders(sdk, { account, marketAddress: market, scope: "market", limit: 250 })
    ).resolves.toEqual([]);

    expect(readContract).toHaveBeenCalledWith(
      expect.objectContaining({ functionName: "getBytes32ValuesAt", args: [depositListKey, 0n, 250n] })
    );
  });

  it.each([
    ["market", "deposit", "ExchangeRouter", "cancelDeposit"],
    ["market", "withdrawal", "ExchangeRouter", "cancelWithdrawal"],
    ["hlv", "deposit", "HlvRouter", "cancelHlvDeposit"],
    ["hlv", "withdrawal", "HlvRouter", "cancelHlvWithdrawal"],
  ] as const)("cancels a %s %s through the matching v10 router", async (scope, kind, contract, method) => {
    const order = { key: depositKey, scope, kind } satisfies Pick<LiquidityOrder, "key" | "scope" | "kind">;

    await expect(cancelLiquidityOrder(sdk, order)).resolves.toBe(transactionHash);
    expect(callContract).toHaveBeenCalledWith(getContract(97, contract), expect.any(Array), method, [depositKey]);
  });

  it.each([
    ["market", "ExchangeRouter", ["cancelDeposit", "cancelWithdrawal"]],
    ["hlv", "HlvRouter", ["cancelHlvDeposit", "cancelHlvWithdrawal"]],
  ] as const)("cancels multiple %s liquidity orders in one multicall", async (scope, contract, methods) => {
    const orders = [
      { key: depositKey, scope, kind: "deposit" },
      { key: withdrawalKey, scope, kind: "withdrawal" },
    ] satisfies Pick<LiquidityOrder, "key" | "scope" | "kind">[];

    await expect(cancelLiquidityOrders(sdk, orders)).resolves.toBe(transactionHash);

    const [address, abi, functionName, args] = callContract.mock.calls[0];
    expect(address).toBe(getContract(97, contract));
    expect(functionName).toBe("multicall");
    expect(
      args[0].map((data: `0x${string}`) => decodeFunctionData({ abi, data }).functionName)
    ).toEqual(methods);
  });

  it("rejects a liquidity multicall spanning different routers", async () => {
    await expect(
      cancelLiquidityOrders(sdk, [
        { key: depositKey, scope: "market", kind: "deposit" },
        { key: withdrawalKey, scope: "hlv", kind: "withdrawal" },
      ])
    ).rejects.toThrow("same router");
    expect(callContract).not.toHaveBeenCalled();
  });
});
