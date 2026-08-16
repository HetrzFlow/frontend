import { FC, useEffect, useState } from 'react';
import { SOURCE_BSC_MAINNET } from '@hertzflow/sdk-v2/configs/chains';
import { getTradePayTokenAddress } from '@hertzflow/sdk-v2/configs/internalUsd';
import { useLingui } from '@lingui/react/macro';
import { intervalToDuration } from 'date-fns';
import { useWatch } from 'react-hook-form';
import { Address, zeroAddress } from 'viem';
import { useShallow } from 'zustand/react/shallow';

import { calc } from '@repo/lib/calc';
import { truncateFormat } from '@repo/lib/format';
import { Button, cn, LoaderCircleIcon } from '@repo/ui';
import {
  CREDIT_MARKET_CATEGORY,
  CREDIT_TOKEN_SYMBOL,
  useGlobalStore as useCommonGlobalStore,
  useInstStore,
  useMarketIsDisabled,
  useHzSdk,
  useMarketIsPausing,
} from '@/common';

import { getShortInstName } from '@/common/utils/inst';
import ApproveBtn from '@/components/ApproveBtn';
import BaseFormBtn from '@/components/BaseFormBtn';
import HighPriceDifferenceAlert from '@/components/Swap/HighPriceDifferenceAlert';
import { swapMessages, translateSwapMessage } from '@/components/Swap/messages';
import { ENABLE_SWAP } from '@/constants/common';
import { useMarketIsOpen } from '@/hooks/useMarketsStats';
import { getNextMarketTransition } from '@/lib/market/dateConverter';
import { useTradeGlobalStore } from '@/stores/trade/global';
import { usePositionSizeAndFees } from '../../positionSizeAndFees';
import { useTradeStore } from '../../store';
import AlertBanner from './AlertBanner';
import { useIsZFP } from './hooks/useIsZFP';
import { useValidate } from './hooks/useValidate';
import { getActiveTpSlValue } from './tpSlUtils';
import type { OpenPositionSubmitStage } from './hooks/useFormAction';
import type { OpenPositionSwapController } from './hooks/useOpenPositionSwap';

interface CountdownBtnProps {
  nextOpenTime?: number;
  onCountdownEnd: () => void;
}

