import { withRetry } from "viem";

import {
  EXECUTION_FEE_CONFIG_V2,
  GAS_LIMITS_STATIC_CONFIG,
  GAS_PRICE_PREMIUM_MAP,
  getViemChain,
  MAX_PRIORITY_FEE_PER_GAS_MAP,
} from "configs/chains";
import { getContract } from "configs/contracts";
import {
  decreaseOrderGasLimitKey,
  depositGasLimitKey,
  ESTIMATED_GAS_FEE_BASE_AMOUNT_V2_1,
  ESTIMATED_GAS_FEE_MULTIPLIER_FACTOR,
  ESTIMATED_GAS_FEE_PER_ORACLE_PRICE,
  HLV_DEPOSIT_GAS_LIMIT,
  HLV_PER_MARKET_GAS_LIMIT,
  HLV_WITHDRAWAL_GAS_LIMIT,
  increaseOrderGasLimitKey,
  shiftGasLimitKey,
  singleSwapGasLimitKey,
  uiFeeFactorKey,
  withdrawalGasLimitKey,
} from "configs/dataStore";
import type { GasLimitsConfig } from "types/fees";
import { TokenPrices, TokensData } from "types/tokens";
import type { TradeFeesType } from "types/trade";
import { bigMath } from "utils/bigmath";
import { estimateOrderOraclePriceCount } from "utils/fees/estimateOraclePriceCount";
import { BASIS_POINTS_DIVISOR_BIGINT } from "utils/numbers";
import {
  estimateExecuteDecreaseOrderGasLimit,
  estimateExecuteIncreaseOrderGasLimit,
  getExecutionFee,
} from "utils/fees/executionFee";
import { getSwapCount } from "utils/trade";

import { Module } from "../base";
import { DecreasePositionSwapType } from "types/orders";

const DEFAULT_UI_FEE_RECEIVER_ACCOUNT = "0xff00000000000000000000000000000000000001";

export class Utils extends Module {
  private _gasLimits: GasLimitsConfig | null = null;
  async getGasLimits(): Promise<GasLimitsConfig> {
    if (this._gasLimits) {
      return this._gasLimits;
    }

    const gasLimits = await this.sdk
      .executeMulticall({
        dataStore: {
          contractAddress: getContract(this.chainId, "DataStore"),
          abiId: "DataStore",
          calls: {
            depositToken: {
              methodName: "getUint",
              params: [depositGasLimitKey()],
            },
            withdrawalMultiToken: {
              methodName: "getUint",
              params: [withdrawalGasLimitKey()],
            },
            shift: {
              methodName: "getUint",
              params: [shiftGasLimitKey()],
            },
            singleSwap: {
              methodName: "getUint",
              params: [singleSwapGasLimitKey()],
            },
            increaseOrder: {
              methodName: "getUint",
              params: [increaseOrderGasLimitKey()],
            },
            decreaseOrder: {
              methodName: "getUint",
              params: [decreaseOrderGasLimitKey()],
            },
            estimatedGasFeeBaseAmount: {
              methodName: "getUint",
              params: [ESTIMATED_GAS_FEE_BASE_AMOUNT_V2_1],
            },
            estimatedGasFeePerOraclePrice: {
              methodName: "getUint",
              params: [ESTIMATED_GAS_FEE_PER_ORACLE_PRICE],
            },
            estimatedFeeMultiplierFactor: {
              methodName: "getUint",
              params: [ESTIMATED_GAS_FEE_MULTIPLIER_FACTOR],
            },
            hlvDepositGasLimit: {
              methodName: "getUint",
              params: [HLV_DEPOSIT_GAS_LIMIT],
            },
            hlvWithdrawalGasLimit: {
              methodName: "getUint",
              params: [HLV_WITHDRAWAL_GAS_LIMIT],
            },
            hlvPerMarketGasLimit: {
              methodName: "getUint",
              params: [HLV_PER_MARKET_GAS_LIMIT],
            },
          },
        },
      })
      .then((res) => {
        const results = res.data.dataStore;

        function getBigInt(key: keyof typeof results) {
          const callResult = results[key];
          const value = callResult?.returnValues?.[0];

          if (value === undefined || value === null) {
            const rpcError = res.errors?.dataStore?.[key] ?? callResult?.error;
            const details = rpcError?.shortMessage ?? rpcError?.message;

            throw new Error(`Failed to fetch gas limit "${String(key)}"${details ? `: ${details}` : ""}`, {
              cause: rpcError,
            });
          }

          return BigInt(value);
        }

        const staticGasLimits = GAS_LIMITS_STATIC_CONFIG[this.chainId];

        return {
          depositToken: getBigInt("depositToken"),
          withdrawalMultiToken: getBigInt("withdrawalMultiToken"),
          shift: getBigInt("shift"),
          singleSwap: getBigInt("singleSwap"),
          increaseOrder: getBigInt("increaseOrder"),
          decreaseOrder: getBigInt("decreaseOrder"),
          estimatedGasFeeBaseAmount: getBigInt("estimatedGasFeeBaseAmount"),
          estimatedGasFeePerOraclePrice: getBigInt("estimatedGasFeePerOraclePrice"),
          estimatedFeeMultiplierFactor: getBigInt("estimatedFeeMultiplierFactor"),
          hlvDepositGasLimit: getBigInt("hlvDepositGasLimit"),
          hlvWithdrawalGasLimit: getBigInt("hlvWithdrawalGasLimit"),
          hlvPerMarketGasLimit: getBigInt("hlvPerMarketGasLimit"),
          createOrderGasLimit: staticGasLimits.createOrderGasLimit,
          updateOrderGasLimit: staticGasLimits.updateOrderGasLimit,
          cancelOrderGasLimit: staticGasLimits.cancelOrderGasLimit,
          tokenPermitGasLimit: staticGasLimits.tokenPermitGasLimit,
          hzAccountCollateralGasLimit: staticGasLimits.hzAccountCollateralGasLimit,
        } satisfies GasLimitsConfig;
      });

    this._gasLimits = gasLimits;

    return gasLimits;
  }

