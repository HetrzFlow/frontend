import { FC } from 'react';

import { useLingui } from '@lingui/react/macro';
import { Button, ShareIcon } from '@repo/ui';

import Collateral from '../../components/Collateral';
import InstSm from '../../components/InstSm';
import MarkPrice from '../../components/MarkPrice';
import Price from '../../components/Price';
import Size from '../../components/Size';
import LiqPrice from '../LiqPrice';
import PnL from '../PnL';

interface PosItemProps {
  targetCoin: string;
  size: string;
  leverage: string;
  collateral: string;
  isLong: boolean;
  entryPrice: string;
  entryFundingRate: string;
  id: string;
  onClose: (positionId: string) => void;
  onEditCollateral: (positionId: string) => void;
  onShowOrders: (positionId: string) => void;
  onOpenShareDialog: (positionId: string) => void;
}

const PosItem: FC<PosItemProps> = ({
  targetCoin,
  size,
  leverage,
  collateral,
  isLong,
  entryPrice,
  entryFundingRate,
  id,
  onClose,
  onEditCollateral,
  onShowOrders,
  onOpenShareDialog,
}) => {
  const { t } = useLingui();

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex justify-between">
        <InstSm targetCoin={targetCoin} lever={leverage} isLong={isLong} />
        <ShareIcon
          size={20}
          className="text-t-350"
          onClick={() => {
            onOpenShareDialog(id);
          }}
        />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-t-270 text-xs">{t`Net Value`}</span>
        <PnL
          targetCoin={targetCoin}
          isLong={isLong}
          size={size}
          collateral={collateral}
          entryPrice={entryPrice}
          entryFundingRate={entryFundingRate}
        />
      </div>
      <div className="scrollbar-none grid grid-cols-[3fr_2fr_2fr] gap-3 overflow-x-auto whitespace-nowrap">
        <div className="flex flex-col gap-1">
          <span className="text-t-270 text-xs">{t`Size`}</span>
          <Size
            size={size}
            closeOrderCount={0}
            onOpenOrdersDialog={() => {
              onShowOrders(id);
            }}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-t-270 text-xs">{t`Collateral`}</span>
          <Collateral
            collateral={collateral}
            editable
            onEdit={() => {
              onEditCollateral(id);
            }}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-t-270 text-right text-xs">{t`Entry Price`}</span>
          <Price
            targetCoin={targetCoin}
            price={entryPrice}
            className="justify-end"
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-t-270 text-xs">{t`Mark Price`}</span>
          <MarkPrice targetCoin={targetCoin} />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-t-270 text-xs">{t`Liq. Price`}</span>
          <LiqPrice
            id={id}
            targetCoin={targetCoin}
            entryPrice={entryPrice}
            size={size}
            collateral={collateral}
            entryFundingRate={`${entryFundingRate}`}
            isLong={isLong}
          />
        </div>
      </div>
      <Button
        className="bg-bg-5 hover:bg-bg-5/90 h-[36px] text-xs"
        onClick={() => onClose(id)}
      >{t`Close`}</Button>
    </div>
  );
};

export default PosItem;
