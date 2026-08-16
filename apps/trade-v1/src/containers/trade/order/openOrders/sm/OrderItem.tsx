import { FC } from 'react';

import { useLingui } from '@lingui/react/macro';
import { calc } from '@repo/lib/calc';
import { dateFormat } from '@repo/lib/format';
import { Button } from '@repo/ui';
import { usePriceTickerStream, useInstStore } from '@/common';

import InstSm from '../../components/InstSm';
import MarkPrice from '../../components/MarkPrice';
import Price from '../../components/Price';
import Size from '../../components/Size';
import Collateral from '../Collateral';

interface OrderItemProps {
  targetCoin: string;
  size: string;
  triggerPrice: string;
  triggerAboveThreshold: boolean;
  payCoin: string;
  payCoinAmount: string;
  collateralUsd?: string;
  isLong: boolean;
  isLimit: boolean;
  orderId: string;
  timestamp: number;
  onCancel: () => void;
  onEditPrice: (orderId: string) => void;
}

const OrderItem: FC<OrderItemProps> = ({
  targetCoin,
  size,
  triggerPrice,
  payCoin,
  payCoinAmount,
  collateralUsd,
  triggerAboveThreshold,
  isLimit,
  isLong,
  orderId,
  timestamp,
  onCancel,
  onEditPrice,
}) => {
  const { t } = useLingui();
  const coins = useInstStore((state) => state.getCoins());
  const payCoinObj = coins[payCoin];
  const payCoinPx = usePriceTickerStream(
    payCoinObj ? `${payCoinObj?.symbol}/USD` : '',
    { throttleWait: 5000 },
  ).data[0]?.p;
  const collateral =
    collateralUsd ||
    (payCoinObj && payCoinPx && payCoinAmount
      ? calc(payCoinAmount || '')
          .div(payCoin ? Math.pow(10, payCoinObj.decimal) : '')
          .times(payCoinPx ?? '')
      : '');

  const leverage = calc(size).div(collateral).toFixed();

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex justify-between">
        <InstSm
          targetCoin={targetCoin}
          isLong={isLong}
          lever={leverage}
          // only limit order for now
          orderType={t`Limit`}
        />
      </div>
      <div className="scrollbar-none grid grid-cols-[3fr_2fr_2fr] gap-3 overflow-x-auto whitespace-nowrap">
        <div className="flex flex-col gap-1">
          <span className="text-t-270 text-xs">{t`Size`}</span>
          <Size size={size} closeOrderCount={0} />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-t-270 text-xs">{t`Collateral`}</span>
          <Collateral
            payCoin={payCoin}
            payCoinAmount={payCoinAmount}
            collateralUsd={collateralUsd}
            triggerPrice={payCoin === targetCoin ? triggerPrice : ''}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-t-270 text-right text-xs">{t`Price`}</span>
          <Price
            className="justify-end"
            targetCoin={targetCoin}
            price={triggerPrice}
            triggerPriceAboveAllowed={triggerAboveThreshold}
            isMarket={!isLimit}
            onEdit={() => onEditPrice(orderId)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-t-270 text-xs">{t`Mark Price`}</span>
          <MarkPrice targetCoin={targetCoin} />
        </div>
      </div>

      <div className="text-t-270 flex justify-between text-xs">
        <span>{t`Time`}</span>
        <span>{dateFormat(timestamp, 'yyyy/MM/dd HH:mm:ss')}</span>
      </div>
      <Button
        className="bg-bg-5 hover:bg-bg-5/90 h-[36px] text-xs"
        onClick={() => onCancel()}
      >{t`Cancel`}</Button>
    </div>
  );
};

export default OrderItem;
