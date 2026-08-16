import { ContractsChainId, getExcessiveExecutionFee, getHighExecutionFee, getMinExecutionFeeUsd } from "configs/chains";
import { USD_DECIMALS } from "configs/factors";
import { NATIVE_TOKEN_ADDRESS } from "configs/tokens";
import { ExecutionFee, GasLimitsConfig, L1ExpressOrderGasReference } from "types/fees";
import { DecreasePositionSwapType } from "types/orders";
import { TokenData, TokenPrices, TokensData } from "types/tokens";
import { bigMath } from "utils/bigmath";
import { applyFactor, expandDecimals } from "utils/numbers";
import { convertBetweenTokens, convertToTokenAmount, convertToUsd, getTokenData } from "utils/tokens";

export function getExecutionFee(
  chainId: number,
  gasLimits: GasLimitsConfig,
  nativeTokenPrices: TokenPrices | undefined,
  tokensData: TokensData,
  estimatedGasLimit: bigint,
  gasPrice: bigint,
  oraclePriceCount: bigint,
  numberOfParts?: number
): ExecutionFee | undefined {
  const nativeToken = getTokenData(tokensData, NATIVE_TOKEN_ADDRESS);

  if (!nativeToken) return undefined;

  // #region adjustGasLimitForEstimate. Copy from contract.
  let baseGasLimit = gasLimits.estimatedGasFeeBaseAmount;
  baseGasLimit += gasLimits.estimatedGasFeePerOraclePrice * oraclePriceCount;
  const multiplierFactor = gasLimits.estimatedFeeMultiplierFactor;
  const gasLimit = baseGasLimit + applyFactor(estimatedGasLimit, multiplierFactor);
  // #endregion

  // avoid botanix gas spikes when chain is not actively used
  const minGasCostUsd = getMinExecutionFeeUsd(chainId as ContractsChainId);
  const minGasCost = nativeTokenPrices
    ? convertToTokenAmount(minGasCostUsd, nativeToken.decimals, nativeTokenPrices.minPrice)
    : undefined;

  let feeTokenAmountPerExecution = gasLimit * gasPrice;

  if (minGasCost) {
    feeTokenAmountPerExecution = bigMath.max(feeTokenAmountPerExecution, minGasCost);
  }

  const feeTokenAmount = feeTokenAmountPerExecution * BigInt(numberOfParts ?? 1);

  const feeUsd = nativeTokenPrices
    ? convertToUsd(feeTokenAmount, nativeToken.decimals, nativeTokenPrices.minPrice)!
    : 0n;

  const isFeeHigh = feeUsd > expandDecimals(getHighExecutionFee(chainId as ContractsChainId), USD_DECIMALS);
  const isFeeVeryHigh = feeUsd > expandDecimals(getExcessiveExecutionFee(chainId as ContractsChainId), USD_DECIMALS);

  return {
    feeUsd,
    feeTokenAmount,
    feeToken: nativeToken,
    gasLimit,
    isFeeHigh,
    isFeeVeryHigh,
  };
}

export function estimateRelayerGasLimit({
  gasLimits,
  tokenPermitsCount,
  feeSwapsCount,
  feeExternalCallsGasLimit,
  oraclePriceCount,
  transactionPayloadGasLimit,
  l1GasLimit,
}: {
  gasLimits: GasLimitsConfig;
  tokenPermitsCount: number;
  feeSwapsCount: number;
  feeExternalCallsGasLimit: bigint;
  oraclePriceCount: number;
  transactionPayloadGasLimit: bigint;
  l1GasLimit: bigint;
}) {
  const feeSwapsGasLimit = gasLimits.singleSwap * BigInt(feeSwapsCount);
  const oraclePricesGasLimit = gasLimits.estimatedGasFeePerOraclePrice * BigInt(oraclePriceCount);
  const tokenPermitsGasLimit = gasLimits.tokenPermitGasLimit * BigInt(tokenPermitsCount);

  const relayParamsGasLimit = feeSwapsGasLimit + oraclePricesGasLimit + tokenPermitsGasLimit + feeExternalCallsGasLimit;

  return relayParamsGasLimit + transactionPayloadGasLimit + l1GasLimit;
}

