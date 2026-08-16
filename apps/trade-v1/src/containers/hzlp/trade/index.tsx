'use client';

import { useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import Trader from '@/components/hzlp/Trader';
import { HzlpTraderType } from '@/constants/hzlp/enum';
import { useTraderHolding } from '@/hooks/hzlp/useTraderHolding';
import { useTradeStore } from '@/stores/hzlp/trade';
import TraderLayout from './TraderLayout';

const HzlpTraderContainer: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, setTradeType] = useTradeStore(
    useShallow((state) => [state.tradeType, state.setTradeType]),
  );

  const { holdingValue, holdingValueUSD, isConnect, isLoading } =
    useTraderHolding();

  const handleBuyClick = useCallback(() => {
    setTradeType(HzlpTraderType.Buy);
  }, [setTradeType]);

  const handleSellClick = useCallback(() => {
    setTradeType(HzlpTraderType.Sell);
  }, [setTradeType]);

  return (
    <Trader
      isConnect={isConnect}
      holdingValue={holdingValue}
      holdingValueUSD={holdingValueUSD}
      isLoading={isLoading}
      onBuyClick={handleBuyClick}
      onSellClick={handleSellClick}
    >
      <TraderLayout />
    </Trader>
  );
};

HzlpTraderContainer.displayName = 'HzlpTraderContainer';

export default HzlpTraderContainer;
