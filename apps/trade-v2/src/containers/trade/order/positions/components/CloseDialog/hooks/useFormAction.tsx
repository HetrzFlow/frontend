import { useCallback, useMemo, useRef } from 'react';

import { OrderType } from '@hertzflow/sdk-v2/types/orders';
import { UseFormReturn } from 'react-hook-form';
import { useShallow } from 'zustand/react/shallow';
import { calc } from '@repo/lib/calc';
import { toast } from '@repo/ui';
import type { Position } from '@/common';
import {
  getCreditAwareUsdPriceSymbol,
  getCachedPriceTickerData,
  useInstStore,
  useCurrentAccountAddress,
  useOpenOrders,
} from '@/common';
import { usePositionConstants } from '@/common/services/rest/position';
import { ORDER_TYPE } from '@/constants/enum';
import { runFormSubmitAction } from '@/lib/runtime/runFormSubmitAction';
import { debounce } from '@/lib/runtime/timing';
import {
  getCachedMarketExecutionPrice,
  getCachedPriceTickerExecutionPrice,
} from '@/lib/trade/executionPrice';
import { createFormSubmitStatus } from '@/stores/trade/formSubmitStatus';
import { usePreferenceStore } from '@/stores/trade/preference';
import { usePositionsStore } from '../../../store';
import {
  getClosePositionSizeFromCache,
  useCalcClosePosition,
} from './closePositionSizeAndFees';
import { useCreateDecreaseOrder } from './useCreateDecreaseOrder';

const closePositionFormSubmitStatus = createFormSubmitStatus();

// form action hook
export const useFormAction = ({
  onOpenChange,
  position,
}: {
  position: Position;
  onOpenChange: (open: boolean) => void;
}) => {
  const userAddress = useCurrentAccountAddress();
  const { isLong, marketAddress, collateralTokenAddress, id } = position;
  const addProcessingItemId = usePositionsStore(
    (state) => state.addProcessingItemId,
  );
  const removeProcessingItemId = usePositionsStore(
    (state) => state.removeProcessingItemId,
  );

  const [inst, coins] = useInstStore(
    useShallow((state) => [state.getInsts()[marketAddress], state.getCoins()]),
  );
  const { mutateAsync: createDecreaseOrder, isPending } =
    useCreateDecreaseOrder();
  const { data: positionConstants } = usePositionConstants();
  const positionConstantsRef = useRef(positionConstants);
  positionConstantsRef.current = positionConstants;
  const { data: openOrders } = useOpenOrders();
  const openOrdersRef = useRef(openOrders);
  openOrdersRef.current = openOrders;

  const onSubmit = useCallback(
    async (data: {
      orderType: string;
      size: string;
      px: string;
      receiveCoinType: string;
    }) => {
      const { orderType, size, px, receiveCoinType } = data;
      const marketPx =
        getCachedMarketExecutionPrice({
          symbol: inst?.symbol,
          indexTokenAddress: inst?.indexTokenAddress,
          isIncrease: false,
          isLong,
        }) || getCachedPriceTickerData(inst?.symbol)?.[0]?.p;
      const receiveCoinPx = getCachedPriceTickerExecutionPrice(
        getCreditAwareUsdPriceSymbol({
          isCreditMarket: position.isCreditMarket,
          tokenSymbol: coins[receiveCoinType]?.symbol,
        }),
        { isIncrease: false, isLong, priceType: 'min' },
      );

      const collateralCoin = coins[collateralTokenAddress];
      const collateralCoinPx = getCachedPriceTickerExecutionPrice(
        getCreditAwareUsdPriceSymbol({
          isCreditMarket: position.isCreditMarket,
          tokenSymbol: collateralCoin?.symbol,
        }),
        { isIncrease: false, isLong, priceType: 'min' },
      );

      const posData = getClosePositionSizeFromCache({
        receiveCoinType: receiveCoinType || '',
        collateralCoinType: collateralTokenAddress || '',
      });

      if (
        !userAddress ||
        !inst ||
        !size ||
        (orderType === ORDER_TYPE['tp/sl'] && !+px) ||
        !marketPx ||
        !collateralCoin ||
        !coins[receiveCoinType] ||
        !receiveCoinPx ||
        !collateralCoinPx ||
        !posData
      ) {
        toast.error('Required parameter is missing');
        return;
      }

      const isMarket = orderType === ORDER_TYPE.market;
      const isCloseAll = !calc(size).lt(position.sizeInUsd);

      addProcessingItemId(id);

      try {
        await runFormSubmitAction({
          submitStatus: closePositionFormSubmitStatus.submitStatus,
          action: async () => {
            const isGtMarkPx = calc(px).gt(marketPx);
            const isTp = (isLong && isGtMarkPx) || (!isLong && !isGtMarkPx);

            // Calculate autoCancel based on limit.
            // When constants or orders haven't loaded, default to false (safe).
            let canAutoCancel = false;
            const maxAutoCancelOrders =
              positionConstantsRef.current?.maxAutoCancelOrders;
            const currentOpenOrders = openOrdersRef.current;
            if (maxAutoCancelOrders != null && currentOpenOrders) {
              const autoCancelLimit = Number(maxAutoCancelOrders) - 1;
              const existingAutoCancelCount = currentOpenOrders.filter(
                (o) =>
                  o.autoCancel &&
                  o.marketAddress === marketAddress &&
                  o.isLong === isLong &&
                  o.isZFP === position.isZFP,
              ).length;
              canAutoCancel = existingAutoCancelCount + 1 <= autoCancelLimit;
            }

            await createDecreaseOrder({
              inst,
              orderType:
                orderType === ORDER_TYPE.market
                  ? OrderType.MarketDecrease
                  : isTp
                    ? OrderType.LimitDecrease
                    : OrderType.StopLossDecrease,
              collateralTokenAddress,
              px: isMarket ? marketPx : px,
              collateralAmount: posData.finalDeltaCollateralAmount,
              sizeInUsd: size,
              isLong,
              isZFP: position.isZFP,
              isCloseAll,
              autoCancel: isMarket ? false : canAutoCancel,
              cb: () => {
                onOpenChange(false);
              },
            });
          },
        });

        // order count validation
        // const openOrders = getOrdersByInstFromCache({
        //   address: userAddress,
        //   instId: instId,
        //   network: hzSdk.chainId,
        // });
        // if (openOrders.length >= MAX_ORDER_COUNT_SINGLE_MARKET) {
        //   tradeToast({
        //     type: 'error',
        //     title: t`Limit Order`,
        //     ordType: 'limit',
        //     icon: <CoinIcon size={24} src={inst?.icon} alt={inst?.name} />,
        //     description: t`Failed`,
        //     showClose: true,
        //     content: t`You have reached the maximum of 20 active limit orders for this market.`,
        //   });

        //   return;
        // }
      } finally {
        removeProcessingItemId(id);
      }
    },
    [
      inst,
      userAddress,
      isLong,
      position,
      coins,
      onOpenChange,
      collateralTokenAddress,
      id,
      createDecreaseOrder,
      addProcessingItemId,
      removeProcessingItemId,
      marketAddress,
    ],
  );

  return {
    onSubmit,
    isSubmitting: isPending,
  };
};