export function approximateL1GasBuffer({
  l1Reference,
  sizeOfData,
}: {
  l1Reference: L1ExpressOrderGasReference;
  sizeOfData: bigint;
}) {
  const evaluated = Math.round(
    (Number(l1Reference.gasLimit) * Math.log(Number(sizeOfData))) / Math.log(Number(l1Reference.sizeOfData))
  );

  const l1GasLimit = Math.abs(evaluated) < Infinity ? BigInt(evaluated) : l1Reference.gasLimit;

  return l1GasLimit;
}

export function estimateBatchGasLimit({
  gasLimits,
  createOrdersCount,
  updateOrdersCount,
  cancelOrdersCount,
  externalCallsGasLimit,
  isHzAccount,
}: {
  gasLimits: GasLimitsConfig;
  createOrdersCount: number;
  updateOrdersCount: number;
  cancelOrdersCount: number;
  externalCallsGasLimit: bigint;
  isHzAccount: boolean;
}) {
  const createOrdersGasLimit = gasLimits.createOrderGasLimit * BigInt(createOrdersCount);
  const updateOrdersGasLimit = gasLimits.updateOrderGasLimit * BigInt(updateOrdersCount);
  const cancelOrdersGasLimit = gasLimits.cancelOrderGasLimit * BigInt(cancelOrdersCount);
  const hzAccountOverhead = isHzAccount ? gasLimits.hzAccountCollateralGasLimit : 0n;

  return createOrdersGasLimit + updateOrdersGasLimit + cancelOrdersGasLimit + externalCallsGasLimit + hzAccountOverhead;
}

export function estimateBatchMinGasPaymentTokenAmount({
  chainId,
  gasPaymentToken,
  isHzAccount,
  gasTokenPrices,
  relayFeeToken,
  gasPrice,
  gasLimits,
  l1Reference,
  tokensData,
  createOrdersCount = 1,
  updateOrdersCount = 0,
  cancelOrdersCount = 0,
  executionFeeAmount,
}: {
  chainId: ContractsChainId;
  isHzAccount: boolean;
  gasTokenPrices: TokenPrices;
  gasLimits: GasLimitsConfig;
  gasPaymentToken: TokenData;
  relayFeeToken: TokenData;
  tokensData: TokensData;
  gasPrice: bigint;
  l1Reference: L1ExpressOrderGasReference | undefined;
  createOrdersCount: number;
  updateOrdersCount: number;
  cancelOrdersCount: number;
  executionFeeAmount: bigint | undefined;
}) {
  const batchGasLimit = estimateBatchGasLimit({
    gasLimits,
    createOrdersCount,
    updateOrdersCount,
    cancelOrdersCount,
    externalCallsGasLimit: 0n,
    isHzAccount,
  });

  const relayerGasLimit = estimateRelayerGasLimit({
    gasLimits,
    tokenPermitsCount: 0,
    feeSwapsCount: relayFeeToken.address === gasPaymentToken.address ? 0 : 1,
    feeExternalCallsGasLimit: 0n,
    oraclePriceCount: 2,
    transactionPayloadGasLimit: batchGasLimit,
    l1GasLimit: l1Reference?.gasLimit ?? 0n,
  });

  const gasLimit = relayerGasLimit + batchGasLimit;

  const feeAmount = gasLimit * gasPrice;

  const executionGasLimit = estimateExecuteIncreaseOrderGasLimit(gasLimits, {
    swapsCount: 2,
    callbackGasLimit: 0n,
  });

  const executionFee =
    executionFeeAmount ??
    getExecutionFee(chainId, gasLimits, gasTokenPrices, tokensData, executionGasLimit, gasPrice, 4n)?.feeTokenAmount;

  let totalFee = feeAmount + (executionFee ?? 0n);

  const minGasPaymentTokenBalance = convertBetweenTokens(totalFee, relayFeeToken, gasPaymentToken, false)!;

  return minGasPaymentTokenBalance;
}

/**
 * Copy from contract: `estimateExecuteIncreaseOrderGasLimit`
 */
export function estimateExecuteIncreaseOrderGasLimit(
  gasLimits: GasLimitsConfig,
  order: { swapsCount?: number; callbackGasLimit?: bigint }
) {
  const gasPerSwap = gasLimits.singleSwap;
  const swapsCount = BigInt(order.swapsCount ?? 0);

  return gasLimits.increaseOrder + gasPerSwap * swapsCount + (order.callbackGasLimit ?? 0n);
}

