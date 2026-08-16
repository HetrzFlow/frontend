'use client';

import { FC, useState, useDeferredValue, useMemo } from 'react';
import { getViemChain } from '@hertzflow/sdk-v2/configs/chains';
import { useLingui } from '@lingui/react/macro';

import { CoinIcon } from '@repo/common/components';
import { calc, truncate } from '@repo/lib/calc';
import {
  EMPTY_DISPLAY_SHORT,
  formatAddress,
  unitFormat,
} from '@repo/lib/format';
import { CircleXIcon, CopyIcon, Input, SearchIcon, toast } from '@repo/ui';

import { useBalances, useHzSdk } from '../../chainClient/hooks';
import { getUsdPriceSymbol } from '../../constants';
import { usePriceTickerStream } from '../../services/ws/tickers';
import { useGlobalStore } from '../../stores/globalStore';
import { useInstStore } from '../../stores/instStore';

interface ContentProps {
  excludeHzlp?: boolean;
  onSelect: (value: string) => void;
}

const Content: FC<ContentProps> = ({ excludeHzlp, onSelect }) => {
  const { t } = useLingui();
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const hzSdk = useHzSdk();
  const explorerHost = hzSdk
    ? getViemChain(hzSdk.config.chainId).blockExplorers?.default.url
    : '';
  const balances = useBalances();
  const coinsArr = useInstStore((state) => state.getCoinsArr());
  const coins = useInstStore((state) => state.getCoins());
  const instIds = useMemo(() => {
    return (
      balances
        ?.filter((v) => v && coins[v.address]?.symbol)
        .map((v) => getUsdPriceSymbol(coins[v!.address]?.symbol)) || []
    );
  }, [balances, coins]);

  const { data: prices } = usePriceTickerStream(instIds, {
    throttleWait: 5000,
  });
  const [searchText, setSearchText] = useState<string>('');
  const deferredSearchText = useDeferredValue(searchText);
  const coinList = useMemo(
    () =>
      coinsArr.filter(
        (coin) =>
          !coin.isSynthetic && (excludeHzlp ? coin.symbol !== 'HzLP' : true),
      ),
    [excludeHzlp, coinsArr],
  );

  const allBalancesMap = useMemo(() => {
    const pricesMap = Object.fromEntries(
      instIds.map((instId, i) => [instId, prices[i]?.[0]?.p]),
    );
    return (
      balances?.reduce(
        (acc: Record<string, { sz: string; usdValue?: string }>, item) => {
          if (!item) {
            return acc;
          }
          const sz = truncate(
            calc(item.totalBalance).div(
              Math.pow(10, coins[item.address]?.decimal || 0),
            ),
            coins[item.address]?.decimal,
          );
          const px = pricesMap[getUsdPriceSymbol(coins[item.address]?.symbol)];
          acc[item.address] = {
            sz: sz,
            usdValue:
              item.address && px
                ? truncate(calc(sz).times(px), usdAmountDisplayDecimal)
                : '',
          };

          return acc;
        },
        {},
      ) ?? {}
    );
  }, [balances, coins, instIds, prices, usdAmountDisplayDecimal]);

  const sortedCoinList = useMemo(
    () => [
      ...[...coinList].sort((a, b) => {
        return calc(allBalancesMap[a.address]?.usdValue || 0).gt(
          allBalancesMap[b.address]?.usdValue || 0,
        )
          ? -1
          : 1;
      }),
    ],
    [coinList, allBalancesMap],
  );

  const handleSelect = (value: string) => {
    onSelect(value);
  };

  const filteredCoinList = useMemo(() => {
    const lowerStr = deferredSearchText.toLowerCase();
    const normalizedStr = deferredSearchText;

    return sortedCoinList.filter((coin) => {
      if (coin.symbol.toLowerCase().includes(lowerStr)) {
        return true;
      }
      const coinType = coin.address.toLowerCase();
      return (
        coinType.includes(normalizedStr.toLowerCase()) ||
        coin.address.includes(lowerStr)
      );
    });
  }, [sortedCoinList, deferredSearchText]);

  return (
    <div>
      <Input
        className="bg-bg-4 px-3"
        inputClassName="text-sm font-normal"
        variant="ghost"
        value={deferredSearchText}
        prefix={<SearchIcon />}
        suffix={
          <span
            className="text-t-430 cursor-pointer"
            onClick={() => setSearchText('')}
          >
            {deferredSearchText && <CircleXIcon />}
          </span>
        }
        onChange={(e) => setSearchText(e.target.value)}
        placeholder={t`Search by token or paste address`}
      />
      <div className="mt-2 max-h-140 min-h-100 overflow-y-auto">
        {filteredCoinList.map((coin) => (
          <div
            key={coin.address}
            className="hover:bg-bg-4 my-2 flex cursor-pointer items-center rounded-xl p-2 text-base font-medium transition-[background] duration-400"
            onClick={() => handleSelect(coin.address)}
          >
            <CoinIcon src={coin.icon} alt={coin.symbol} size={36} />
            <div className="ml-3 flex h-12 flex-col">
              <span>{coin.symbol}</span>
              <span className="text-secondary-foreground mt-auto text-xs font-normal">
                {coin.name}
              </span>
              <span className="text-secondary-foreground mt-auto flex items-center gap-1 text-xs font-normal">
                <a
                  href={`${explorerHost}/coin/${coin.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {formatAddress(coin.address)}
                </a>
                <CopyIcon
                  className="hover:text-foreground text-t-430 cursor-pointer"
                  size={14}
                  onClick={(e) => {
                    navigator.clipboard.writeText(coin.address);
                    toast.success(t`Address Copied`, {
                      id: 'token-address-copy',
                    });
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                />
              </span>
            </div>
            <div className="font-plex ml-auto flex h-10 flex-col justify-center text-right">
              {balances ? (
                <>
                  <span>
                    {unitFormat(
                      allBalancesMap[coin.address]?.sz || '0',
                      coin.szDispDecimal,
                      {
                        minNumber: 1000000,
                        stripTrailingZeros: true,
                        showMinDecimalValue: true,
                      },
                    )}
                  </span>
                  <span className="text-secondary-foreground mt-auto text-sm font-normal">
                    {unitFormat(
                      allBalancesMap[coin.address]?.usdValue || 0,
                      usdAmountDisplayDecimal,
                      {
                        style: 'currency',
                        currency: 'USD',
                        minNumber: 1000000,
                        showMinDecimalValue: true,
                        stripTrailingZeros: true,
                      },
                    )}
                  </span>
                </>
              ) : (
                <span className="text-t-430 text-base">
                  {EMPTY_DISPLAY_SHORT}
                </span>
              )}
            </div>
          </div>
        ))}
        {!filteredCoinList.length && (
          <p className="text-t-430 mt-2 text-center text-sm">{t`No results`}</p>
        )}
      </div>
    </div>
  );
};

export default Content;
