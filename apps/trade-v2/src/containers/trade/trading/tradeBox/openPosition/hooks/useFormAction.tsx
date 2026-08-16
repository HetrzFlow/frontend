import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getTradePayTokenAddress } from '@hertzflow/sdk-v2/configs/internalUsd';
import { OrderType } from '@hertzflow/sdk-v2/types/orders';
import { UseFormReturn } from 'react-hook-form';
import { getAddress, isAddress, parseUnits, formatUnits } from 'viem';
import { useShallow } from 'zustand/react/shallow';

import { calc } from '@repo/lib/calc';
import { toast } from '@repo/ui';
import {
  getCachedPriceTickerData,
  getUsdPriceSymbol,
  useInstStore,
  usePriceTickerStream,
  useCurrentAccountAddress,
  useOpenOrders,
  useHzSdk,
  usePositions,
  useApproveTokenForSyntheticsRouter,
} from '@/common';
import { usePositionConstants } from '@/common/services/rest/position';
import { BNB_TOKEN } from '@/components/Swap/useSwapTokens';

import { ORDER_TYPE, TRADE_TYPE } from '@/constants/enum';

import { runFormSubmitAction } from '@/lib/runtime/runFormSubmitAction';
import { debounce } from '@/lib/runtime/timing';
import { getCachedMarketExecutionPrice } from '@/lib/trade/executionPrice';
import { findPositionByMode } from '@/lib/trade/position';
import { useTradeGlobalStore } from '@/stores/trade/global';
import {
  getOpenPositionSizeFromCache,
  useCalcPositionSize,
} from '../../../positionSizeAndFees';
import { PositionForm, useTradeStore } from '../../../store';
import { getActiveTpSlValue } from '../tpSlUtils';
import { useCreateIncreaseOrder } from './useCreateIncreaseOrder';
import { useIsZFP } from './useIsZFP';
import type { OpenPositionSwapController } from './useOpenPositionSwap';
import type { ExternalSwapQuote } from '@hertzflow/sdk-v2/types/externalSwap';

const openPositionSubmitStatus = {
  beginSubmit: () => {
    useTradeStore.getState().setStore({ isSubmitting: true });
  },
  endSubmit: () => {
    useTradeStore.getState().setStore({ isSubmitting: false });
  },
};

const activeSubmitStatus = {
  beginSubmit: () => undefined,
  endSubmit: () => undefined,
};

export type OpenPositionSubmitStage =
  | 'idle'
  | 'quoting'
  | 'approving'
  | 'submitting';

