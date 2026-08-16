import { ContractsChainId } from "configs/chains";
import { getContract } from "configs/contracts";
import { CLAIMABLE_FUNDING_AMOUNT } from "configs/dataStore";
import { Market } from "types/markets";
import { hashDataMap } from "utils/hash";
import { ContractCallsConfig } from "utils/multicall";
import { Address } from "viem";

export function buildClaimableFundingDataRequest({
  markets,
  chainId,
  account,
}: {
  markets: Market[];
  account: string;
  chainId: ContractsChainId;
}) {
  if (!markets.length) {
    return {};
  }

  return markets.reduce(
    (request, market) => {
      const { marketTokenAddress, longTokenAddress, shortTokenAddress } = market;

      const keys = hashDataMap({
        claimableFundingAmountLong: [
          ["bytes32", "address", "address", "address"],
          [CLAIMABLE_FUNDING_AMOUNT, marketTokenAddress, longTokenAddress, account],
        ],
        claimableFundingAmountShort: [
          ["bytes32", "address", "address", "address"],
          [CLAIMABLE_FUNDING_AMOUNT, marketTokenAddress, shortTokenAddress, account],
        ],
      });

      request[marketTokenAddress] = {
        contractAddress: getContract(chainId, "DataStore"),
        abiId: "DataStore",
        calls: {
          claimableFundingAmountLong: {
            methodName: "getUint",
            params: [keys.claimableFundingAmountLong],
          },
          claimableFundingAmountShort: {
            methodName: "getUint",
            params: [keys.claimableFundingAmountShort],
          },
        },
      } satisfies ContractCallsConfig<any>;

      return request;
    },
    {} as Record<string, ContractCallsConfig<any>>
  );
}

export function buildClaimFundingFeesTxnPayload(params: [string, string][], account: Address) {
  const marketAddresses: string[] = [];
  const tokenAddresses: string[] = [];

  for (const [marketAddress, tokenAddress] of params) {
    marketAddresses.push(marketAddress);
    tokenAddresses.push(tokenAddress);
  }

  return [marketAddresses, tokenAddresses, account];
}

export function buildClaimPriceImpactRebatesTxnPayload(params: [string, string, bigint][], account: Address) {
  const marketAddresses: string[] = [];
  const tokenAddresses: string[] = [];
  const timeKeys: bigint[] = [];

  for (const [marketAddress, tokenAddress, timeKey] of params) {
    marketAddresses.push(marketAddress);
    tokenAddresses.push(tokenAddress);
    timeKeys.push(timeKey);
  }

  return [marketAddresses, tokenAddresses, timeKeys, account];
}
