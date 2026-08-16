import React, { FC, useEffect, useMemo } from 'react';

import { useLingui } from '@lingui/react/macro';
import { useFormContext, useWatch } from 'react-hook-form';

import { calc, truncate } from '@repo/lib/calc';
import { EMPTY_DISPLAY, thoFormat } from '@repo/lib/format';
import { ArrowDownUpIcon, cn, NumberInput } from '@repo/ui';
import { CoinIcon } from '@/common/components';
import { useInstStore } from '@/common/stores';
import { ORDER_TYPE } from '../../services/enum';
import { usePriceTickerStream } from '../../services/ws/tickers';
import { MARKET_PX, SWAP_PX_DECIMAL } from './consts';
import { useSwapStore } from './store';

const PriceInput: FC<{
  className?: string;
  value: string;
  onChange: (value: string) => void;
}> = ({ className, value, onChange }) => {
  const { t } = useLingui();
  const coins = useInstStore((state) => state.getCoins());
  const orderType = useSwapStore((state) => state.orderType);
  const { setValue } = useFormContext();

  const paySz = useWatch({ name: 'paySz' });
  const receiveSz = useWatch({ name: 'receiveSz' });
  const pxIsReversed = useWatch({ name: 'pxIsReversed' });

  const { coin: payCoin } = paySz;
  const { coin: receiveCoin } = receiveSz;
  const isMarket = orderType === ORDER_TYPE.market;

  const payCoinPx = usePriceTickerStream(
    coins[payCoin]?.symbol ? `${coins[payCoin]?.symbol}/USD` : '',
    { throttleWait: 5000 },
  ).data[0]?.p;
  const receiveCoinPx = usePriceTickerStream(
    coins[receiveCoin]?.symbol ? `${coins[receiveCoin]?.symbol}/USD` : '',
    { throttleWait: 5000 },
  ).data[0]?.p;
  const marketPx = useMemo(() => {
    if (payCoinPx && receiveCoinPx) {
      const px = calc(payCoinPx).div(receiveCoinPx);
      return truncate(pxIsReversed ? calc(1).div(px) : px);
    }
    return '';
  }, [payCoinPx, receiveCoinPx, pxIsReversed]);

  // handle px
  useEffect(() => {
    if (isMarket && value !== MARKET_PX) {
      setTimeout(() => {
        onChange(MARKET_PX);
      }, 0);
    }

    if (!isMarket && value === MARKET_PX && marketPx) {
      setTimeout(() => {
        onChange(marketPx);
      }, 0);
    }
  }, [isMarket, value, onChange, marketPx]);

  const dispMarketPx = useMemo(() => {
    if (isMarket) {
      return '';
    }
    return thoFormat(marketPx);
  }, [isMarket, marketPx]);

  const [baseCoin, quoteCoin] = useMemo(() => {
    return pxIsReversed ? [receiveCoin, payCoin] : [payCoin, receiveCoin];
  }, [pxIsReversed, payCoin, receiveCoin]);
  const baseCoinName = coins[baseCoin]?.symbol;

  return (
    <div
      className={cn(
        'transition-[height]',
        className,
        isMarket ? 'h-0 overflow-hidden' : 'h-[124px]',
      )}
    >
      <NumberInput
        className="mb-2 p-4"
        variant="ghost"
        inputWrapClassName="h-[50px]"
        inputClassName="font-plex text-2xl h-[28px]"
        label={
          <p className="flex items-center gap-1">
            {t`When 1 ${baseCoinName} worth`}
            <ArrowDownUpIcon
              className="text-foreground cursor-pointer"
              size={16}
              onClick={() => {
                setValue('pxIsReversed', !pxIsReversed);
                if (value && value !== MARKET_PX) {
                  onChange(truncate(calc(1).div(value)));
                }
              }}
            />
          </p>
        }
        labelClassName="text-muted-foreground text-sm font-normal"
        suffix={
          <div className="flex items-center gap-2 text-sm font-medium">
            <CoinIcon
              src={coins[quoteCoin]?.icon}
              alt={coins[quoteCoin]?.symbol}
              size={24}
            />
            {coins[quoteCoin]?.symbol ?? ''}
          </div>
        }
        disabled={isMarket}
        value={isMarket ? marketPx : value === MARKET_PX ? '' : value}
        innerExtra={
          dispMarketPx && (
            <p className="text-secondary-foreground text-sm">
              {t`Market: `}
              <span
                className={cn(
                  'font-plex underline-offset-2',
                  dispMarketPx === EMPTY_DISPLAY
                    ? 'pointer-events-none'
                    : 'cursor-pointer underline',
                )}
                onClick={() => onChange(MARKET_PX)}
              >
                {thoFormat(marketPx)}
              </span>
            </p>
          )
        }
        onValueChange={onChange}
        decimal={SWAP_PX_DECIMAL}
        max={10 ** 10}
        placeholder={'0.00'}
      />
    </div>
  );
};

export default PriceInput;
