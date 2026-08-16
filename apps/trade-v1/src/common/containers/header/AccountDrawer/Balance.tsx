import { useEffect, useMemo } from 'react';
import { useLingui } from '@lingui/react/macro';
import { BN, calc, truncate } from '@repo/lib/calc';
import { unitFormat } from '@repo/lib/format';
import { IMAGES_MAP } from '../../../assets';
import { useBalances } from '../../../chainClient/hooks';
import { useHzLPDetail } from '../../../services/rest/hzlp';
import { Coin } from '../../../services/rest/inst';
import { useHZLPPrice } from '../../../services/rest/price';
import { usePriceTickerStream } from '../../../services/ws/tickers';
import { useGlobalStore } from '../../../stores/globalStore';
import { useInstStore } from '../../../stores/instStore';
import { useStore } from '../store';

const Balance = () => {
  const { t } = useLingui();
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );

  const balances = useBalances();

  const coinsArr = useInstStore((state) => state.getCoinsArr());
  const setAssetList = useStore((state) => state.setAssetList);

  const { data: hzlpDetail } = useHzLPDetail();

  const { data: prices } = usePriceTickerStream(
    coinsArr.map((coin) => `${coin.symbol}/USD`),
    { throttleWait: 5000 },
  );

  const hzlpPx = useHZLPPrice();

  const filteredCoinList = useMemo(() => {
    if (!balances) {
      return [];
    }

    const balancesObj = Object.fromEntries(
      balances.map((v) => [v!.coinType, v!.totalBalance]),
    );

    const result: { coin: Coin; size: string; usdValue: string | BN }[] =
      coinsArr.map((v, i) => {
        const { coinType, decimal } = v;
        const totalBalance = balancesObj[coinType];
        const size = totalBalance
          ? truncate(
              calc(totalBalance).div(Math.pow(10, decimal || 0)),
              decimal,
            )
          : '0';
        const px = prices[i]?.[0]?.p;
        const usdValue = px ? calc(size).times(px) : '0';

        return {
          coin: v,
          size,
          usdValue,
        };
      });

    const {
      coin_type: hzlpCoinType = '',
      hzlp_decimal: hzlpDecimal,
      symbol: hzlpSymbol,
      coin_name: hzlpName,
    } = hzlpDetail || {};
    const totalBalance = balancesObj[hzlpCoinType];
    const size = totalBalance
      ? truncate(
          calc(totalBalance).div(calc(10).pow(hzlpDecimal ?? '')),
          hzlpDecimal,
        )
      : '0';
    const usdValue = hzlpPx ? calc(size).times(hzlpPx) : '0';
    result.push({
      coin: {
        coinType: hzlpCoinType,
        icon: IMAGES_MAP.coinIcons.HzLP,
        symbol: hzlpSymbol,
        name: hzlpName,
      } as Coin,
      size,
      usdValue,
    });

    result.sort((a, b) => {
      return calc(a.usdValue).gt(b.usdValue) ? -1 : 1;
    });
    return result;
  }, [balances, coinsArr, hzlpDetail, prices, hzlpPx]);

  useEffect(() => {
    setAssetList(filteredCoinList);
  }, [filteredCoinList, setAssetList]);

  const balance = useMemo(() => {
    return filteredCoinList.reduce((acc, cur) => {
      return calc(acc).plus(cur.usdValue);
    }, calc(0));
  }, [filteredCoinList]);

  return (
    <div className="px-6">
      <div className="text-t-350 text-sm">{t`Balance`}</div>
      <div className="font-plex text-[calc(var(--spacing)*8)]/tight font-medium">
        {unitFormat(balance, usdAmountDisplayDecimal, {
          style: 'currency',
          currency: 'USD',
          minNumber: 1000000,
          showMinDecimalValue: true,
          stripTrailingZeros: true,
        })}
      </div>
    </div>
  );
};

export default Balance;
