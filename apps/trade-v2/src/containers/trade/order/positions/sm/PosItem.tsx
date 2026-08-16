import { FC, useCallback } from 'react';

import { useLingui } from '@lingui/react/macro';
import { useShallow } from 'zustand/react/shallow';
import { calc } from '@repo/lib/calc';
import { Button, LoaderCircleIcon, ShareIcon } from '@repo/ui';

import {
  getCreditAwareUsdPriceSymbol,
  type Position,
  useInstStore,
} from '@/common';
import MarketIsClosedTooltip from '@/components/MarketIsClosedTooltip';
import type { ORDER_TYPE } from '@/constants/enum';
import { usePriceTickerExecutionPrice } from '@/lib/trade/executionPrice';
import Collateral from '../../components/Collateral';
import InstSm from '../../components/InstSm';
import MarkPrice from '../../components/MarkPrice';
import Price from '../../components/Price';
import Size from '../../components/Size';
import LiqPrice from '../components/LiqPrice';
import PnL from '../components/PnL';
import TpSl from '../components/TpSl';
import { usePositionsStore } from '../store';

interface PosItemProps {
  position: Position;
  marketAddress: string;
  sizeInUsd: string;
  collateralAmount: string;
  collateralTokenAddress: string;
  isLong: boolean;
  isHyper?: boolean;
  entryPrice: string;
  id: string;
  pendingBorrowingFeesUsd: string;
  pendingImpactAmount: string;
  fundingFeeAmount: string;
  pendingLossRebateUsd?: string;
  isCreditMarket?: boolean;
  onClose: (
    positionId: string,
    defaultValues?: {
      orderType: ORDER_TYPE;
    },
  ) => void;
  onEditCollateral: (positionId: string) => void;
  onShowOrders: (positionId: string) => void;
  onOpenShareDialog: (positionId: string) => void;
  onOpenTpSlOrdersDialog: (position: Position) => void;
}

const PosItem: FC<PosItemProps> = ({
  position,
  marketAddress,
  sizeInUsd,
  collateralAmount,
  collateralTokenAddress,
  isLong,
  isHyper,
  entryPrice,
  id,
  pendingBorrowingFeesUsd,
  pendingImpactAmount,
  fundingFeeAmount,
  pendingLossRebateUsd,
  isCreditMarket,
  onClose,
  onEditCollateral,
  onShowOrders,
  onOpenShareDialog,
  onOpenTpSlOrdersDialog,
}) => {
  const { t } = useLingui();
  const coins = useInstStore((state) => state.getCoins());
  const collateralTokenPx = usePriceTickerExecutionPrice({
    symbol: getCreditAwareUsdPriceSymbol({
      isCreditMarket,
      tokenSymbol: coins[collateralTokenAddress]?.symbol,
    }),
    isIncrease: false,
    isLong,
    priceType: 'min',
  });
  const collateralUsd = calc(collateralAmount).times(collateralTokenPx || '');
  const leverage = calc(sizeInUsd).div(collateralUsd).toFixed();

  const [processingItemIds, isClosingAll] = usePositionsStore(
    useShallow((state) => [state.processingItemIds, state.isClosingAll]),
  );

  const isThisItemProcessing = processingItemIds.has(id);
  const isAnyProcessing = processingItemIds.size > 0;
  const isDisabled = isThisItemProcessing || isClosingAll || isAnyProcessing;

  const handleClose = useCallback(() => {
    if (isDisabled) return;
    onClose(id);
  }, [id, isDisabled, onClose]);

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex justify-between">
        <InstSm
          marketAddress={marketAddress}
          lever={leverage}
          isLong={isLong}
          isHyper={isHyper}
          isCreditMarket={isCreditMarket}
        />
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
          marketAddress={marketAddress}
          isLong={isLong}
          size={sizeInUsd}
          collateralAmount={collateralAmount}
          collateralTokenAddress={collateralTokenAddress}
          entryPrice={entryPrice}
          pendingBorrowingFeesUsd={pendingBorrowingFeesUsd}
          pendingImpactAmount={pendingImpactAmount}
          fundingFeeAmount={fundingFeeAmount}
          pendingLossRebateUsd={pendingLossRebateUsd}
        />
      </div>
      <div className="scrollbar-none grid grid-cols-[3fr_2fr_2fr] gap-3 whitespace-nowrap">
        <div className="flex flex-col gap-1">
          <span className="text-t-270 text-xs">{t`Size`}</span>
          <Size
            size={sizeInUsd}
            closeOrderCount={0}
            onOpenOrdersDialog={() => {
              onShowOrders(id);
            }}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-t-270 text-xs">{t`Collateral`}</span>
          <Collateral
            marketAddress={marketAddress}
            collateralAmount={collateralAmount}
            collateralTokenAddress={collateralTokenAddress}
            price={collateralTokenPx}
            editable
            isHyper={isHyper}
            lossRebateUsd={pendingLossRebateUsd}
            lossRebatePending
            onEdit={() => {
              onEditCollateral(id);
            }}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-t-270 text-right text-xs">{t`Entry Price`}</span>
          <Price
            marketAddress={marketAddress}
            price={entryPrice}
            className="justify-end"
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-t-270 text-xs">{t`Mark Price`}</span>
          <MarkPrice marketAddress={marketAddress} />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-t-270 text-xs">{t`Liq. Price`}</span>
          <LiqPrice
            id={id}
            position={position}
            marketAddress={marketAddress}
            entryPrice={entryPrice}
            sizeInUsd={sizeInUsd}
            collateralAmount={collateralAmount}
            collateralTokenAddress={collateralTokenAddress}
            isLong={isLong}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-t-270 text-xs">{t`TP/SL Price`}</span>
        <TpSl
          position={position}
          marketAddress={marketAddress}
          isLong={isLong}
          collateralTokenAddress={collateralTokenAddress}
          onOpenTpSlOrdersDialog={onOpenTpSlOrdersDialog}
        />
      </div>
      <MarketIsClosedTooltip marketAddress={marketAddress}>
        <Button
          className="bg-bg-5 hover:bg-bg-5/90 h-[36px] w-full text-xs"
          disabled={isDisabled}
          onClick={handleClose}
        >
          {isThisItemProcessing ? (
            <>
              <LoaderCircleIcon size={16} className="animate-spin" />
              {t`Closing`}
            </>
          ) : (
            t`Close`
          )}
        </Button>
      </MarketIsClosedTooltip>
    </div>
  );
};

export default PosItem;
