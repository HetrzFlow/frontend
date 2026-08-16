import { FC, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';

import { useLingui } from '@lingui/react/macro';
import { useShallow } from 'zustand/react/shallow';

import {
  TrendingDownIcon,
  TrendingUpIcon,
  Separator,
  SwapNavIcon,
} from '@repo/ui';
import { TradeTabs, useInstStore } from '@/common';
import {
  DYNAMIC_DATA_CACHE_TIME,
  STATIC_CONFIG_CACHE_TIME,
} from '@/common/constants/timeConstants';
import {
  useMarketsConfigs,
  useMarketsValues,
} from '@/common/services/rest/market';

import { SwapPanel } from '@/components/Swap';
import { ENABLE_SWAP } from '@/constants/common';
import { POS_SIDE, TRADE_TYPE } from '@/constants/enum';
import { MARKET_PX } from '@/constants/trade';
import { parseTradeRouteInstId } from '@/lib/credit/creditMarkets';
import { useTradeGlobalStore } from '@/stores/trade/global';
import HelpfulInfo from '../helpfulInfo';
import { useTradeStore } from '../store';

import OpenPosition, { type OpenPositionHandle } from './openPosition';
import { useOpenPositionSwap } from './openPosition/hooks/useOpenPositionSwap';
import OpenPositionSwapDetails from './openPosition/OpenPositionSwapDetails';

interface TradeBoxProps {
  showSwap?: boolean;
}

const TradeBox: FC<TradeBoxProps> = ({ showSwap = true }) => {
  const { t } = useLingui();
  const { instId: routeInstId } = useParams<{ instId?: string }>();
  const instId = useTradeGlobalStore((state) => state.instId);
  const [inst] = useInstStore(
    useShallow((state) => [state.getInst(state, instId)]),
  );
  const [
    tradeType,
    isSubmitting,
    formData,
    setTradeType,
    setFormRef,
    updateFormData,
  ] = useTradeStore(
    useShallow((state) => [
      state.tradeType,
      state.isSubmitting,
      state.formData,
      state.setTradeType,
      state.setFormRef,
      state.updateFormData,
    ]),
  );
  const longSwap = useOpenPositionSwap({
    inst,
    isLong: true,
    paySz: formData[TRADE_TYPE.long].paySz,
  });
  const shortSwap = useOpenPositionSwap({
    inst,
    isLong: false,
    paySz: formData[TRADE_TYPE.short].paySz,
  });
  const longDefaultPayTokenAddress =
    longSwap.defaultPayTokenAddress || inst?.longTokenAddress || '';
  const shortDefaultPayTokenAddress =
    shortSwap.defaultPayTokenAddress || inst?.shortTokenAddress || '';

  useMarketsConfigs({
    pollPriority: 1,
    markets: inst ? [inst] : [],
    priorityMarketAddress: inst?.marketTokenAddress,
    refetchInterval: STATIC_CONFIG_CACHE_TIME,
  });
  useMarketsValues(DYNAMIC_DATA_CACHE_TIME, {
    pollPriority: 1,
    markets: inst ? [inst] : [],
    priorityMarketAddress: inst?.marketTokenAddress,
  });

  const longRef = useRef<OpenPositionHandle>(null);
  const shortRef = useRef<OpenPositionHandle>(null);
  const canShowSwap = showSwap && ENABLE_SWAP;
  const marketBaseSymbol =
    inst?.symbol.split('/')[0] ??
    (routeInstId
      ? parseTradeRouteInstId(decodeURIComponent(routeInstId)).routeName.split(
          '/',
        )[0]
      : undefined);

  // record formRef
  useEffect(() => {
    setFormRef({
      [TRADE_TYPE.long]: longRef,
      [TRADE_TYPE.short]: shortRef,
    });
    return () => {
      // clear formRef
      setFormRef({
        [TRADE_TYPE.long]: null,
        [TRADE_TYPE.short]: null,
      });
    };
  }, [setFormRef]);

  // switch inst
  useEffect(() => {
    longRef.current?.syncInstChange({
      coin: longDefaultPayTokenAddress,
      px: MARKET_PX,
    });

    shortRef.current?.syncInstChange({
      coin: shortDefaultPayTokenAddress,
      px: MARKET_PX,
    });
  }, [
    inst?.marketTokenAddress,
    longDefaultPayTokenAddress,
    shortDefaultPayTokenAddress,
  ]);

  const options = useMemo(() => {
    const positionOptions = [
      {
        value: TRADE_TYPE.long,
        label: (
          <>
            <TrendingUpIcon />
            {t`Long`}
          </>
        ),
        activeBarClassName: 'bg-up/10',
        labelClassName: 'data-[state=active]:text-up',
        content: (
          <>
            <OpenPosition
              ref={longRef}
              onChange={(values) => updateFormData(TRADE_TYPE.long, values)}
              posSide={POS_SIDE.long}
              swap={longSwap}
            />
            <Separator className="mt-4 data-[orientation=horizontal]:h-0" />
            <HelpfulInfo />
            <OpenPositionSwapDetails swap={longSwap} />
          </>
        ),
      },
      {
        value: TRADE_TYPE.short,
        label: (
          <>
            <TrendingDownIcon />
            {t`Short`}
          </>
        ),
        labelClassName: 'data-[state=active]:text-down',
        activeBarClassName: 'bg-down/10',
        content: (
          <>
            <OpenPosition
              ref={shortRef}
              onChange={(values) => updateFormData(TRADE_TYPE.short, values)}
              posSide={POS_SIDE.short}
              swap={shortSwap}
            />
            <Separator className="mt-4 data-[orientation=horizontal]:h-0" />
            <HelpfulInfo />
            <OpenPositionSwapDetails swap={shortSwap} />
          </>
        ),
      },
    ];

    if (!canShowSwap) return positionOptions;

    return [
      ...positionOptions,
      {
        value: TRADE_TYPE.swap,
        label: (
          <>
            <SwapNavIcon />
            {t`Swap`}
          </>
        ),
        labelClassName: 'data-[state=active]:text-accent',
        activeBarClassName: 'bg-accent/10',
        content: <SwapPanel marketBaseSymbol={marketBaseSymbol} />,
      },
    ];
  }, [canShowSwap, longSwap, marketBaseSymbol, shortSwap, t, updateFormData]);

  return (
    <div className="relative">
      {isSubmitting && (
        <div className="absolute inset-0 z-10 cursor-not-allowed" />
      )}
      <TradeTabs
        className={isSubmitting ? 'pointer-events-none opacity-60' : ''}
        listClassName={canShowSwap ? 'text-xs' : 'grid-cols-2 text-xs'}
        contentWrapClassName="pb-10"
        value={tradeType}
        onValueChange={setTradeType as (value: string) => void}
        options={options}
      />
    </div>
  );
};

export default TradeBox;