  async getEstimatedGasFee(
    tradeFeesType: TradeFeesType,
    {
      increaseAmounts,
      decreaseAmounts,
      callbackGasLimit,
    }: {
      decreaseAmounts?: { decreaseSwapType: DecreasePositionSwapType };
      increaseAmounts?: { swapsCount: number };
      callbackGasLimit: bigint;
    },
    _gasLimits?: GasLimitsConfig
  ) {
    const gasLimits = _gasLimits ?? (await this.getGasLimits());

    switch (tradeFeesType) {
      case "increase": {
        if (!increaseAmounts) return null;

        return estimateExecuteIncreaseOrderGasLimit(gasLimits, {
          swapsCount: increaseAmounts.swapsCount,
          callbackGasLimit,
        });
      }
      case "decrease": {
        if (!decreaseAmounts) return null;

        return estimateExecuteDecreaseOrderGasLimit(gasLimits, {
          callbackGasLimit,
          decreaseSwapType: decreaseAmounts.decreaseSwapType,
          swapsCount: 0,
        });
      }
      case "edit":
        return null;
    }
  }

  async getExecutionFee(
    tradeFeesType: TradeFeesType,
    tokensData: TokensData,
    nativeTokenPrices: TokenPrices | undefined,
    {
      increaseAmounts,
      decreaseAmounts,
      callbackGasLimit,
    }: {
      decreaseAmounts?: { decreaseSwapType: DecreasePositionSwapType };
      increaseAmounts?: { swapsCount: number };
      callbackGasLimit: bigint;
    },
    _gasLimits?: GasLimitsConfig,
    _gasPrice?: bigint
  ) {
    const gasLimits = _gasLimits ?? (await this.getGasLimits());
    const gasPrice = _gasPrice ?? (await this.getGasPrice());

    const estimatedGas = await this.getEstimatedGasFee(
      tradeFeesType,
      {
        increaseAmounts,
        decreaseAmounts,
        callbackGasLimit,
      },
      gasLimits
    );

    if (estimatedGas === null || estimatedGas === undefined) return undefined;

    const swapsCount = getSwapCount({
      isSwap: false,
      isIncrease: tradeFeesType === "increase",
      increaseAmounts,
      decreaseAmounts,
    });

    if (swapsCount === undefined) return undefined;
    if (tokensData === undefined) return undefined;
    if (gasPrice === undefined) return undefined;

    const oraclePriceCount = estimateOrderOraclePriceCount(swapsCount);

    return getExecutionFee(
      this.chainId,
      gasLimits,
      nativeTokenPrices,
      tokensData,
      estimatedGas,
      gasPrice,
      oraclePriceCount
    );
  }

  async getGasPrice() {
    const executionFeeConfig = EXECUTION_FEE_CONFIG_V2[this.chainId];

    const feeData = await withRetry(
      () =>
        this.sdk.publicClient.estimateFeesPerGas({
          chain: getViemChain(this.chainId),
          type: "legacy",
        }),
      {
        retryCount: 2,
        shouldRetry: ({ error }) => {
          const isInvalidBlockError = error?.message?.includes("invalid value for value.hash");

          return isInvalidBlockError;
        },
      }
    );

    let gasPrice = feeData.gasPrice ?? 0n;

    if (executionFeeConfig?.shouldUseMaxPriorityFeePerGas) {
      const maxPriorityFeePerGas = bigMath.max(
        feeData?.maxPriorityFeePerGas ?? 0n,
        MAX_PRIORITY_FEE_PER_GAS_MAP[this.chainId] ?? 0n
      );

      gasPrice = gasPrice + maxPriorityFeePerGas;
    }

    const bufferBps = executionFeeConfig?.defaultBufferBps ?? 0;
    const buffer = bigMath.mulDiv(gasPrice, BigInt(bufferBps), BASIS_POINTS_DIVISOR_BIGINT);
    gasPrice = gasPrice + buffer;

    const premium = GAS_PRICE_PREMIUM_MAP[this.chainId] ?? 0n;
    const price = gasPrice + premium;

    return BigInt(price);
  }

  private _uiFeeFactor = 0n;
  async getUiFeeFactor() {
    if (this._uiFeeFactor) {
      return this._uiFeeFactor;
    }

    const uiFeeReceiverAccount = this.sdk.config.settings?.uiFeeReceiverAccount ?? DEFAULT_UI_FEE_RECEIVER_ACCOUNT;

    const uiFeeFactor = await this.sdk
      .executeMulticall({
        dataStore: {
          contractAddress: getContract(this.chainId, "DataStore"),
          abiId: "DataStore",
          calls: {
            keys: {
              methodName: "getUint",
              params: [uiFeeFactorKey(uiFeeReceiverAccount)],
            },
          },
        },
      })
      .then((res) => {
        return BigInt(res.data.dataStore.keys.returnValues[0]);
      });

    return uiFeeFactor ?? 0n;
  }
}
