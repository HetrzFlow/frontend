import React, { useMemo } from 'react';

import { FEE_BPS_POWER } from '@hertzflow/sdk';
import { useLingui } from '@lingui/react/macro';
import { useWatch } from 'react-hook-form';

import { useShallow } from 'zustand/react/shallow';

import { calc } from '@repo/lib/calc';
import { thoFormat, truncateFormat } from '@repo/lib/format';
import { Button, cn, LoaderCircleIcon } from '@repo/ui';
import {
  useHzSdk,
  balanceValidator,
  getProtocolStoreDataFromCache,
  getVaultDataFromCache,
  getCachedPriceTickerData,
  useInstStore,
  useGlobalStore,
} from '@/common';
import {
  MIN_RESIDUAL_COLLATERAL,
  NORMALIZED_SUI_TYPE_ARG,
} from '@/constants/common';
import { useBalances } from '@/hooks/useAccount';
import { usePosition } from '../context';
import { TYPE } from './enum';
import { useCalcEditableParams } from './useFormAction';

const MIN_VALUE = 10;

interface FormBtnProps {
  isPending?: boolean;
}

const FormBtn: React.FC<FormBtnProps> = ({ isPending }) => {
  const hzSdk = useHzSdk();
  const { t } = useLingui();
  const {
    isLong,
    targetCoin,
    collateral,
    entryFundingRate,
    entryPrice,
    size: curSize,
  } = usePosition();
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const [coins, usdcCoin, insts] = useInstStore(
    useShallow((state) => [
      state.getCoins(),
      state.getUsdcCoin(state),
      state.getInsts(),
    ]),
  );
  const inst = insts[targetCoin];
  const baseCoin = coins[targetCoin];

  const collateralCoin = isLong ? baseCoin : usdcCoin;

  const balances = useBalances([
    collateralCoin?.coinType || '',
    NORMALIZED_SUI_TYPE_ARG,
  ]);

  const type = useWatch({ name: 'type' });
  const size = useWatch({ name: 'size' });

  const isDeposit = type === TYPE.deposit;

  const { nextCollateral, deltaCollateral } = useCalcEditableParams({
    isDeposit,
    isLong,
    baseCoin,
    usdcCoin,
    entryFundingRate,
    curSize,
    size,
    curCollateral: collateral,
  });

  const text = useMemo(() => {
    // not input size
    if (!+size) {
      return t`Enter an amount`;
    }

    // withdraw
    if (!isDeposit) {
      // residual collateraleral should gt minValue
      if (calc(nextCollateral).lt(MIN_RESIDUAL_COLLATERAL)) {
        const dispMinValue = thoFormat(MIN_VALUE);
        return t`Minimum residual collareral: ${dispMinValue} USD`;
      }

      // leverage validation
      if (calc(curSize).div(nextCollateral).gt(100)) {
        return t`Leverage too high\n(above 100x)`;
      }

      const marketPx = getCachedPriceTickerData(inst?.id)?.[0]?.p;
      const vaultObj = getVaultDataFromCache(hzSdk.fullClient.network);
      const protocolStore = getProtocolStoreDataFromCache(
        hzSdk.fullClient.network,
      );
      // final collateral should lt mmr
      if (marketPx && vaultObj && protocolStore) {
        const { maxMaintainceLeverage } = hzSdk.QueryModule.getRealtimeConfig({
          collateralToken: collateralCoin?.coinType || '',
          protocolStore: protocolStore,
          vaultObject: vaultObj,
        });
        const pnl = calc(marketPx)
          .minus(entryPrice)
          .div(entryPrice)
          .times(curSize)
          .times(isLong ? 1 : -1);
        const maxWithdraw = calc(collateral).minus(
          calc(curSize)
            .div(maxMaintainceLeverage)
            .times(FEE_BPS_POWER)
            .minus(pnl),
        );

        if (calc(maxWithdraw).lt(size)) {
          const dispMaxValue = truncateFormat(
            maxWithdraw,
            usdAmountDisplayDecimal,
          );
          return t`Max Collateral: ${dispMaxValue} USD`;
        }
      }
    }

    // coin balance validate
    const _text = balanceValidator({
      coin: isDeposit ? collateralCoin : undefined,
      coinSize: isDeposit ? size : '0',
      coinBalance: isDeposit ? balances?.[0]?.totalBalance : '0',
      suiCoin: coins[NORMALIZED_SUI_TYPE_ARG],
      suiBalance: balances?.[1]?.totalBalance,
    });
    if (_text) {
      return _text;
    }

    // deposit
    if (isDeposit) {
      // leverage lt 1.1
      if (calc(curSize).div(nextCollateral).lt(1.1)) {
        return t`Leverage too low\n(below 1.1x)`;
      }

      // collateral lt MIN_RESIDUAL_COLLATERAL
      if (calc(deltaCollateral).lt(MIN_RESIDUAL_COLLATERAL)) {
        const dispMinValue = thoFormat(MIN_RESIDUAL_COLLATERAL);
        return t`Min Collateral: ${dispMinValue} USD`;
      }
    }
  }, [
    t,
    size,
    isDeposit,
    coins,
    collateral,
    balances,
    collateralCoin,
    nextCollateral,
    curSize,
    deltaCollateral,
    entryPrice,
    inst?.id,
    isLong,
    usdAmountDisplayDecimal,
    hzSdk,
  ]);

  const hasError = !!text;
  const showError = !isPending && hasError;
  const showAble = !isPending && !hasError;
  const enableText = isDeposit ? t`Deposit` : t`Withdraw`;

  return (
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
  );
};

export default FormBtn;
