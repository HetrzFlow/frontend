import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { calc } from '@repo/lib/calc';
import { usePositionLiqPoolData } from '../../../services/rest/liqPool';
import { useSwapMaxIn } from '../../../services/rest/swap';
import { usePriceTickerStream } from '../../../services/ws/tickers';
import { useInstStore } from '../../../stores/instStore';

export const useAvailLiq = ({
  payCoinType = '',
  receiveCoinType = '',
}: {
  payCoinType?: string;
  receiveCoinType?: string;
}) => {
  const [coins, usdcCoin] = useInstStore(
    useShallow((state) => [state.getCoins(), state.getUsdcCoin(state)]),
  );
  const payCoin = coins[payCoinType];
  const receiveCoin = coins[receiveCoinType];
  const receiveCoinIsUsdc = usdcCoin?.coinType === receiveCoinType;
  const { data: liqPoolData } = usePositionLiqPoolData(
    receiveCoinIsUsdc ? `${payCoin?.symbol}/USD` : `${receiveCoin?.symbol}/USD`,
  );
  const { data: maxIn } = useSwapMaxIn(payCoinType, receiveCoinType);

  const payCoinPx = usePriceTickerStream(
    payCoin?.symbol ? `${payCoin?.symbol}/USD` : '',
    {
      throttleWait: 5000,
    },
  ).data[0]?.p;
  const receiveCoinPx = usePriceTickerStream(
    receiveCoin?.symbol ? `${receiveCoin?.symbol}/USD` : '',
    {
      throttleWait: 5000,
    },
  ).data[0]?.p;

  const maxOut = useMemo(() => {
    if (receiveCoinIsUsdc) {
      return liqPoolData?.usdc_pool_amount && liqPoolData.usdc_reserved_amount
        ? calc(liqPoolData.usdc_pool_amount).minus(
            liqPoolData.usdc_reserved_amount,
          )
        : '';
    } else {
      return liqPoolData?.pool_amount && liqPoolData.reserved_amount
        ? calc(liqPoolData.pool_amount).minus(liqPoolData.reserved_amount)
        : '';
    }
  }, [receiveCoinIsUsdc, liqPoolData]);
  const [availValue, maxInValue, maxOutValue] = useMemo(() => {
    const _maxInvalue = payCoinPx && maxIn ? calc(payCoinPx).times(maxIn) : '';
    const _maxOutValue =
      receiveCoinPx && maxOut ? calc(receiveCoinPx).times(maxOut) : '';
    return [
      calc(_maxInvalue || Infinity).lt(_maxOutValue || Infinity)
        ? _maxInvalue
        : _maxOutValue,
      _maxInvalue,
      _maxOutValue,
    ];
  }, [receiveCoinPx, payCoinPx, maxIn, maxOut]);

  return {
    availLiqUsd: availValue,
    maxIn,
    maxInUsd: maxInValue,
    maxOut,
    maxOutUsd: maxOutValue,
  };
};
