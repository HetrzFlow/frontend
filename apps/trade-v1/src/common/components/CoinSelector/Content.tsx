'use client';

import { FC, useState, useDeferredValue, useMemo } from 'react';
import { useLingui } from '@lingui/react/macro';

import { normalizeStructTag, normalizeSuiAddress } from '@mysten/sui/utils';

import { calc, truncate } from '@repo/lib/calc';
import {
  EMPTY_DISPLAY_SHORT,
  formatAddress,
  unitFormat,
} from '@repo/lib/format';
import { CircleXIcon, CopyIcon, Input, SearchIcon, toast } from '@repo/ui';

import { useBalances } from '../../chainClient/hooks';
import { usePriceTickerStream } from '../../services/ws/tickers';
import { useGlobalStore } from '../../stores/globalStore';
import { useInstStore } from '../../stores/instStore';
import { useWalletStore } from '../../stores/walletStore';
import CoinIcon from '../CoinIcon';

interface ContentProps {
  excludeHzlp?: boolean;
  onSelect: (value: string) => void;
}

const Content: FC<ContentProps> = ({ excludeHzlp, onSelect }) => {
  const { t } = useLingui();
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const explorerHost = useWalletStore((state) => state.getExplorerHost());
  const balances = useBalances();
  const coinsArr = useInstStore((state) => state.getCoinsArr());
  const coins = useInstStore((state) => state.getCoins());
  const instIds = useMemo(() => {
    return (
      balances
        ?.filter((v) => v && coins[v.coinType]?.symbol)
        .map((v) => `${coins[v!.coinType]?.symbol}/USD`) || []
    );
  }, [balances, coins]);

  const { data: prices } = usePriceTickerStream(instIds, {
    throttleWait: 5000,
  });
  const [searchText, setSearchText] = useState<string>('');
  const deferredSearchText = useDeferredValue(searchText);
  const coinList = useMemo(
    () => coinsArr.filter((v) => (excludeHzlp ? v.symbol !== 'HzLP' : true)),
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
              Math.pow(10, coins[item.coinType]?.decimal || 0),
            ),
            coins[item.coinType]?.decimal,
          );
          const px = pricesMap[`${coins[item.coinType]?.symbol}/USD`];
          acc[item.coinType] = {
            sz: sz,
            usdValue:
              item.coinType && px
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
      ...coinList.sort((a, b) => {
        return calc(allBalancesMap[a.coinType]?.usdValue || 0).gt(
          allBalancesMap[b.coinType]?.usdValue || 0,
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
    const normalizedStr = deferredSearchText.includes('::')
      ? normalizeStructTag(deferredSearchText)
      : normalizeSuiAddress(deferredSearchText);

    return sortedCoinList.filter((coin) => {
      if (coin.symbol.toLowerCase().includes(lowerStr)) {
        return true;
      }
      const coinType = coin.coinType.toLowerCase();
      return (
        coinType.includes(normalizedStr.toLowerCase()) ||
        coin.coinType.includes(lowerStr)
      );
    });
  }, [sortedCoinList, deferredSearchText]);

  return (
    <div>
      <Input
        className="px-3"
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
            key={coin.symbol}
            className="hover:bg-bg-3 my-2 flex cursor-pointer items-center rounded-lg p-2 text-base font-medium transition-[background] duration-400"
            onClick={() => handleSelect(coin.coinType)}
          >
            <CoinIcon src={coin.icon} alt={coin.symbol} size={36} />
            <div className="ml-3 flex h-12 flex-col">
              <span>{coin.symbol}</span>
              <span className="text-secondary-foreground mt-auto text-xs font-normal">
                {coin.name}
              </span>
              <span className="text-secondary-foreground mt-auto flex items-center gap-1 text-xs font-normal">
                <a
                  href={`${explorerHost}/coin/${coin.coinType}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {formatAddress(coin.coinType)}
                </a>
                <CopyIcon
                  className="hover:text-foreground text-t-430 cursor-pointer"
                  size={14}
                  onClick={(e) => {
                    navigator.clipboard.writeText(coin.coinType);
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
                      allBalancesMap[coin.coinType]?.sz || '0',
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
                      allBalancesMap[coin.coinType]?.usdValue || 0,
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
