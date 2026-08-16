import { useMemo } from 'react';
import { addHexPrefix } from '@hertzflow/sdk';
import { calc } from '@repo/lib/calc';
import {
  PoolDetailResData,
  getCachedPriceTickerData,
  useGlobalStore,
  useInstStore,
} from '@/common';

export interface ChartDataItem {
  token: string;
  amount: number;
  fill: string;
}

export const usePoolPieChartData = (
  data: PoolDetailResData['coin_details'],
) => {
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const coins = useInstStore((state) => state.getCoins());

  const [chartConfig, chartData] = useMemo(() => {
    const _chartConfig = {};
    const _chartData: ChartDataItem[] = data
      .map((v) => {
        const coinObjFromInstStore = coins[addHexPrefix(v.coin_type)];
        const coinPx = getCachedPriceTickerData(
          `${coinObjFromInstStore?.symbol}/USD`,
        )?.[0]?.p;
        return {
          token: v.coin_name,
          amount: coinPx
            ? +calc(v?.coin_amount ?? 0)
                .div(Math.pow(10, coinObjFromInstStore?.decimal ?? 8))
                .times(coinPx)
                .toFixed()
            : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount)
      .map((v, i) => ({ ...v, fill: `var(--chart-${i + 1})` }));

    if (!_chartData.length) {
      _chartData.push({
        token: '',
        amount: 1,
        fill: `var(--bg-3)`,
      });
    }

    return [_chartConfig, _chartData];
  }, [coins, data]);

  const isNoData = !data.length;

  return {
    chartConfig,
    chartData,
    isNoData,
    usdAmountDisplayDecimal,
  };
};
