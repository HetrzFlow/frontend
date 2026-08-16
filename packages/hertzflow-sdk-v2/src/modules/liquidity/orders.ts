import { type Abi, type Address, encodeFunctionData, isAddressEqual, zeroAddress } from "viem";

import { abis } from "abis";
import { getContract } from "configs/contracts";
import {
  accountDepositListKey,
  accountHlvDepositListKey,
  accountHlvWithdrawalListKey,
  accountWithdrawalListKey,
} from "configs/dataStore";

import type { HertzFlowSDK } from "../..";

export type LiquidityOrderKind = "deposit" | "withdrawal";
export type LiquidityOrderScope = "market" | "hlv";

type LiquidityOrderAddresses = {
  account: Address;
  receiver: Address;
  market: Address;
  hlv?: Address;
};

type LiquidityOrderNumbers = {
  initialLongTokenAmount?: bigint;
  initialShortTokenAmount?: bigint;
  marketTokenAmount?: bigint;
  hlvTokenAmount?: bigint;
  minMarketTokens?: bigint;
  minHlvTokens?: bigint;
  minLongTokenAmount?: bigint;
  minShortTokenAmount?: bigint;
  updatedAtTime: bigint;
  executionFee: bigint;
};

export type LiquidityOrder = {
  key: `0x${string}`;
  owner: Address;
  kind: LiquidityOrderKind;
  scope: LiquidityOrderScope;
  addresses: LiquidityOrderAddresses;
  numbers: LiquidityOrderNumbers;
};

export type GetLiquidityOrdersParams = {
  account?: Address;
  marketAddress?: Address;
  scope?: LiquidityOrderScope;
  /** Maximum number of recent pending keys loaded for each scope and order kind. */
  limit?: number;
};

const DEFAULT_LIQUIDITY_ORDERS_LIMIT = 1_000;
const FIRST_DEPOSIT_RECEIVER = "0x0000000000000000000000000000000000000001" as Address;

type RawLiquidityOrder = {
  addresses: LiquidityOrderAddresses;
  numbers: LiquidityOrderNumbers;
};

const getOrderKeys = async ({
  sdk,
  listKey,
  limit,
}: {
  sdk: HertzFlowSDK;
  listKey: string;
  limit: number;
}) => {
  const dataStore = getContract(sdk.chainId, "DataStore");
  return sdk.publicClient.readContract({
    address: dataStore,
    abi: abis.DataStore,
    functionName: "getBytes32ValuesAt",
    args: [listKey as `0x${string}`, 0n, BigInt(limit)],
  });
};

const getOrdersByKeys = async ({
  sdk,
  keys,
  owner,
  kind,
  scope,
}: {
  sdk: HertzFlowSDK;
  keys: readonly `0x${string}`[];
  owner: Address;
  kind: LiquidityOrderKind;
  scope: LiquidityOrderScope;
}): Promise<LiquidityOrder[]> => {
  if (keys.length === 0) return [];

  const isHlv = scope === "hlv";
  const address = getContract(sdk.chainId, isHlv ? "HlvReader" : "SyntheticsReader");
  const abi = (isHlv ? abis.HlvReader : abis.SyntheticsReader) as Abi;
  const functionName = isHlv
    ? kind === "deposit"
      ? "getHlvDeposit"
      : "getHlvWithdrawal"
    : kind === "deposit"
      ? "getDeposit"
      : "getWithdrawal";
  const dataStore = getContract(sdk.chainId, "DataStore");
  const results = await sdk.publicClient.multicall({
    contracts: keys.map((key) => ({
      address,
      abi,
      functionName,
      args: [dataStore, key],
    })),
  });

  return results.flatMap((result, index) => {
    if (result.status !== "success") return [];
    const rawOrder = result.result as RawLiquidityOrder | undefined;
    const orderAccount = rawOrder?.addresses?.account;
    const targetAddress = scope === "hlv" ? rawOrder?.addresses?.hlv : rawOrder?.addresses?.market;
    if (
      !rawOrder ||
      !orderAccount ||
      !isAddressEqual(orderAccount, owner) ||
      !targetAddress ||
      isAddressEqual(targetAddress, zeroAddress)
    ) {
      return [];
    }

    return [
      {
        key: keys[index]!,
        owner,
        kind,
        scope,
        ...rawOrder,
      },
    ];
  });
};

