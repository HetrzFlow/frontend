import { useMemo } from 'react';
import { calc } from '@repo/lib/calc';
import { useBalances, useConnectionStatus } from '@/common/chainClient';
import {
  CONTRACT_USD_MULTIPLIER,
  CREDIT_MARKET_CATEGORY,
  getCreditAwareUsdPriceSymbol,
  USDT_USD_PRICE_SYMBOL,
} from '@/common/constants';
import { usePnlSummary } from '@/common/services/rest/account';
import {
  useMarketsConfigs,
  useMarketsValues,
} from '@/common/services/rest/market';
import { useOpenOrders } from '@/common/services/rest/order';
import { usePositions } from '@/common/services/rest/position';
import { usePrices } from '@/common/services/rest/price';
import { usePriceTickerStream } from '@/common/services/ws/tickers';
import { useInstStore } from '@/common/stores/instStore';
import { useReferralDiscountRate } from '@/hooks/useReferralDiscount';
import { getEffectiveReferralDiscountUsd } from '@/lib/credit/creditReferral';
import {
  getCachedMarketExecutionPrice,
  getCachedPriceTickerExecutionPrice,
} from '@/lib/trade/executionPrice';
import {
  calcNetPriceImpactUsdForDecrease,
  getPositionFeeRate,
} from '@/lib/trade/formulas';

export interface TotalAssetsResult {
  walletBalance: string | undefined;
  walletBalanceUsd: string | undefined;
  poolDeposits: string | undefined;
  vaultDeposits: string | undefined;
  positionNetValue: string | undefined;
  orderCollateral: string | undefined;
  total: string | undefined;
  unrealisedPnl: string | undefined;
  totalPnl: string | undefined;
  totalBought: string | undefined;
  unrealisedBought: string | undefined;
  isDisconnected: boolean;
}

