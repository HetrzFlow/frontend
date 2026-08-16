import { beforeEach, describe, expect, it, vi } from "vitest";
import { decodeFunctionData, zeroAddress, type Abi } from "viem";

import { abis } from "abis";
import { getContract } from "configs/contracts";

import { createDepositTxn, createHlvDepositTxn, createHlvWithdrawalTxn, createWithdrawalTxn } from "./transactions";

describe("HFUSD native-router liquidity transactions", () => {
  const account = "0x1111111111111111111111111111111111111111";
  const market = "0x2222222222222222222222222222222222222222";
  const wrappedToken = "0x3333333333333333333333333333333333333333";
  const underlyingToken = "0x4444444444444444444444444444444444444444";
  const bank = "0x5555555555555555555555555555555555555555";
  const hlv = "0x6666666666666666666666666666666666666666";
  const secondMarket = "0x7777777777777777777777777777777777777777";
  const hlvToken = "0x8888888888888888888888888888888888888888";
  const txHash = `0x${"1".repeat(64)}`;
  const callContract = vi.fn();
  const readContract = vi.fn();
  const sdk = {
    account,
    chainId: 97,
    callContract,
    publicClient: { readContract },
  } as never;
  const internalUsd = {
    bankAddress: bank,
    wrappedTokenAddress: wrappedToken,
    underlyingTokenAddress: underlyingToken,
  };

  beforeEach(() => {
    callContract.mockReset();
    callContract.mockResolvedValue(txHash);
    readContract.mockReset();
    readContract.mockResolvedValue(0n);
  });

  function decodeRouterCalls(abi: Abi) {
    const calls = callContract.mock.calls[0]?.[3]?.[0] as `0x${string}`[];
    return calls.map((data) => decodeFunctionData({ abi, data }));
  }

  it("mints HFUSD into DepositVault and creates a native ExchangeRouter deposit", async () => {
    await expect(
      createDepositTxn({
        sdk,
        params: {
          addresses: {
            receiver: account,
            callbackContract: account,
            uiFeeReceiver: zeroAddress,
            market,
            initialLongToken: wrappedToken,
            initialShortToken: wrappedToken,
            longTokenSwapPath: [],
            shortTokenSwapPath: [],
          },
          minMarketTokens: 11n,
          shouldUnwrapNativeToken: false,
          executionFee: 3n,
          callbackGasLimit: 1_000_000n,
          dataList: [],
        },
        longTokenAmount: 0n,
        shortTokenAmount: 12n,
        internalUsd,
      })
    ).resolves.toBe(txHash);

    expect(callContract).toHaveBeenCalledWith(
      getContract(97, "ExchangeRouter"),
      expect.any(Array),
      "multicall",
      [expect.any(Array)],
      { value: 3n }
    );

    const calls = decodeRouterCalls(abis.ExchangeRouter as Abi);
    expect(calls.map((call) => call.functionName)).toEqual([
      "sendTokens",
      "makeExternalCalls",
      "sendWnt",
      "createDeposit",
    ]);
    expect(calls[0]?.args).toEqual([underlyingToken, bank, 12n]);

    const externalCalls = calls[1]?.args as readonly [readonly string[], readonly `0x${string}`[], unknown, unknown];
    expect(externalCalls[0]).toEqual([bank]);
    expect(
      decodeFunctionData({
        abi: abis.HFBank,
        data: externalCalls[1][0]!,
      })
    ).toEqual({
      functionName: "mint",
      args: [getContract(97, "DepositVault")],
    });

    const createDeposit = calls[3]?.args?.[0] as {
      addresses: { receiver: string; callbackContract: string };
      callbackGasLimit: bigint;
    };
    expect(createDeposit.addresses.receiver).toBe(account);
    expect(createDeposit.addresses.callbackContract).toBe(zeroAddress);
    expect(createDeposit.callbackGasLimit).toBe(0n);
  });

  it("uses the configured minimum for the first market deposit", async () => {
    readContract.mockResolvedValue(20n);

    await createDepositTxn({
      sdk,
      params: {
        addresses: {
          receiver: "0x0000000000000000000000000000000000000001",
          callbackContract: account,
          uiFeeReceiver: zeroAddress,
          market,
          initialLongToken: wrappedToken,
          initialShortToken: wrappedToken,
          longTokenSwapPath: [],
          shortTokenSwapPath: [],
        },
        minMarketTokens: 11n,
        shouldUnwrapNativeToken: false,
        executionFee: 3n,
        callbackGasLimit: 1n,
        dataList: [],
      },
      longTokenAmount: 12n,
      shortTokenAmount: 0n,
      internalUsd,
    });

    const calls = decodeRouterCalls(abis.ExchangeRouter as Abi);
    const createDeposit = calls[3]?.args?.[0] as { minMarketTokens: bigint };
    expect(createDeposit.minMarketTokens).toBe(20n);
  });

  it("keeps ordinary market deposits on the native token-transfer path", async () => {
    const secondToken = "0x9999999999999999999999999999999999999999";

    await createDepositTxn({
      sdk,
      params: {
        addresses: {
          receiver: account,
          callbackContract: account,
          uiFeeReceiver: zeroAddress,
          market,
          initialLongToken: underlyingToken,
          initialShortToken: secondToken,
          longTokenSwapPath: [],
          shortTokenSwapPath: [],
        },
        minMarketTokens: 11n,
        shouldUnwrapNativeToken: false,
        executionFee: 3n,
        callbackGasLimit: 42n,
        dataList: [],
      },
      longTokenAmount: 5n,
      shortTokenAmount: 7n,
      internalUsd: undefined,
    });

    const calls = decodeRouterCalls(abis.ExchangeRouter as Abi);
    expect(calls.map((call) => call.functionName)).toEqual(["sendTokens", "sendTokens", "sendWnt", "createDeposit"]);
    expect(calls[0]?.args).toEqual([underlyingToken, getContract(97, "DepositVault"), 5n]);
    expect(calls[1]?.args).toEqual([secondToken, getContract(97, "DepositVault"), 7n]);
    const createDeposit = calls[3]?.args?.[0] as {
      addresses: { callbackContract: string };
      callbackGasLimit: bigint;
    };
    expect(createDeposit.addresses.callbackContract).toBe(account);
    expect(createDeposit.callbackGasLimit).toBe(42n);
  });

  it("creates a native ExchangeRouter withdrawal", async () => {
    await createWithdrawalTxn({
      sdk,
      params: {
        addresses: {
          receiver: account,
          callbackContract: account,
          uiFeeReceiver: zeroAddress,
          market,
          longTokenSwapPath: [],
          shortTokenSwapPath: [],
        },
        minLongTokenAmount: 7n,
        minShortTokenAmount: 8n,
        shouldUnwrapNativeToken: false,
        executionFee: 3n,
        callbackGasLimit: 1_000_000n,
        dataList: [],
      },
      marketTokenAmount: 9n,
    });

    const calls = decodeRouterCalls(abis.ExchangeRouter as Abi);
    expect(calls.map((call) => call.functionName)).toEqual(["sendTokens", "sendWnt", "createWithdrawal"]);
    expect(calls[0]?.args).toEqual([market, getContract(97, "WithdrawalVault"), 9n]);
    const createWithdrawal = calls[2]?.args?.[0] as {
      addresses: { callbackContract: string };
      callbackGasLimit: bigint;
    };
    expect(createWithdrawal.addresses.callbackContract).toBe(account);
    expect(createWithdrawal.callbackGasLimit).toBe(1_000_000n);
  });

  it("batches native HLV deposits and pays one execution fee per market", async () => {
    await createHlvDepositTxn({
      sdk,
      hlvAddress: hlv,
      marketAddress: market,
      longTokenAmount: 10n,
      shortTokenAmount: 10n,
      minHlvTokens: 18n,
      executionFee: 3n,
      gasPrice: 5n,
      initialLongToken: wrappedToken,
      initialShortToken: wrappedToken,
      internalUsd,
      marketAllocations: [
        { marketAddress: market, longTokenAmount: 4n, shortTokenAmount: 6n, minHlvTokens: 8n },
        { marketAddress: secondMarket, longTokenAmount: 6n, shortTokenAmount: 4n, minHlvTokens: 10n },
      ],
    });

    expect(callContract).toHaveBeenCalledWith(
      getContract(97, "HlvRouter"),
      expect.any(Array),
      "multicall",
      [expect.any(Array)],
      { value: 6n, gasPrice: 5n }
    );
    const calls = decodeRouterCalls(abis.HlvRouter as Abi);
    expect(calls.map((call) => call.functionName)).toEqual([
      "sendTokens",
      "makeExternalCalls",
      "sendWnt",
      "createHlvDeposit",
      "sendTokens",
      "makeExternalCalls",
      "sendWnt",
      "createHlvDeposit",
    ]);
    expect(calls[0]?.args).toEqual([underlyingToken, bank, 10n]);
    expect(calls[4]?.args).toEqual([underlyingToken, bank, 10n]);
  });

  it("keeps the native first-deposit receiver and configured HLV minimum", async () => {
    readContract.mockResolvedValue(20n);

    await createHlvDepositTxn({
      sdk,
      hlvAddress: hlv,
      marketAddress: market,
      longTokenAmount: 10n,
      shortTokenAmount: 0n,
      minHlvTokens: 8n,
      executionFee: 3n,
      initialLongToken: wrappedToken,
      initialShortToken: wrappedToken,
      internalUsd,
      isFirstDeposit: true,
    });

    const calls = decodeRouterCalls(abis.HlvRouter as Abi);
    const createDeposit = calls[3]?.args?.[0] as {
      addresses: { receiver: string; callbackContract: string };
      minHlvTokens: bigint;
      callbackGasLimit: bigint;
    };
    expect(createDeposit.addresses.receiver).toBe("0x0000000000000000000000000000000000000001");
    expect(createDeposit.addresses.callbackContract).toBe(zeroAddress);
    expect(createDeposit.minHlvTokens).toBe(20n);
    expect(createDeposit.callbackGasLimit).toBe(0n);
  });

  it("batches native HLV withdrawals with the HLV token", async () => {
    await createHlvWithdrawalTxn({
      sdk,
      hlvAddress: hlv,
      hlvTokenAddress: hlvToken,
      marketAddress: market,
      hlvTokenAmount: 20n,
      minLongTokenAmount: 7n,
      minShortTokenAmount: 8n,
      executionFee: 3n,
      gasPrice: 5n,
      marketAllocations: [
        { marketAddress: market, hlvTokenAmount: 9n, minLongTokenAmount: 3n, minShortTokenAmount: 4n },
        {
          marketAddress: secondMarket,
          hlvTokenAmount: 11n,
          minLongTokenAmount: 4n,
          minShortTokenAmount: 4n,
        },
      ],
    });

    expect(callContract).toHaveBeenCalledWith(
      getContract(97, "HlvRouter"),
      expect.any(Array),
      "multicall",
      [expect.any(Array)],
      { value: 6n, gasPrice: 5n }
    );
    const calls = decodeRouterCalls(abis.HlvRouter as Abi);
    expect(calls.map((call) => call.functionName)).toEqual([
      "sendTokens",
      "sendWnt",
      "createHlvWithdrawal",
      "sendTokens",
      "sendWnt",
      "createHlvWithdrawal",
    ]);
    expect(calls[0]?.args).toEqual([hlvToken, getContract(97, "HlvVault"), 9n]);
    expect(calls[3]?.args).toEqual([hlvToken, getContract(97, "HlvVault"), 11n]);
  });

  it("rejects HLV deposit allocations that could overfund a multicall", async () => {
    await expect(
      createHlvDepositTxn({
        sdk,
        hlvAddress: hlv,
        marketAddress: market,
        longTokenAmount: 10n,
        shortTokenAmount: 0n,
        minHlvTokens: 8n,
        executionFee: 3n,
        initialLongToken: wrappedToken,
        initialShortToken: wrappedToken,
        internalUsd,
        marketAllocations: [
          { marketAddress: market, longTokenAmount: 6n, shortTokenAmount: 0n, minHlvTokens: 4n },
          { marketAddress: secondMarket, longTokenAmount: 5n, shortTokenAmount: 0n, minHlvTokens: 4n },
        ],
      })
    ).rejects.toThrow("HLV deposit allocations must exactly match the funded token amounts");
    expect(callContract).not.toHaveBeenCalled();
  });

  it("rejects HLV withdrawal allocations that could overfund a multicall", async () => {
    await expect(
      createHlvWithdrawalTxn({
        sdk,
        hlvAddress: hlv,
        hlvTokenAddress: hlvToken,
        marketAddress: market,
        hlvTokenAmount: 20n,
        minLongTokenAmount: 7n,
        minShortTokenAmount: 8n,
        executionFee: 3n,
        marketAllocations: [
          { marketAddress: market, hlvTokenAmount: 10n, minLongTokenAmount: 3n, minShortTokenAmount: 4n },
          {
            marketAddress: secondMarket,
            hlvTokenAmount: 11n,
            minLongTokenAmount: 4n,
            minShortTokenAmount: 4n,
          },
        ],
      })
    ).rejects.toThrow("HLV withdrawal allocations must exactly match the funded HLV token amount");
    expect(callContract).not.toHaveBeenCalled();
  });
});