/**
 * Copy from contract: `estimateExecuteDecreaseOrderGasLimit`
 */
export function estimateExecuteDecreaseOrderGasLimit(
  gasLimits: GasLimitsConfig,
  order: { swapsCount: number; callbackGasLimit?: bigint; decreaseSwapType?: DecreasePositionSwapType }
) {
  const gasPerSwap = gasLimits.singleSwap;
  let swapsCount = BigInt(order.swapsCount);

  if (order.decreaseSwapType !== DecreasePositionSwapType.NoSwap) {
    swapsCount += 1n;
  }

  return gasLimits.decreaseOrder + gasPerSwap * swapsCount + (order.callbackGasLimit ?? 0n);
}

/**
 * Only market-token deposits. Do not confuse with increase with zero delta size.
 *
 * Copy from contract: `estimateExecuteDepositGasLimit`
 */
export function estimateExecuteDepositGasLimit(
  gasLimits: GasLimitsConfig,
  deposit: {
    swapsCount?: number | bigint;
    callbackGasLimit?: bigint;
  }
) {
  const gasPerSwap = gasLimits.singleSwap;
  const swapsCount = BigInt(deposit.swapsCount ?? 0);
  const gasForSwaps = swapsCount * gasPerSwap;

  return gasLimits.depositToken + (deposit.callbackGasLimit ?? 0n) + gasForSwaps;
}

export function estimateExecuteHlvDepositGasLimit(
  gasLimits: GasLimitsConfig,
  {
    marketsCount,
    isMarketTokenDeposit,
    swapsCount,
    callbackGasLimit,
  }: {
    isMarketTokenDeposit: boolean;
    marketsCount: bigint;
    swapsCount: bigint;
    callbackGasLimit?: bigint;
  }
) {
  const gasPerHlvPerMarket = gasLimits.hlvPerMarketGasLimit;
  const gasForHlvMarkets = gasPerHlvPerMarket * marketsCount;
  const hlvDepositGasLimit = gasLimits.hlvDepositGasLimit;
  const gasLimit = hlvDepositGasLimit + (callbackGasLimit ?? 0n) + gasForHlvMarkets;

  if (isMarketTokenDeposit) {
    return gasLimit;
  }

  const gasPerSwap = gasLimits.singleSwap;
  const gasForSwaps = swapsCount * gasPerSwap;

  return gasLimit + gasLimits.depositToken + gasForSwaps;
}

export function estimateExecuteHlvWithdrawalGasLimit(
  gasLimits: GasLimitsConfig,
  {
    marketsCount,
    swapsCount,
    callbackGasLimit,
  }: {
    marketsCount: bigint;
    swapsCount: bigint;
    callbackGasLimit?: bigint;
  }
) {
  const gasPerHlvPerMarket = gasLimits.hlvPerMarketGasLimit;
  const gasForHlvMarkets = gasPerHlvPerMarket * marketsCount;
  const hlvWithdrawalGasLimit = gasLimits.hlvWithdrawalGasLimit;
  const gasLimit = hlvWithdrawalGasLimit + (callbackGasLimit ?? 0n) + gasForHlvMarkets;

  const gasPerSwap = gasLimits.singleSwap;
  const gasForSwaps = swapsCount * gasPerSwap;

  return gasLimit + gasLimits.withdrawalMultiToken + gasForSwaps;
}

/**
 * Only market-token withdrawals. Do not confuse with decrease with zero delta size.
 *
 * Copy from contract: `estimateExecuteWithdrawalGasLimit`
 */
export function estimateExecuteWithdrawalGasLimit(
  gasLimits: GasLimitsConfig,
  withdrawal: { callbackGasLimit?: bigint; swapsCount?: bigint }
) {
  const gasPerSwap = gasLimits.singleSwap;
  const swapsCount = withdrawal.swapsCount ?? 0n;
  const gasForSwaps = swapsCount * gasPerSwap;

  return gasLimits.withdrawalMultiToken + (withdrawal.callbackGasLimit ?? 0n) + gasForSwaps;
}

/**
 * Copy from contract: `estimateExecuteShiftGasLimit`
 */
export function estimateExecuteShiftGasLimit(gasLimits: GasLimitsConfig, shift: { callbackGasLimit?: bigint }) {
  return gasLimits.shift + (shift.callbackGasLimit ?? 0n);
}
