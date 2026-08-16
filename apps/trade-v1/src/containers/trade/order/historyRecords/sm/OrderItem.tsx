import { FC } from 'react';

import { useLingui } from '@lingui/react/macro';
import { calc } from '@repo/lib/calc';
import { dateFormat, EMPTY_DISPLAY_SHORT } from '@repo/lib/format';
import { Button, Separator } from '@repo/ui';

import Collateral from '../../components/Collateral';
import Inst from '../../components/Inst';
import InstSm from '../../components/InstSm';
import Price from '../../components/Price';
import Size from '../../components/Size';
import Digest from '../Digest';
import ActionType from '../EventType';
import Fee from '../Fee';
import OrderType from '../OrderType';
import PnL from '../PnL';

interface OrderItemProps {
  targetCoin: string;
  size: string;
  price: string;
  collateral: string;
  fee: string;
  digest: string;
  orderType: string;
  eventType: string;
  pnl: string;
  isClose: boolean;
  timestamp: number;
  direction: string;
}

const OrderItem: FC<OrderItemProps> = ({
  targetCoin,
  size,
  price,
  collateral,
  digest,
  orderType,
  eventType,
  pnl,
  isClose,
  fee,
  timestamp,
  direction,
}) => {
  const { t } = useLingui();

  return (
    <div className="flex flex-col gap-3 border-b p-4 last:border-b-0">
      <div className="flex justify-between">
        <InstSm
          targetCoin={targetCoin}
          isLong={direction === 'long'}
          orderType={orderType ? <OrderType value={orderType} /> : undefined}
          showSeparator
        >
          <Separator orientation="vertical" className="!h-4" />
          <ActionType value={eventType} notShowDirection />
        </InstSm>
      </div>
      <div className="scrollbar-none grid grid-cols-[3fr_2fr_2fr] gap-3 overflow-x-auto whitespace-nowrap">
        <div className="flex flex-col gap-1">
          <span className="text-t-270 text-xs">{t`Price`}</span>
          <Price targetCoin={targetCoin} price={price} />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-t-270 text-xs">{t`Size`}</span>
          <Size size={size} showSign className="text-t-1100" />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-t-270 text-right text-xs">{t`Collateral`}</span>
          <Collateral
            className="justify-end"
            collateral={calc(collateral).abs().toFixed()}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-t-270 text-xs">{t`Fee`}</span>
          <Fee className="" fee={fee} />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-t-270 text-xs">{t`PnL`}</span>
          <PnL pnl={pnl} isClose={isClose} />
        </div>
      </div>
      <div className="text-t-270 flex justify-between text-xs">
        <span>{t`Time`}</span>
        <span>{dateFormat(timestamp, 'yyyy/MM/dd HH:mm:ss')}</span>
      </div>
      <div className="text-t-270 flex justify-between text-xs">
        <span>{t`Txns`}</span>
        <Digest digest={digest} className="text-xs" />
      </div>
    </div>
  );
};

export default OrderItem;