export async function getLiquidityOrders(
  sdk: HertzFlowSDK,
  { account = sdk.account, marketAddress, scope, limit = DEFAULT_LIQUIDITY_ORDERS_LIMIT }: GetLiquidityOrdersParams = {}
): Promise<LiquidityOrder[]> {
  if (!account) return [];

  const normalizedLimit = Number.isFinite(limit) ? Math.max(1, Math.floor(limit)) : DEFAULT_LIQUIDITY_ORDERS_LIMIT;
  const requests = [
    {
      kind: "deposit" as const,
      scope: "market" as const,
      listKey: accountDepositListKey(account),
    },
    {
      kind: "withdrawal" as const,
      scope: "market" as const,
      listKey: accountWithdrawalListKey(account),
    },
    {
      kind: "deposit" as const,
      scope: "hlv" as const,
      listKey: accountHlvDepositListKey(account),
    },
    {
      kind: "withdrawal" as const,
      scope: "hlv" as const,
      listKey: accountHlvWithdrawalListKey(account),
    },
  ].filter((request) => !scope || request.scope === scope);

  const keysByRequest = await Promise.all(
    requests.map((request) =>
      getOrderKeys({
        sdk,
        listKey: request.listKey,
        limit: normalizedLimit,
      })
    )
  );
  const orderGroups = await Promise.all(
    requests.map((request, index) =>
      getOrdersByKeys({
        sdk,
        keys: keysByRequest[index] ?? [],
        owner: account,
        kind: request.kind,
        scope: request.scope,
      })
    )
  );

  const ownedOrders = orderGroups
    .flat()
    .filter((order) => {
      if (isAddressEqual(order.addresses.receiver, FIRST_DEPOSIT_RECEIVER)) return false;
      if (!marketAddress) return true;
      const orderAddress = order.scope === "hlv" ? order.addresses.hlv : order.addresses.market;
      return Boolean(orderAddress && isAddressEqual(orderAddress, marketAddress));
    })
    .sort((a, b) => Number(b.numbers.updatedAtTime - a.numbers.updatedAtTime));

  return ownedOrders;
}

export async function cancelLiquidityOrder(sdk: HertzFlowSDK, order: Pick<LiquidityOrder, "key" | "kind" | "scope">) {
  const isHlv = order.scope === "hlv";
  const address = getContract(sdk.chainId, isHlv ? "HlvRouter" : "ExchangeRouter");
  const abi = (isHlv ? abis.HlvRouter : abis.ExchangeRouter) as Abi;
  const method = isHlv
    ? order.kind === "deposit"
      ? "cancelHlvDeposit"
      : "cancelHlvWithdrawal"
    : order.kind === "deposit"
      ? "cancelDeposit"
      : "cancelWithdrawal";

  return sdk.callContract(address, abi, method, [order.key]);
}

export async function cancelLiquidityOrders(
  sdk: HertzFlowSDK,
  orders: Pick<LiquidityOrder, "key" | "kind" | "scope">[]
) {
  if (orders.length === 0) throw new Error("At least one liquidity order is required");

  const scope = orders[0].scope;
  if (orders.some((order) => order.scope !== scope)) {
    throw new Error("Liquidity orders in a multicall must use the same router");
  }

  const isHlv = scope === "hlv";
  const address = getContract(sdk.chainId, isHlv ? "HlvRouter" : "ExchangeRouter");
  const abi = (isHlv ? abis.HlvRouter : abis.ExchangeRouter) as Abi;
  const calls = orders.map((order) =>
    encodeFunctionData({
      abi,
      functionName: isHlv
        ? order.kind === "deposit"
          ? "cancelHlvDeposit"
          : "cancelHlvWithdrawal"
        : order.kind === "deposit"
          ? "cancelDeposit"
          : "cancelWithdrawal",
      args: [order.key],
    })
  );

  return sdk.callContract(address, abi, "multicall", [calls]);
}
