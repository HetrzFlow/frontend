import { ClaimableFundingData, Market } from "types/markets";
import { Module } from "../base";
import { getByKey } from "utils/objects";
import { getMarketDivisor } from "utils/markets";
import { getContract } from "configs/contracts";
import { abis } from "abis/index";
import { Abi, Address, encodeFunctionData, getAddress } from "viem";
import { buildClaimableFundingDataRequest } from "./transactions";

export class Claim extends Module {
  /**
   * get claimable funding fee data
   */
  async getClaimableFundingData(markets: Market[]) {
    const chainId = this.chainId;
    const account = this.account;

    if (!account) {
      return {};
    }

    const marketsMap = markets.reduce(
      (map, market) => {
        map[market.marketTokenAddress] = market;
        return map;
      },
      {} as Record<string, Market>
    );

    return this.sdk
      .executeMulticall(
        buildClaimableFundingDataRequest({
          chainId,
          account,
          markets,
        })
      )
      .then((result) => {
        return Object.entries(result.data).reduce(
          (claimableFundingData, [marketAddress, callsResult]: [string, any]) => {
            const market = getByKey(marketsMap, marketAddress);
            const marketErrors = result.errors?.[marketAddress];
            const longAmount = callsResult?.claimableFundingAmountLong?.returnValues?.[0];
            const shortAmount = callsResult?.claimableFundingAmountShort?.returnValues?.[0];

            if (!market || marketErrors || longAmount === undefined || shortAmount === undefined) {
              return claimableFundingData;
            }

            const marketDivisor = getMarketDivisor(market);

            claimableFundingData[marketAddress] = {
              longTokenAddress: market.longTokenAddress as Address,
              shortTokenAddress: market.shortTokenAddress as Address,
              claimableFundingAmountLong: BigInt(longAmount) / marketDivisor,
              claimableFundingAmountShort: BigInt(shortAmount) / marketDivisor,
            };

            return claimableFundingData;
          },
          {} as ClaimableFundingData
        );
      });
  }

  /**
   * claim funding fees for multiple markets
   * @param params [marketAddress, tokenAddress][]
   */
  async claimFundingFees(params: [string, string][]) {
    const account = this.account;

    if (!account) {
      throw new Error("Account is required to claim funding fees");
    }

    return this.sdk.callContract(
      getContract(this.chainId, "ExchangeRouter"),
      abis.ExchangeRouter as Abi,
      "claimFundingFees",
      [params.map(([market]) => market), params.map(([, token]) => token), account]
    );
  }

  /**
   * claim price impact rebates for multiple markets
   * @param params [marketAddress, tokenAddress, timeKey][]
   */
  async claimPriceImpactRebates(params: [string, string, bigint][]) {
    const account = this.account;

    if (!account) {
      throw new Error("Account is required to claim funding fees");
    }

    return this.sdk.callContract(
      getContract(this.chainId, "ExchangeRouter"),
      abis.ExchangeRouter as Abi,
      "claimCollateral",
      [
        params.map(([market]) => market),
        params.map(([, token]) => token),
        params.map(([, , timeKey]) => timeKey),
        account,
      ]
    );
  }

  /**
   * claim funding fees and price impact rebates for multiple markets
   * @param fundingFeeParams [marketAddresses, tokenAddresses]
   * @param priceImpactRebateParams [marketAddress, tokenAddress, timeKey][]
   */
  async claimAllRebates({
    fundingFeeParams,
    priceImpactRebateParams,
  }: {
    fundingFeeParams: [string, string][];
    priceImpactRebateParams: [string, string, bigint][];
  }) {
    const account = this.account;

    if (!account) {
      throw new Error("Account is required to claim funding fees");
    }
    if (!fundingFeeParams.length) {
      return this.claimPriceImpactRebates(priceImpactRebateParams);
    }
    if (!priceImpactRebateParams.length) {
      return this.claimFundingFees(fundingFeeParams);
    }

    const fundingMarkets = fundingFeeParams.map(([market]) => getAddress(market));
    const fundingTokens = fundingFeeParams.map(([, token]) => getAddress(token));
    const collateralMarkets = priceImpactRebateParams.map(([market]) => getAddress(market));
    const collateralTokens = priceImpactRebateParams.map(([, token]) => getAddress(token));
    const timeKeys = priceImpactRebateParams.map(([, , timeKey]) => timeKey);

    const calls = [
      encodeFunctionData({
        abi: abis.ExchangeRouter,
        functionName: "claimFundingFees",
        args: [fundingMarkets, fundingTokens, account],
      }),
      encodeFunctionData({
        abi: abis.ExchangeRouter,
        functionName: "claimCollateral",
        args: [collateralMarkets, collateralTokens, timeKeys, account],
      }),
    ];

    return this.sdk.callContract(getContract(this.chainId, "ExchangeRouter"), abis.ExchangeRouter as Abi, "multicall", [
      calls,
    ]);
  }
}
