import { FC } from 'react';
import { useLingui } from '@lingui/react/macro';
import { useWatch } from 'react-hook-form';
import { useShallow } from 'zustand/react/shallow';

import { calc } from '@repo/lib/calc';
import { truncateFormat } from '@repo/lib/format';
import { cn, LoaderCircleIcon } from '@repo/ui';
import { useGlobalStore as useCommonGlobalStore, useInstStore } from '@/common';

import BaseFormBtn from '@/components/BaseFormBtn';
import { useNeedApprove } from '@/services/rest/liqPool';
import { usePositionSizeAndFees } from '@/services/rest/trade';
import { useGlobalStore } from '@/stores/trade/global';
import AlertBanner from './AlertBanner';
import { useValidate } from './hooks/useValidate';

interface FormBtnProps {
  isLong: boolean;
  isPending: boolean;
}

const FormBtn: FC<FormBtnProps> = ({ isLong, isPending }) => {
  const { t } = useLingui();
  const usdAmountDisplayDecimal = useCommonGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const instId = useGlobalStore((state) => state.instId);
  const [inst, coins, usdcCoin] = useInstStore(
    useShallow((state) => [
      state.getInst(state, instId),
      state.getCoins(),
      state.getUsdcCoin(state),
    ]),
  );
  const { baseCoin = '' } = inst || {};

  const px = useWatch({ name: 'px' });
  const paySz = useWatch({ name: 'paySz' });

  const { value: sz, coin } = paySz;
  const coinName = coins[baseCoin]?.symbol;
  const { data: needApprove } = useNeedApprove(coin);

  const collateralCoinType = isLong ? baseCoin : usdcCoin?.coinType;
  const { data: feeData } = usePositionSizeAndFees(
    coin,
    collateralCoinType,
    3000,
  );

  const text = useValidate({
    px,
    sz,
    coin,
    instId,
    isLong,
    coinName,
    feeData,
  });

  const hasError = !!text;
  const showError = !needApprove && !isPending && hasError;
  const showAble = !needApprove && !isPending && !hasError;

  return (
    <>
      <AlertBanner
        payCoinType={coin}
        payCoinSz={sz}
        collateralCoinType={collateralCoinType}
      />
      <BaseFormBtn
        disabled={showError || isPending}
        onClick={() => {}}
        className={cn(
          !isPending && feeData?.isPending ? 'animate-pulse' : '',
          needApprove
            ? 'bg-accent hover:bg-accent/90 text-accent-foreground hover:text-accent-foreground/90'
            : showError
              ? isLong
                ? 'disabled:bg-up/10 disabled:text-up/50 disabled:opacity-100'
                : 'disabled:bg-down/10 disabled:text-down/50 disabled:opacity-100'
              : isLong
                ? 'bg-up hover:bg-up/90 text-accent-foreground hover:text-accent-foreground/90'
                : 'bg-down hover:bg-down/90 text-accent-foreground hover:text-accent-foreground/90',
        )}
      >
        {isPending && (
          <>
            <LoaderCircleIcon size={16} className="animate-spin" />
            {needApprove ? t`Approve ${coinName}` : t`Opening Order`}
          </>
        )}
        {showError && text}
        {showAble && (
          <span className="inline-flex flex-col gap-0">
            {isLong ? t`Long ${coinName}` : t`Short ${coinName}`}
            <span className="font-plex w-full shrink-0 text-xs font-normal">
              ≈{' '}
              {truncateFormat(
                calc(feeData?.size || ''),
                usdAmountDisplayDecimal,
                {
                  style: 'currency',
                  currency: 'USD',
                },
              )}
            </span>
          </span>
        )}
        {needApprove && !isPending && t`Approve ${coinName}`}
      </BaseFormBtn>
    </>
  );
};

export default FormBtn;