// form action hook
export const useFormAction = (
  form: UseFormReturn<PositionForm>,
  swap: OpenPositionSwapController,
) => {
  const [submitStage, setSubmitStage] =
    useState<OpenPositionSubmitStage>('idle');
  const userAddress = useCurrentAccountAddress();
  const hzSdk = useHzSdk();
  const { mutateAsync: createIncreaseOrder } = useCreateIncreaseOrder();

  const [tradeType, orderType, isSubmitting] = useTradeStore(
    useShallow((state) => [
      state.tradeType,
      state.orderType,
      state.isSubmitting,
    ]),
  );
  const instId = useTradeGlobalStore((state) => state.instId);
  const [inst, coins] = useInstStore(
    useShallow((state) => [state.getInst(state, instId), state.getCoins()]),
  );
  const swapApprovalTokenAddress =
    swap.isSwapPayment &&
    !!swap.payToken?.address &&
    swap.payToken?.address !== BNB_TOKEN.address &&
    isAddress(swap.payToken.address)
      ? getAddress(swap.payToken.address)
      : undefined;
  const {
    approveToken: approveSwapToken,
    refetchAllowance: refetchSwapAllowance,
  } = useApproveTokenForSyntheticsRouter({
    tokenAddress: swapApprovalTokenAddress,
    tokenDecimals: swap.payToken?.decimals,
    showTokenIcon: false,
  });

  const isLong = tradeType === TRADE_TYPE.long;
  const collateralTokenAddress = isLong
    ? inst?.longTokenAddress
    : inst?.shortTokenAddress;
  const payTokenAddress = getTradePayTokenAddress({
    chainId: hzSdk?.chainId,
    inst,
    collateralTokenAddress,
  });
  const payTokenSymbol = payTokenAddress
    ? coins[payTokenAddress]?.symbol
    : undefined;
  usePriceTickerStream(getUsdPriceSymbol(payTokenSymbol), {
    throttleWait: 60000,
  });
  const isZFP = useIsZFP();

  const { mutateAsync: calcPositionSize } = useCalcPositionSize();
  const { data: positions = [] } = usePositions();
  const positionsRef = useRef(positions);
  positionsRef.current = positions;
  const { data: positionConstants } = usePositionConstants();
  const positionConstantsRef = useRef(positionConstants);
  positionConstantsRef.current = positionConstants;
  const { data: openOrders } = useOpenOrders();
  const openOrdersRef = useRef(openOrders);
  openOrdersRef.current = openOrders;

  // handle pay sz change
  const isZFPRef = useRef(isZFP);
  isZFPRef.current = isZFP;
  const swapRef = useRef(swap);
  swapRef.current = swap;
  const submitGuardRef = useRef(false);

  const recalculatePaySz = useMemo(() => {
    const debounceUpdate = debounce(
      async ({ value, px }: { value: PositionForm['paySz']; px: string }) => {
        const lever = useTradeStore.getState().lever;
        const currentIsZFP = isZFPRef.current;
        const currentCollateralTokenAddress = isLong
          ? inst?.longTokenAddress
          : inst?.shortTokenAddress;
        if (inst) {
          const position = findPositionByMode({
            positions: positionsRef.current,
            marketAddress: inst.marketTokenAddress,
            isLong,
            isZFP: currentIsZFP,
          });
          await calcPositionSize({
            marketAddress: inst.marketTokenAddress,
            payCoinType: value.coin || '',
            payCoinAmount: value.value || '',
            payToken: value.token,
            payCoinPx: value.token?.price,
            quotedCollateralAmount: swapRef.current.isSwapPayment
              ? swapRef.current.quotedCollateralAmount
              : undefined,
            collateralCoin: currentCollateralTokenAddress
              ? coins[currentCollateralTokenAddress]
              : undefined,
            isLong,
            targetCoinPx: px,
            lever,
            position,
            isZFP: currentIsZFP,
          });
        }
      },
      200,
    );

    return (value: PositionForm['paySz']) => {
      const px = form.getValues('px');
      debounceUpdate({ value, px });
    };
  }, [form, calcPositionSize, isLong, inst, coins]);

  const handlePaySzChange = useCallback(
    (value: PositionForm['paySz']) => {
      form.setValue('paySz', value);
      recalculatePaySz(value);
    },
    [form, recalculatePaySz],
  );

  useEffect(() => {
    if (!swap.isSwapPayment || !swap.quotedCollateralAmount) return;
    recalculatePaySz(form.getValues('paySz'));
  }, [form, recalculatePaySz, swap.isSwapPayment, swap.quotedCollateralAmount]);

  const onSubmit = useCallback(
    async (data: PositionForm) => {
      const { paySz, px, tpsl } = data;

      if (!userAddress) {
        return;
      }

      if (submitGuardRef.current || useTradeStore.getState().isSubmitting) {
        return;
      }
      submitGuardRef.current = true;
      openPositionSubmitStatus.beginSubmit();
      setSubmitStage(swap.isSwapPayment ? 'quoting' : 'submitting');

      try {
        // basic settings

        const marketPx =
          getCachedMarketExecutionPrice({
            symbol: inst?.symbol,
            indexTokenAddress: inst?.indexTokenAddress,
            isIncrease: true,
            isLong,
          }) || getCachedPriceTickerData(inst?.symbol)?.[0]?.p;
        const collateralTokenAddress = isLong
          ? inst?.longTokenAddress
          : inst?.shortTokenAddress;
        let posData = swap.isSwapPayment
          ? undefined
          : getOpenPositionSizeFromCache({
              payCoinType: paySz.coin || '',
              collateralCoinType: collateralTokenAddress || '',
              isZFP,
            });

        let externalSwapQuote: ExternalSwapQuote | undefined;
        if (swap.isSwapPayment) {
          try {
            const getFreshQuote = async () => {
              const freshQuoteResult = await swap.getFreshValidatedQuote();
              if (
                freshQuoteResult.priceDifference.status !== 'within' &&
                freshQuoteResult.priceDifference.status !== 'worse'
              ) {
                throw new Error('Fresh swap quote could not be validated');
              }
              if (
                freshQuoteResult.priceDifference.isHigh &&
                !swap.priceDifference.isHigh
              ) {
                return;
              }
              return freshQuoteResult.quote;
            };

            externalSwapQuote = await getFreshQuote();
            if (!externalSwapQuote) return;

            if (swapApprovalTokenAddress && swap.payToken) {
              const allowanceResult = await refetchSwapAllowance();
              const requiredAllowance = parseUnits(
                paySz.value || '0',
                swap.payToken.decimals,
              );
              if ((allowanceResult.data ?? 0n) < requiredAllowance) {
                setSubmitStage('approving');
                let approvalHash: string | undefined;
                try {
                  approvalHash = await approveSwapToken();
                } catch {
                  return;
                }
                if (!approvalHash) return;

                setSubmitStage('quoting');
                externalSwapQuote = await getFreshQuote();
                if (!externalSwapQuote) return;
              }
            }

            const receiveDecimals = swap.receiveToken?.decimals;
            if (receiveDecimals == null)
              throw new Error('Missing receive token');
            const quotedCollateralAmount = formatUnits(
              externalSwapQuote.amountOut,
              receiveDecimals,
            );
            const position = inst
              ? findPositionByMode({
                  positions: positionsRef.current,
                  marketAddress: inst.marketTokenAddress,
                  isLong,
                  isZFP,
                })
              : undefined;
            const freshResult = inst
              ? await calcPositionSize({
                  marketAddress: inst.marketTokenAddress,
                  payCoinType: paySz.coin || '',
                  payCoinAmount: paySz.value || '',
                  payToken: swap.livePayToken || paySz.token,
                  payCoinPx: swap.livePayToken?.price || paySz.token?.price,
                  quotedCollateralAmount,
                  collateralCoin: collateralTokenAddress
                    ? coins[collateralTokenAddress]
                    : undefined,
                  isLong,
                  targetCoinPx: px,
                  lever: useTradeStore.getState().lever,
                  position,
                  isZFP,
                })
              : undefined;
            if (!freshResult)
              throw new Error('Position calculation unavailable');

            posData = {
              openFee: freshResult.displayOpenFee,
              feeDiscountUsd: freshResult.displayFeeDiscountUsd,
              priceImpact: freshResult.displayPriceImpact,
              deltaCollateralUsd: freshResult.displayDeltaCollateralUsd,
              size: freshResult.displaySizeDelta,
              collateralAmount: freshResult.displayAdjustedCollateralAmount,
              isPending: false,
            };
            setSubmitStage('submitting');
          } catch {
            return;
          }
        }

        // required params
        if (
          !inst ||
          !collateralTokenAddress ||
          !posData?.collateralAmount ||
          !posData.size ||
          !paySz.value ||
          !marketPx
        ) {
          toast.error('Required parameter is missing');
          return;
        }

        const createTpSlEntries: {
          orderType: OrderType;
          triggerPrice: string;
          autoCancel: boolean;
        }[] = [];
        let tpSlSizeInUsd: string | undefined;
        let tpSlCollateralAmount: string | undefined;
        const activeTpPx = tpsl.open ? getActiveTpSlValue(tpsl.tpPx) : '';
        const activeSlPx = tpsl.open ? getActiveTpSlValue(tpsl.slPx) : '';

        if (activeTpPx || activeSlPx) {
          // TP/SL size = existing position size + new order size (full position after increase)
          const existingPosition = positionsRef.current.find(
            (p) =>
              p.marketAddress === inst.marketTokenAddress &&
              p.isLong === isLong &&
              p.isZFP === isZFP,
          );
          tpSlSizeInUsd = existingPosition
            ? calc(existingPosition.sizeInUsd).plus(posData.size).toFixed()
            : posData.size;
          tpSlCollateralAmount = existingPosition
            ? calc(existingPosition.collateralAmount)
                .plus(posData.collateralAmount)
                .toFixed()
            : posData.collateralAmount;

          // autoCancel limit: MAX_AUTO_CANCEL_ORDERS - 1, assign per-entry
          // When constants or orders haven't loaded, default to false (safe)
          let autoCancelRemaining = 0;
          const maxAutoCancelOrders =
            positionConstantsRef.current?.maxAutoCancelOrders;
          const currentOpenOrders = openOrdersRef.current;
          if (maxAutoCancelOrders != null && currentOpenOrders) {
            const autoCancelLimit = Number(maxAutoCancelOrders) - 1;
            const existingAutoCancelCount = currentOpenOrders.filter(
              (o) =>
                o.autoCancel &&
                o.marketAddress === inst.marketTokenAddress &&
                o.isLong === isLong &&
                o.isZFP === isZFP,
            ).length;
            autoCancelRemaining = Math.max(
              0,
              autoCancelLimit - existingAutoCancelCount,
            );
          }

          if (activeTpPx) {
            createTpSlEntries.push({
              orderType: OrderType.LimitDecrease,
              triggerPrice: activeTpPx,
              autoCancel: autoCancelRemaining > 0,
            });
            autoCancelRemaining--;
          }
          if (activeSlPx) {
            createTpSlEntries.push({
              orderType: OrderType.StopLossDecrease,
              triggerPrice: activeSlPx,
              autoCancel: autoCancelRemaining > 0,
            });
            autoCancelRemaining--;
          }
        }

        await runFormSubmitAction({
          submitStatus: activeSubmitStatus,
          action: async () => {
            const isMarket = orderType === ORDER_TYPE.market;

            await createIncreaseOrder({
              inst,
              orderType: isMarket
                ? OrderType.MarketIncrease
                : OrderType.LimitIncrease,
              collateralTokenAddress: isLong
                ? inst.longTokenAddress
                : inst.shortTokenAddress,
              payTokenAddress: paySz.coin,
              payToken: paySz.token,
              paymentAmount: paySz.value,
              externalSwapQuote,
              px: isMarket ? marketPx : px,
              collateralAmount: posData.collateralAmount,
              sizeInUsd: posData.size,
              isLong,
              createTpSlEntries,
              tpSlSizeInUsd,
              tpSlCollateralAmount,
              cb: () => {
                const resetPayTokenAddress =
                  swap.underlyingTokenAddress ||
                  swap.defaultPayTokenAddress ||
                  '';
                form.setValue('paySz', {
                  value: '',
                  coin: resetPayTokenAddress,
                });
                useTradeStore.getState().setStore({ smDialogOpen: false });
              },
            });
          },
        });
      } finally {
        submitGuardRef.current = false;
        openPositionSubmitStatus.endSubmit();
        setSubmitStage('idle');
      }
    },
    [
      userAddress,
      isLong,
      orderType,
      createIncreaseOrder,
      inst,
      isZFP,
      swap,
      calcPositionSize,
      coins,
      form,
      approveSwapToken,
      refetchSwapAllowance,
      swapApprovalTokenAddress,
    ],
  );

  // handle leverage change
  const handleLeverChange = useCallback(() => {
    const paySz = form.getValues('paySz');
    recalculatePaySz(paySz);
  }, [recalculatePaySz, form]);

  // handle price change
  const handlePxChange = useCallback(
    (px: string) => {
      form.setValue('px', px);
      const paySz = form.getValues('paySz');
      recalculatePaySz(paySz);
    },
    [recalculatePaySz, form],
  );

  return {
    onSubmit,
    isSubmitting,
    submitStage,
    onPaySzChange: handlePaySzChange,
    recalculatePaySz,
    onLeverChange: handleLeverChange,
    onPxChange: handlePxChange,
  };
};
