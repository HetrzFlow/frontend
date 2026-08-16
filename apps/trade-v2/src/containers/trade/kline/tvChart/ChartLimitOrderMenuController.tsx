import {
  forwardRef,
  type RefObject,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

import { calc, truncate } from '@repo/lib/calc';
import { truncateFormat } from '@repo/lib/format';
import { getMediaSize, MEDIA_SIZES } from '@repo/ui';
import { useInstStore } from '@/common';
import { useMarketConfigs } from '@/common/services/rest/market';
import { ORDER_TYPE, TRADE_TYPE } from '@/constants/enum';
import { checkHasZFP } from '@/hooks/trade/useHasZFP';
import type { PlusClickParams } from '@/lib/charting_library/charting_library';
import { getCachedMarketExecutionPrice } from '@/lib/trade/executionPrice';
import { useTradeGlobalStore } from '@/stores/trade/global';
import { usePreferenceStore } from '@/stores/trade/preference';
import { useTradeStore } from '../../trading/store';
import ChartLimitOrderMenu, {
  type ChartLimitOrderMenuState,
} from './ChartLimitOrderMenu';

export interface ChartLimitOrderMenuControllerHandle {
  close: () => void;
  handlePlusClick: (params: PlusClickParams) => void;
}

interface ChartLimitOrderMenuControllerProps {
  chartContainerRef: RefObject<HTMLDivElement | null>;
}

const setLimitOrderPriceFromChart = (limitPrice: string) => {
  const tradeState = useTradeStore.getState();
  if (
    tradeState.tradeType !== TRADE_TYPE.long &&
    tradeState.tradeType !== TRADE_TYPE.short
  ) {
    return;
  }

  const tradeType = tradeState.tradeType;
  tradeState.setOrderType(ORDER_TYPE.limit);
  tradeState.updateFormData(tradeType, { px: limitPrice });
  tradeState.formRefs[tradeType]?.current?.setPrice(limitPrice);

  if (getMediaSize() === MEDIA_SIZES.SM) {
    tradeState.setStore({ smDialogOpen: true });
  }
};

const ChartLimitOrderMenuController = forwardRef<
  ChartLimitOrderMenuControllerHandle,
  ChartLimitOrderMenuControllerProps
>(({ chartContainerRef }, ref) => {
  const insts = useInstStore((state) => state.getInsts());
  const instId = useTradeGlobalStore((state) => state.instId);
  const inst = insts[instId];
  const { data: marketConfig } = useMarketConfigs(inst);
  const marketsConfigs = inst?.marketTokenAddress && marketConfig
    ? { [inst.marketTokenAddress]: marketConfig }
    : undefined;
  const tradeContextRef = useRef({ instId, insts, marketsConfigs });
  tradeContextRef.current = { instId, insts, marketsConfigs };

  const [menuState, setMenuState] =
    useState<ChartLimitOrderMenuState | null>(null);
  const menuStateRef = useRef(menuState);
  menuStateRef.current = menuState;

  const close = useCallback(() => {
    setMenuState(null);
  }, []);

  const handlePlusClick = useCallback(
    (params: PlusClickParams) => {
      if (menuStateRef.current) {
        close();
        return;
      }

      const tradeType = useTradeStore.getState().tradeType;
      if (
        tradeType !== TRADE_TYPE.long &&
        tradeType !== TRADE_TYPE.short
      ) {
        return;
      }
      if (!Number.isFinite(params.price) || params.price <= 0) return;

      const {
        instId: currentInstId,
        insts: currentInsts,
        marketsConfigs: currentMarketsConfigs,
      } = tradeContextRef.current;
      const currentInst = currentInsts[currentInstId];
      const pxDispDecimal = currentInst?.pxDispDecimal ?? 2;
      const limitPrice = truncate(params.price, pxDispDecimal);
      const isLong = tradeType === TRADE_TYPE.long;
      const markPrice = getCachedMarketExecutionPrice({
        symbol: currentInst?.symbol,
        indexTokenAddress: currentInst?.indexTokenAddress,
        isIncrease: true,
        isLong,
        priceType: 'aggregate',
      });
      const isStopIncrease = markPrice
        ? isLong
          ? calc(limitPrice).gt(markPrice)
          : calc(limitPrice).lt(markPrice)
        : false;
      const disabledReason =
        usePreferenceStore.getState().leverageMode === 'hyper' &&
        checkHasZFP(currentInst, currentMarketsConfigs)
          ? 'hyper'
          : !markPrice
            ? 'market-price-unavailable'
            : isStopIncrease
              ? 'stop-increase'
              : undefined;
      const iframeRect = chartContainerRef.current
        ?.querySelector('iframe')
        ?.getBoundingClientRect();

      setMenuState({
        x: params.clientX + (iframeRect?.left ?? 0),
        y: params.clientY + (iframeRect?.top ?? 0),
        limitPrice,
        formattedPrice: truncateFormat(limitPrice, pxDispDecimal, {
          currency: 'USD',
          style: 'currency',
          stripTrailingZeros: true,
        }),
        tradeType,
        disabledReason,
      });
    },
    [chartContainerRef, close],
  );

  const selectLimitOrderPrice = useCallback(
    (limitPrice: string) => {
      setLimitOrderPriceFromChart(limitPrice);
      close();
    },
    [close],
  );

  useImperativeHandle(
    ref,
    () => ({ close, handlePlusClick }),
    [close, handlePlusClick],
  );

  useEffect(() => close(), [close, instId]);

  return (
    <ChartLimitOrderMenu
      state={menuState}
      onClose={close}
      onSelect={selectLimitOrderPrice}
    />
  );
});

ChartLimitOrderMenuController.displayName = 'ChartLimitOrderMenuController';

export default ChartLimitOrderMenuController;
