import { FC, useEffect } from 'react';

import { useLingui } from '@lingui/react/macro';

import { useWatch } from 'react-hook-form';
import { useShallow } from 'zustand/react/shallow';
import { calc } from '@repo/lib/calc';
import { truncateFormat } from '@repo/lib/format';
import { cn, NumberInput } from '@repo/ui';
import {
  useGlobalStore,
  CoinSelector,
  usePriceTickerStream,
  useInstStore,
} from '@/common';

import { MARKET_PX } from '@/constants/common';
import { ORDER_TYPE } from '@/constants/enum';
import { useClosePosSizeAndFees } from '@/services/rest/trade';
import { usePosition } from '../context';

const ReceiveInput: FC<{
  className?: string;
  orderType: ORDER_TYPE;
  value: string;
  onChange: (value: string) => void;
}> = ({ className, orderType, value, onChange }) => {
  const { t } = useLingui();
  const { targetCoin, isLong } = usePosition();
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const [baseCoin, usdcCoin, coins] = useInstStore(
    useShallow((state) => [
      state.getCoins()[targetCoin],
      state.getUsdcCoin(state),
      state.getCoins(),
    ]),
  );

  const px = useWatch({ name: 'px' });

  const isMarket = orderType === ORDER_TYPE.market;
  const collateralCoin = isLong ? baseCoin : usdcCoin;

  const { data } = useClosePosSizeAndFees(
    collateralCoin?.coinType,
    value,
    3000,
  );

  const receiveCoin = coins[value];
  const receiveCoinMarketPx = usePriceTickerStream(
    receiveCoin ? `${receiveCoin.symbol}/USD` : '',
    { throttleWait: 5000 },
  ).data[0]?.p;
  const receiveCoinPx =
    (!isLong || px === MARKET_PX ? '' : px) || receiveCoinMarketPx;

  useEffect(() => {
    if (!value) {
      setTimeout(() => {
        onChange(
          (isMarket
            ? isLong
              ? baseCoin?.coinType
              : usdcCoin?.coinType
            : collateralCoin?.coinType) || '',
        );
      }, 0);
    }

    if (value && !isMarket && value !== collateralCoin?.coinType) {
      setTimeout(() => {
        onChange(collateralCoin?.coinType || '');
      }, 0);
    }
  }, [value, isMarket, isLong, onChange, collateralCoin, usdcCoin, baseCoin]);

  return (
    <div
      className={cn(
        'flex flex-col gap-2 overflow-hidden transition-[height]',
        className,
      )}
    >
      <NumberInput
        className="p-4"
        variant="ghost"
        isLoading={data?.isPending}
        label={
          <div className="text-secondary-foreground flex w-full items-center text-sm">
            <span>{t`Receive In`}</span>
          </div>
        }
        inputWrapClassName="h-[40px]"
        inputClassName="font-plex text-2xl h-[28px]"
        labelClassName="text-muted-foreground text-sm font-normal"
        suffix={
          <div className="flex items-center gap-2 text-2xl font-medium">
            <CoinSelector
              className="border"
              value={value}
              onSelect={onChange}
              disabled={!isMarket}
            />
          </div>
        }
        innerExtra={
          data?.receiveCoinAmount && (
            <p
              className={cn(
                'font-plex flex items-center overflow-hidden duration-200',
              )}
            >
              {truncateFormat(
                receiveCoinPx
                  ? calc(data.receiveCoinAmount).times(receiveCoinPx)
                  : '',
                usdAmountDisplayDecimal,
                {
                  style: 'currency',
                  currency: 'USD',
                  showMinDecimalValue: true,
                },
              )}
            </p>
          )
        }
        disabled
        value={data?.receiveCoinAmount}
        onValueChange={onChange}
        decimal={coins[value]?.decimal}
        placeholder={'0.00'}
      />
    </div>
  );
};

export default ReceiveInput;