export function useTotalAssets(): TotalAssetsResult {
  const status = useConnectionStatus();
  const isDisconnected = status === 'disconnected';

  // Ensure pricesMap is populated (needed by usePositions, useOpenOrders, etc.)
  usePrices();

  // 1. Wallet USDT balance
  const usdtCoin = useInstStore((state) => state.getUsdtCoin(state));
  const balances = useBalances();
  const { data: usdtPxData } = usePriceTickerStream(USDT_USD_PRICE_SYMBOL, {
    throttleWait: 60000,
  });
  const { data: pnlSummary } = usePnlSummary();
  const [walletBalance, walletBalanceUsd] = useMemo(() => {
    if (isDisconnected) return [undefined, undefined];
    const usdtBalance = balances.find((v) => v.address === usdtCoin?.address);
    if (!usdtCoin || !usdtBalance) return [undefined, undefined];
    const amount = calc(usdtBalance.totalBalance || '').div(
      Math.pow(10, usdtCoin.decimals),
    );
    const usdtCoinPx = usdtPxData?.[0]?.p;
    const usd = amount.times(usdtCoinPx || '');
    return [amount.toFixed(), usd.toFixed()];
  }, [balances, usdtCoin, usdtPxData, isDisconnected]);

  // 2. Pool deposits = cost basis + unrealized PnL (30-dec USD)
  const poolDeposits = useMemo(() => {
    if (isDisconnected) return undefined;
    if (!pnlSummary) return undefined;
    return calc(pnlSummary.cost_basis.pools)
      .plus(pnlSummary.unrealized_pnl.pools)
      .div(CONTRACT_USD_MULTIPLIER)
      .toFixed();
  }, [pnlSummary, isDisconnected]);

  // 3. Vault deposits = cost basis + unrealized PnL (30-dec USD)
  const vaultDeposits = useMemo(() => {
    if (isDisconnected) return undefined;
    if (!pnlSummary) return undefined;
    return calc(pnlSummary.cost_basis.vaults)
      .plus(pnlSummary.unrealized_pnl.vaults)
      .div(CONTRACT_USD_MULTIPLIER)
      .toFixed();
  }, [pnlSummary, isDisconnected]);

  // 4. Position net value (with fees) + PnL
  const insts = useInstStore((state) => state.getInsts());
  const coins = useInstStore((state) => state.getCoins());
  const { data: positions } = usePositions();
  const hasOpenPositions = status === 'connected' && !!positions?.length;
  const { data: marketsConfigs } = useMarketsConfigs({
    enabled: hasOpenPositions,
    markets: positions?.map((position) => insts[position.marketAddress]),
  });
  const { data: marketsValues } = useMarketsValues(undefined, {
    enabled: hasOpenPositions,
    markets: positions?.map((position) => insts[position.marketAddress]),
  });
  const { data: referralDiscountRate = '0' } = useReferralDiscountRate();

  const positionCalcs = useMemo(() => {
    if (isDisconnected) return undefined;
    if (!positions?.length) {
      if (positions) return { netValue: '0', unrealisedPnl: '0' };
      return undefined;
    }

    let totalNetValue = calc(0);
    let totalUnrealisedPnl = calc(0);
    let totalPositionCollateral = calc(0);
    let hasValidPosition = false;

    for (const position of positions) {
      const {
        marketAddress,
        isLong,
        sizeInUsd,
        entryPrice,
        collateralAmount,
        collateralTokenAddress,
        pendingBorrowingFeesUsd = '0',
        fundingFeeAmount = '0',
        pendingImpactAmount = '0',
      } = position;

      const inst = insts[marketAddress];
      if (!inst) continue;

      const isCreditMarket =
        position.isCreditMarket || inst.category === CREDIT_MARKET_CATEGORY;
      const marketPx = getCachedMarketExecutionPrice({
        symbol: inst.symbol,
        indexTokenAddress: inst.indexTokenAddress,
        isIncrease: false,
        isLong,
      });
      const collateralCoin = coins[collateralTokenAddress];
      const collateralCoinPx = collateralCoin
        ? getCachedPriceTickerExecutionPrice(
            getCreditAwareUsdPriceSymbol({
              isCreditMarket,
              tokenSymbol: collateralCoin.symbol,
            }),
            { isIncrease: false, isLong, priceType: 'min' },
          )
        : undefined;

      if (!marketPx || !collateralCoinPx) continue;

      const collateralInUsd = calc(collateralAmount).times(collateralCoinPx);

      // uPnL = ((sizeInUsd / entryPrice) * markPrice - sizeInUsd) * direction
      const uPnl = calc(sizeInUsd)
        .div(entryPrice)
        .times(marketPx)
        .minus(sizeInUsd)
        .times(isLong ? 1 : -1);

      // Fees
      const borrowFee = pendingBorrowingFeesUsd;
      const fundingFee = calc(fundingFeeAmount).times(collateralCoinPx);

      // Price impact
      const marketConfigs = marketsConfigs?.[inst.marketTokenAddress];
      const marketVals = marketsValues?.[inst.marketTokenAddress];
      const priceImpact = calcNetPriceImpactUsdForDecrease({
        marketConfigs,
        marketValues: marketVals,
        positionSizeInUsd: sizeInUsd,
        sizeDeltaUsd: sizeInUsd,
        pendingImpactAmount,
        indexTokenPrice: marketPx,
        indexTokenDecimals: coins[inst.indexTokenAddress]?.decimals,
        isLong,
      });
      const totalPriceImpact = priceImpact.totalPriceImpactDeltaUsd;

      // Close fee
      const feeRate = getPositionFeeRate({
        marketConfigs,
        balanceWasImproved: priceImpact.balanceWasImproved,
        isZFP: position.isZFP,
      });
      const closeFee = position.isZFP
        ? calc(0)
        : calc(sizeInUsd).times(feeRate);
      const feeDiscountUsd = getEffectiveReferralDiscountUsd({
        isCreditMarket,
        feeUsd: closeFee.toFixed(),
        referralDiscountRate,
      });
      const discountedCloseFee = closeFee.minus(feeDiscountUsd);

      // Net PnL = uPnL - borrowFee - fundingFee - closeFee + priceImpact
      const netPnl = calc(uPnl)
        .minus(borrowFee)
        .minus(fundingFee)
        .minus(discountedCloseFee)
        .plus(totalPriceImpact);

      const netValue = calc(collateralInUsd).plus(netPnl);

      totalNetValue = totalNetValue.plus(netValue);
      totalUnrealisedPnl = totalUnrealisedPnl.plus(uPnl);
      totalPositionCollateral = totalPositionCollateral.plus(collateralInUsd);
      hasValidPosition = true;
    }

    if (!hasValidPosition)
      return { netValue: '0', unrealisedPnl: '0', positionBought: '0' };
    return {
      netValue: totalNetValue.toFixed(),
      unrealisedPnl: totalUnrealisedPnl.toFixed(),
      positionBought: totalPositionCollateral.toFixed(),
    };
  }, [
    positions,
    insts,
    coins,
    marketsConfigs,
    marketsValues,
    referralDiscountRate,
    isDisconnected,
  ]);

  const positionNetValue = positionCalcs?.netValue;
  const positionsUPnl = positionCalcs?.unrealisedPnl;
  const positionBought = positionCalcs?.positionBought;
  const realisedPnl = useMemo(() => {
    if (isDisconnected) return undefined;
    if (!pnlSummary) return undefined;
    return calc(pnlSummary.realized_pnl.total)
      .div(CONTRACT_USD_MULTIPLIER)
      .toFixed();
  }, [pnlSummary, isDisconnected]);

  const totalBought = useMemo(() => {
    if (isDisconnected) return undefined;
    if (!pnlSummary) return undefined;
    // total_bought.total from API already includes current position bought,
    // so we only need to add pools and vaults cost basis
    const apiPart = calc(pnlSummary.total_bought.total).div(
      CONTRACT_USD_MULTIPLIER,
    );
    return apiPart.toFixed();
  }, [pnlSummary, isDisconnected]);

  // 5. Pools uPnL from the account PnL summary
  const poolsUPnl = useMemo(() => {
    if (isDisconnected) return undefined;
    if (!pnlSummary) return undefined;
    return calc(pnlSummary.unrealized_pnl.pools)
      .div(CONTRACT_USD_MULTIPLIER)
      .toFixed();
  }, [pnlSummary, isDisconnected]);

  // 6. Vaults uPnL from the account PnL summary
  const vaultsUPnl = useMemo(() => {
    if (isDisconnected) return undefined;
    if (!pnlSummary) return undefined;
    return calc(pnlSummary.unrealized_pnl.vaults)
      .div(CONTRACT_USD_MULTIPLIER)
      .toFixed();
  }, [pnlSummary, isDisconnected]);

  // Unrealised Bought = position collateral + pools cost basis + vaults cost basis
  const unrealisedBought = useMemo(() => {
    if (isDisconnected) return undefined;
    if (!pnlSummary && positionBought === undefined) return undefined;
    const poolBought = pnlSummary
      ? calc(pnlSummary.cost_basis.pools).div(CONTRACT_USD_MULTIPLIER)
      : calc(0);
    const vaultBought = pnlSummary
      ? calc(pnlSummary.cost_basis.vaults).div(CONTRACT_USD_MULTIPLIER)
      : calc(0);
    return calc(positionBought ?? '0')
      .plus(poolBought)
      .plus(vaultBought)
      .toFixed();
  }, [positionBought, pnlSummary, isDisconnected]);

  // Unrealised PnL = Positions uPnL + Pools uPnL + Vaults uPnL
  const unrealisedPnl = useMemo(() => {
    if (isDisconnected) return undefined;
    const parts = [positionsUPnl, poolsUPnl, vaultsUPnl];
    const available = parts.filter((p) => p !== undefined);
    if (!available.length) return undefined;
    return available.reduce((sum, p) => calc(sum).plus(p!).toFixed(), '0');
  }, [positionsUPnl, poolsUPnl, vaultsUPnl, isDisconnected]);

  // Total PnL = Unrealised PnL + Realised PnL
  const totalPnl = useMemo(() => {
    if (isDisconnected) return undefined;
    if (unrealisedPnl === undefined && realisedPnl === undefined)
      return undefined;
    return calc(unrealisedPnl ?? '0')
      .plus(realisedPnl ?? '0')
      .toFixed();
  }, [unrealisedPnl, realisedPnl, isDisconnected]);

  // 8. Open order collateral (LimitIncrease only)
  const { data: orders } = useOpenOrders();

  const orderCollateral = useMemo(() => {
    if (isDisconnected) return undefined;
    if (!orders) return undefined;

    const limitIncreaseOrders = orders.filter((o) => o.isOpen && o.isLimit);
    if (!limitIncreaseOrders.length) return '0';

    let totalCollateral = calc(0);
    let hasValid = false;

    for (const order of limitIncreaseOrders) {
      const collateralCoin = coins[order.initialCollateralTokenAddress];
      if (!collateralCoin) continue;

      const inst = insts[order.marketAddress];
      const collateralCoinPx = getCachedPriceTickerExecutionPrice(
        getCreditAwareUsdPriceSymbol({
          isCreditMarket: inst?.category === CREDIT_MARKET_CATEGORY,
          tokenSymbol: collateralCoin.symbol,
        }),
        { isIncrease: true, isLong: order.isLong, priceType: 'min' },
      );
      if (!collateralCoinPx) continue;

      const usdValue = calc(order.initialCollateralDeltaAmount).times(
        collateralCoinPx,
      );
      totalCollateral = totalCollateral.plus(usdValue);
      hasValid = true;
    }

    return hasValid ? totalCollateral.toFixed() : '0';
  }, [orders, coins, insts, isDisconnected]);

  // Calculate total (partial sum of available components)
  const total = useMemo(() => {
    if (isDisconnected) return undefined;

    const parts = [
      walletBalanceUsd,
      poolDeposits,
      vaultDeposits,
      positionNetValue,
      orderCollateral,
    ];
    const availableParts = parts.filter((p) => p !== undefined);
    if (!availableParts.length) return undefined;

    let sum = calc(0);
    for (const part of availableParts) {
      sum = sum.plus(part);
    }
    return sum.toFixed();
  }, [
    walletBalanceUsd,
    poolDeposits,
    vaultDeposits,
    positionNetValue,
    orderCollateral,
    isDisconnected,
  ]);

  return {
    walletBalance,
    walletBalanceUsd,
    poolDeposits,
    vaultDeposits,
    positionNetValue,
    orderCollateral,
    total,
    unrealisedPnl,
    totalPnl,
    totalBought,
    unrealisedBought,
    isDisconnected,
  };
}
