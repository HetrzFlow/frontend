import React, { useMemo } from 'react';

import { FEE_BPS_POWER, FeeKey } from '@hertzflow/sdk';
import { useLingui } from '@lingui/react/macro';
import { useWatch } from 'react-hook-form';

import { calc } from '@repo/lib/calc';
import { thoFormat, truncateFormat } from '@repo/lib/format';
import { Button, cn, LoaderCircleIcon } from '@repo/ui';
import {
  NORMALIZED_SUI_TYPE_ARG,
  useBalances,
  useHzSdk,
  balanceValidator,
  getProtocolStoreDataFromCache,
  useBorrowFee,
  useLiqPx,
  usePositionLiqPoolData,
  getCachedPriceTickerData,
  useInstStore,
  useGlobalStore,
} from '@/common';

import { MARKET_PX, MIN_RESIDUAL_COLLATERAL } from '@/constants/common';
import { ORDER_TYPE } from '@/constants/enum';

import { usePosition } from '../context';
import AlertBanner from './AlertBanner';

interface FormBtnProps {
  orderType: ORDER_TYPE;
  isPending?: boolean;
}

const FormBtn: React.FC<FormBtnProps> = ({ orderType, isPending }) => {
  const {
    isLong,
    size: positionSize,
    collateral,
    entryPrice,
    collateralCoin,
    entryFundingRate,
    targetCoin,
    leverage,
  } = usePosition();
  const { t } = useLingui();
  const hzSdk = useHzSdk();
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );

  const coins = useInstStore((state) => state.getCoins());
  const usdcCoin = useInstStore((state) => state.getUsdcCoin(state));
  const baseCoin = coins[targetCoin];
  const balances = useBalances([NORMALIZED_SUI_TYPE_ARG]);

  const size = useWatch({ name: 'size' });
  const px = useWatch({ name: 'px' });
  const receiveCoinType = useWatch({ name: 'receiveCoinType' });

  const receiveCoinIsUsdc = receiveCoinType === usdcCoin?.coinType;
  const { data: posLiqPoolData } = usePositionLiqPoolData(
    receiveCoinIsUsdc
      ? `${baseCoin?.symbol}/USD`
      : `${coins[receiveCoinType]?.symbol}/USD`,
  );

  const isMarket = orderType === ORDER_TYPE.market;
  const { data: borrowFee } = useBorrowFee({
    collateralCoinType: collateralCoin,
    isLong,
    size: positionSize,
    entryFundingRate: entryFundingRate,
  });
  const { data: liqPx } = useLiqPx({
    collateralCoinType: collateralCoin,
    entryPrice,
    collateral: collateral,
    size: positionSize,
    isLong,
    entryFundingRate: `${entryFundingRate}`,
    hasPosition: true,
  });

  const text = useMemo(() => {
    // no input in size
    if (!+size) {
      return t`Enter an amount`;
    }

    // size gt positionSize
    if (calc(size).gt(positionSize)) {
      return t`Max close amount exceeded`;
    }
    const { p: last } =
      getCachedPriceTickerData(`${baseCoin?.symbol}/USD`)?.[0] || {};
    // price validation
    if (!isMarket) {
      if (!px) {
        return t`Enter an amount`;
      }

      // limit price validation
      if (last) {
        // close short
        if (!isLong && px > 1.1 * +last) {
          return t`Price too high\n(above 1.1x current)`;
        }
        // close long
        if (isLong && px < 0.9 * +last) {
          return t`Price too low\n(below 0.9x current)`;
        }
      }

      if (liqPx) {
        if (isLong && calc(px).lte(liqPx)) {
          return t`Price Below Liq Price`;
        }
        if (!isLong && calc(px).gte(liqPx)) {
          return t`Price Above Liq Price`;
        }
      }
    }

    // sui balance validate
    const _text = balanceValidator({
      suiCoin: coins[NORMALIZED_SUI_TYPE_ARG],
      suiBalance: balances?.[0]?.totalBalance,
    });
    if (_text) {
      return _text;
    }

    // liquidity validation
    const maxLiq = receiveCoinIsUsdc
      ? posLiqPoolData?.shortLiq
      : posLiqPoolData?.longLiq;

    if (maxLiq !== undefined) {
      const exitPx = px === MARKET_PX ? last : px;
      const protocolStore = getProtocolStoreDataFromCache(
        hzSdk.fullClient.network,
      );
      // maxCloseSize = (liq + borrowFee) / (1 / leverage + pnlPercent / leverage  - closeFeeRate)
      const maxCloseSize = calc(maxLiq)
        .plus(borrowFee || 0)
        .div(
          calc(1)
            .plus(
              calc(exitPx)
                .div(entryPrice)
                .minus(1)
                .times(isLong ? 1 : -1)
                .times(leverage),
            )
            .div(leverage)
            .minus(
              calc(
                protocolStore
                  ? hzSdk.QueryModule.getFeeRate({
                      feeKey: FeeKey.DecreasePositionFee,
                      protocolStore: protocolStore,
                    })
                  : 0,
              ).div(FEE_BPS_POWER),
            ),
        );
      if (calc(size).gt(maxCloseSize)) {
        const dispMaxValue = truncateFormat(
          maxCloseSize,
          usdAmountDisplayDecimal,
        );
        return t`Max Close Size: ${dispMaxValue} USD`;
      }
    }

    // residual collateral validation
    const nextCollateral = calc(positionSize).minus(size).div(leverage);
    if (nextCollateral.gt(0) && nextCollateral.lt(MIN_RESIDUAL_COLLATERAL)) {
      const dispMinValue = thoFormat(MIN_RESIDUAL_COLLATERAL);
      return t`Min Residual Collateral: ${dispMinValue} USD`;
    }
  }, [
    t,
    isLong,
    px,
    size,
    isMarket,
    balances,
    coins,
    positionSize,
    baseCoin,
    liqPx,
    borrowFee,
    entryPrice,
    hzSdk,
    leverage,
    posLiqPoolData,
    receiveCoinIsUsdc,
    usdAmountDisplayDecimal,
  ]);

  const hasError = !!text;
  const showError = !isPending && hasError;
  const showAble = !isPending && !hasError;
  const enableText = isMarket ? t`Close` : t`Create Order`;

  return (
    <>
      <AlertBanner />
      <Button
        type="submit"
        disabled={hasError || isPending}
        onClick={() => {}}
        className={cn(
          'bg-accent text-accent-foreground hover:bg-accent/90 disabled:bg-bg-3 w-full text-base',
        )}
      >
        {isPending && (
          <>
            <LoaderCircleIcon size={16} className="animate-spin" />
            {enableText}
          </>
        )}
        {showError && text}
        {showAble && enableText}
      </Button>
    </>
  );
};

export default FormBtn;
