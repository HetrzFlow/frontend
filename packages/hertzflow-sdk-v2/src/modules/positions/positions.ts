import { Address, zeroAddress } from "viem";

import { getContract } from "configs/contracts";
import {
  CLAIMABLE_COLLATERAL_DELAY_KEY,
  CLAIMABLE_COLLATERAL_REDUCTION_FACTOR_KEY,
  CLAIMABLE_COLLATERAL_TIME_DIVISOR_KEY,
  hashedPositionKey,
  hashedZfpPositionKey,
  MAX_AUTO_CANCEL_ORDERS_KEY,
  MIN_COLLATERAL_USD_KEY,
  MIN_POSITION_SIZE_USD_KEY,
  MIN_ZFP_POSITION_SIZE_USD_KEY,
} from "configs/dataStore";
import { ContractMarketPrices, MarketsData } from "types/markets";
import { PositionsData } from "types/positions";
import { TokenPrices } from "types/tokens";
import { getContractMarketPrices } from "utils/markets";
import type { MulticallRequestConfig } from "utils/multicall";
import { getPositionKey } from "utils/positions";

import { Module } from "../base";

type PositionsResult = {
  positionsData?: PositionsData;
  allPossiblePositionsKeys?: string[];
  error?: Error;
};

type PositionsConstantsResult = {
  minCollateralUsd?: bigint;
  minPositionSizeUsd?: bigint;
  minZFPPositionSizeUsd?: bigint;
  maxAutoCancelOrders?: bigint;
  claimableCollateralDelay: bigint;
  claimableCollateralReductionFactor: bigint;
  claimableCollateralTimeDivisor: bigint;
};

export class Positions extends Module {
  static MAX_PENDING_UPDATE_AGE = 600 * 1000; // 10 minutes

  async getPositions(p: {
    prices: Record<Address, TokenPrices>;
    marketsData: MarketsData;
    tokensData: Record<Address, { decimals: number }>;
    start?: number;
    end?: number;
  }): Promise<PositionsResult> {
    const chainId = this.chainId;
    const account = this.sdk.config.account;

    const accountPositionsRequest = {
      reader: {
        contractAddress: getContract(chainId, "SyntheticsReader"),
        abiId: "SyntheticsReader",
        calls: {
          positions: {
            methodName: "getAccountPositions",
            params: [getContract(chainId, "DataStore"), account, p.start ?? 0, p.end ?? 1000],
          },
        },
      },
    } satisfies MulticallRequestConfig<any>;

    const rawPositions = await this.sdk.executeMulticall(accountPositionsRequest).then((res) => {
      const positions = res.data.reader.positions.returnValues;

      return positions.filter((position: any) => {
        const { numbers } = position;
        return numbers.increasedAtTime != 0n && numbers.sizeInUsd > 0n;
      });
    });

    if (!rawPositions.length) {
      return {
        positionsData: {},
      };
    }

    const positionsForInfo = rawPositions
      .map((position: any) => {
        const { addresses } = position;
        const { market: marketAddress } = addresses;
        const market = p.marketsData[marketAddress];
        const marketPrices = market ? getContractMarketPrices(p.tokensData, market, p.prices, chainId) : undefined;

        if (!marketPrices) {
          return undefined;
        }

        return {
          position,
          marketPrices,
        };
      })
      .filter((position): position is { position: any; marketPrices: ContractMarketPrices } => Boolean(position));

    if (!positionsForInfo.length) {
      return {
        positionsData: {},
      };
    }

    const positionInfoRequest = {
      reader: {
        contractAddress: getContract(chainId, "SyntheticsReader"),
        abiId: "SyntheticsReader",
        calls: {
          positions: {
            methodName: "getPositionInfoList",
            params: [
              getContract(chainId, "DataStore"),
              getContract(chainId, "ReferralStorage"),
              positionsForInfo.map(({ position }) => {
                const { addresses, flags } = position;
                const { account, market: marketAddress, collateralToken: collateralTokenAddress } = addresses;
                const isLong = flags.isLong;
                const isZFP = (flags.isZFP as boolean) ?? false;

                return isZFP
                  ? hashedZfpPositionKey(account, marketAddress, collateralTokenAddress, isLong)
                  : hashedPositionKey(account, marketAddress, collateralTokenAddress, isLong);
              }),
              positionsForInfo.map(({ marketPrices }) => marketPrices),
              zeroAddress,
            ],
          },
        },
      },
    } satisfies MulticallRequestConfig<any>;

    const positionsData = await this.sdk.executeMulticall(positionInfoRequest).then((res) => {
      const positions = res.data.reader.positions.returnValues;

      return positions.reduce((positionsMap: PositionsData, positionInfo: any) => {
        const { position, fees, basePnlUsd } = positionInfo;
        const { addresses, numbers, flags, data } = position;
        const { account, market: marketAddress, collateralToken: collateralTokenAddress } = addresses;

        // Empty position
        if (numbers.increasedAtTime == 0n) {
          return positionsMap;
        }

        const positionKey = getPositionKey(
          account,
          marketAddress,
          collateralTokenAddress,
          flags.isLong,
          (flags.isZFP as boolean) ?? false
        );
        const isZFP = (flags.isZFP as boolean) ?? false;
        const contractPositionKey = isZFP
          ? hashedZfpPositionKey(account, marketAddress, collateralTokenAddress, flags.isLong)
          : hashedPositionKey(account, marketAddress, collateralTokenAddress, flags.isLong);

        positionsMap[positionKey] = {
          key: positionKey,
          contractKey: contractPositionKey,
          account,
          marketAddress,
          collateralTokenAddress,
          sizeInUsd: numbers.sizeInUsd,
          sizeInTokens: numbers.sizeInTokens,
          collateralAmount: numbers.collateralAmount,
          increasedAtTime: numbers.increasedAtTime,
          decreasedAtTime: numbers.decreasedAtTime,
          pendingImpactAmount: numbers.pendingImpactAmount,
          isLong: flags.isLong,
          isZFP,
          pendingLossRebateUsd: numbers.pendingLossRebateUsd ?? 0n,
          pendingBorrowingFeesUsd: fees.borrowing.borrowingFeeUsd,
          fundingFeeAmount: fees.funding.fundingFeeAmount,
          claimableLongTokenAmount: fees.funding.claimableLongTokenAmount,
          claimableShortTokenAmount: fees.funding.claimableShortTokenAmount,
          pnl: basePnlUsd,
          positionFeeAmount: fees.positionFeeAmount,
          traderDiscountAmount: fees.referral.traderDiscountAmount,
          uiFeeAmount: fees.ui.uiFeeAmount,
          data,
        };

        return positionsMap;
      }, {} as PositionsData);
    });

    return {
      positionsData,
    };
  }