// form is submitting
export const useFormIsSubmitting = () => {
  return closePositionFormSubmitStatus.useIsSubmitting();
};

export const useFormChangeAction = ({
  form,
  position,
}: {
  form: UseFormReturn<{
    orderType: ORDER_TYPE;
    px: string;
    size: string;
    receiveCoinType: string;
  }>;
  position: Position;
}) => {
  const { isLong, marketAddress } = position;
  const { getValues, setValue } = form;

  const [insts, coins] = useInstStore(
    useShallow((state) => [state.getInsts(), state.getCoins()]),
  );
  const inst = insts[marketAddress];

  const { mutate: calcClosePos } = useCalcClosePosition();
  const keepLeverageFromStore = usePreferenceStore(
    (state) => state.keepLeverage,
  );
  const keepLeverage = position.isZFP ? true : keepLeverageFromStore;
  const setPreferenceStore = usePreferenceStore((state) => state.setState);

  // handle sz input change
  const handleSzChange = useMemo(() => {
    const decounceUpdate = debounce(async ({ value, px, receiveCoinType }) => {
      const collateralCoinType = (
        isLong ? inst?.longTokenAddress : inst?.shortTokenAddress
      )!;

      await calcClosePos({
        sizeDelta: value,
        collateralCoin: coins[collateralCoinType],
        receiveCoin: coins[receiveCoinType],
        position,
        triggerPrice: px,
        keepLeverage: keepLeverage,
      });
    }, 200);

    return (value: string) => {
      setValue('size', value);
      const px = getValues('px');
      const receiveCoinType = getValues('receiveCoinType');

      decounceUpdate({ value, px, receiveCoinType });
    };
  }, [
    setValue,
    getValues,
    calcClosePos,
    position,
    inst,
    isLong,
    keepLeverage,
    coins,
  ]);

  // handle px change
  const handlePxChange = useCallback(
    (px: string) => {
      setValue('px', px);
      const size = getValues('size');
      handleSzChange(size);
    },
    [handleSzChange, setValue, getValues],
  );

  // handle receiveve coin type change
  const handleReceiveCoinTypeChange = useCallback(
    (receiveCoinType: string) => {
      setValue('receiveCoinType', receiveCoinType);
      const size = getValues('size');
      handleSzChange(size);
    },
    [handleSzChange, setValue, getValues],
  );

  // handle keep leverage checkbox
  const handleKeepLeverageChange = useCallback(
    (keepLeverage: boolean) => {
      setPreferenceStore({ keepLeverage });
      const size = getValues('size');
      handleSzChange(size);
    },
    [handleSzChange, getValues, setPreferenceStore],
  );

  return {
    onSzChange: handleSzChange,
    onPxChange: handlePxChange,
    onReceiveCoinTypeChange: handleReceiveCoinTypeChange,
    onKeepLeverageChange: handleKeepLeverageChange,
  };
};