const CountdownBtn: FC<CountdownBtnProps> = ({
  nextOpenTime,
  onCountdownEnd,
}) => {
  const { t } = useLingui();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (nextOpenTime) {
      timer = setInterval(() => {
        const currentTime = Date.now();
        if (currentTime >= nextOpenTime) {
          onCountdownEnd();
          clearInterval(timer);
        }
        setNow(currentTime);
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [nextOpenTime, onCountdownEnd]);

  const countdownEndTime = Math.max(nextOpenTime || now, now);
  const {
    days = 0,
    hours = 0,
    minutes = 0,
    seconds = 0,
  } = intervalToDuration({
    start: now,
    end: countdownEndTime,
  });

  return (
    <Button disabled={true} className={cn('w-full')}>
      {t`Market Opens In`} {days}D:{hours < 10 ? `0${hours}` : hours}H:
      {minutes < 10 ? `0${minutes}` : minutes}
      M:{seconds < 10 ? `0${seconds}` : seconds}S
    </Button>
  );
};

interface FormBtnProps {
  isLong: boolean;
  isPending: boolean;
  submitStage: OpenPositionSubmitStage;
  swap: OpenPositionSwapController;
}

const FormBtn: FC<FormBtnProps> = ({
  isLong,
  isPending,
  submitStage,
  swap,
}) => {
  const { i18n, t } = useLingui();
  const hzSdk = useHzSdk();
  const usdAmountDisplayDecimal = useCommonGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const instId = useTradeGlobalStore((state) => state.instId);
  const [inst, coins] = useInstStore(
    useShallow((state) => [state.getInst(state, instId), state.getCoins()]),
  );
  const inputLeverage = useTradeStore((state) => state.lever);

  const marketIsDisabled = useMarketIsDisabled(inst?.marketTokenAddress);
  const marketIsPausing = useMarketIsPausing(inst?.marketTokenAddress);
  const isZFP = useIsZFP();

  const px = useWatch({ name: 'px' });
  const paySz = useWatch({ name: 'paySz' });
  const tpsl = useWatch({ name: 'tpsl' });

  const shortInstName = getShortInstName(inst);
  const { value: sz } = paySz;

  const collateralCoinType = isLong
    ? inst?.longTokenAddress
    : inst?.shortTokenAddress;
  const defaultPayCoinType = getTradePayTokenAddress({
    chainId: hzSdk?.chainId,
    inst,
    collateralTokenAddress: collateralCoinType,
  });
  const payCoinType = paySz.coin || defaultPayCoinType;
  const payToken =
    (swap.isSwapPayment ? swap.livePayToken : undefined) ||
    paySz.token ||
    (payCoinType ? coins[payCoinType] : undefined);
  const coin = payCoinType ?? '';
  const payTokenSymbol = payToken?.symbol || '';
  const isSwapPayment =
    ENABLE_SWAP &&
    hzSdk?.chainId === SOURCE_BSC_MAINNET &&
    inst?.category !== CREDIT_MARKET_CATEGORY &&
    !!payCoinType &&
    !!defaultPayCoinType &&
    payCoinType.toLowerCase() !== defaultPayCoinType.toLowerCase();
  const approveTokenSymbol =
    inst?.category === CREDIT_MARKET_CATEGORY
      ? CREDIT_TOKEN_SYMBOL
      : payTokenSymbol;

  const { data: feeData } = usePositionSizeAndFees(
    payCoinType,
    collateralCoinType,
    isZFP,
  );

  const validationText = useValidate({
    px,
    sz,
    coin,
    instId,
    isLong,
    shortInstName,
    feeData,
    payToken,
    tpPx: tpsl.open ? getActiveTpSlValue(tpsl.tpPx) : '',
    slPx: tpsl.open ? getActiveTpSlValue(tpsl.slPx) : '',
    inputLeverage,
  });

  const swapText = swap.isSwapPayment
    ? swap.isLoading || feeData?.isPending
      ? t`Fetching quote…`
      : swap.isQuoteUnavailable
        ? t`Quote unavailable`
        : swap.isInsufficientBalance
          ? translateSwapMessage(i18n, swapMessages.insufficientToken, {
              token: payTokenSymbol,
            })
          : swap.isInsufficientGas
            ? i18n._(swapMessages.insufficientBnb)
            : !swap.canSubmit && +sz > 0
              ? t`Quote unavailable`
              : undefined
    : undefined;
  const text = swapText || validationText;
  const hasError = !!text;
  const showError = !isPending && hasError;
  const showAble = !isPending && !hasError;

  const { data: isMarketOpen, refetch: refetchMarketIsOpen } =
    useMarketIsOpen(inst);
  const nextOpenTime = getNextMarketTransition(inst?.schedule).nextOpenTime;

  return (
    <>
      <AlertBanner
        payCoinType={coin}
        payCoinSz={sz}
        collateralCoinType={collateralCoinType}
      />
      <div className="flex flex-col">
        <ApproveBtn
          tokenAddress={payCoinType as Address}
          tokenSymbol={approveTokenSymbol ?? ''}
          tokenDecimals={payToken?.decimal ?? payToken?.decimals}
          tokenAmount={sz}
          skipApprove={
            showError || payCoinType === zeroAddress || swap.isSwapPayment
          }
          className={
            isLong ? 'bg-up hover:bg-up/70' : 'bg-down hover:bg-down/70'
          }
        >
          {isMarketOpen ? (
            <BaseFormBtn
              disabled={
                marketIsDisabled || marketIsPausing || showError || isPending
              }
              className={cn(
                !isPending && feeData?.isPending ? 'animate-pulse' : '',
                'max-md:disabled:bg-bg-4 max-md:disabled:hover:bg-bg-4',
                isLong
                  ? 'bg-up hover:bg-up/70 text-accent-foreground hover:text-accent-foreground/70'
                  : 'bg-down hover:bg-down/70 text-accent-foreground hover:text-accent-foreground/70',
              )}
            >
              {isPending && (
                <>
                  <LoaderCircleIcon size={16} className="animate-spin" />
                  {submitStage === 'approving'
                    ? i18n._(swapMessages.approving)
                    : submitStage === 'quoting'
                      ? t`Fetching quote…`
                      : swap.isSwapPayment
                        ? t`Creating order`
                        : t`Opening Order`}
                </>
              )}
              {showError && text}
              {showAble && (
                <span className="inline-flex flex-col gap-0">
                  {swap.isSwapPayment && swap.priceDifference.isHigh
                    ? t`Confirm Swap`
                    : isSwapPayment
                      ? isLong
                        ? translateSwapMessage(i18n, swapMessages.swapAndLong, {
                            market: shortInstName,
                          })
                        : translateSwapMessage(
                            i18n,
                            swapMessages.swapAndShort,
                            { market: shortInstName },
                          )
                      : isLong
                        ? t`Long ${shortInstName}`
                        : t`Short ${shortInstName}`}
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
            </BaseFormBtn>
          ) : (
            <CountdownBtn
              nextOpenTime={nextOpenTime}
              onCountdownEnd={refetchMarketIsOpen}
            />
          )}
        </ApproveBtn>
        {!swap.isLoading && swap.priceDifference.isHigh ? (
          <HighPriceDifferenceAlert
            difference={swap.priceDifference.percentage}
          />
        ) : null}
      </div>
    </>
  );
};

export default FormBtn;