  private _positionsConstants: PositionsConstantsResult | undefined = undefined;
  async getPositionsConstants(): Promise<PositionsConstantsResult> {
    if (this._positionsConstants) {
      return this._positionsConstants;
    }

    const constants = await this.sdk
      .executeMulticall({
        dataStore: {
          contractAddress: getContract(this.chainId, "DataStore"),
          abiId: "DataStore",
          calls: {
            minCollateralUsd: {
              methodName: "getUint",
              params: [MIN_COLLATERAL_USD_KEY],
            },
            minPositionSizeUsd: {
              methodName: "getUint",
              params: [MIN_POSITION_SIZE_USD_KEY],
            },
            minZFPPositionSizeUsd: {
              methodName: "getUint",
              params: [MIN_ZFP_POSITION_SIZE_USD_KEY],
            },
            maxAutoCancelOrders: {
              methodName: "getUint",
              params: [MAX_AUTO_CANCEL_ORDERS_KEY],
            },
            claimableCollateralDelay: {
              methodName: "getUint",
              params: [CLAIMABLE_COLLATERAL_DELAY_KEY],
            },
            claimableCollateralReductionFactor: {
              methodName: "getUint",
              params: [CLAIMABLE_COLLATERAL_REDUCTION_FACTOR_KEY],
            },
            claimableCollateralTimeDivisor: {
              methodName: "getUint",
              params: [CLAIMABLE_COLLATERAL_TIME_DIVISOR_KEY],
            },
          },
        },
      })
      .then((res) => {
        return {
          minCollateralUsd: res.data.dataStore.minCollateralUsd.returnValues[0],
          minPositionSizeUsd: res.data.dataStore.minPositionSizeUsd.returnValues[0],
          minZFPPositionSizeUsd: res.data.dataStore.minZFPPositionSizeUsd.returnValues[0],
          maxAutoCancelOrders: res.data.dataStore.maxAutoCancelOrders.returnValues[0],
          claimableCollateralDelay: res.data.dataStore.claimableCollateralDelay.returnValues[0],
          claimableCollateralReductionFactor: res.data.dataStore.claimableCollateralReductionFactor.returnValues[0],
          claimableCollateralTimeDivisor: res.data.dataStore.claimableCollateralTimeDivisor.returnValues[0],
        };
      });

    this._positionsConstants = constants;
    return constants;
  }

}
