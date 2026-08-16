import { FC, ReactNode } from 'react';

import { useLingui } from '@lingui/react/macro';
import { EMPTY_DISPLAY, truncateFormat } from '@repo/lib/format';
import {
  cn,
  PencilLineIcon,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@repo/ui';
import { useInstStore, useMarketIsDisabled } from '@/common';
import MarketIsClosedTooltip from '@/components/MarketIsClosedTooltip';

interface PriceProps {
  instId?: string;
  marketAddress: string;
  price: string;
  triggerPriceAboveAllowed?: boolean;
  isMarket?: boolean;
  className?: string;
  placeholderText?: string;
  tooltipContent?: ReactNode;
  onEdit?: () => void;
}

const PriceTextTooltip = ({
  children,
  content,
}: {
  children?: ReactNode;
  content?: ReactNode;
}) => {
  if (!content) {
    return children;
  }
  return (
    <Tooltip>
      <TooltipTrigger className="decoration-t-430 cursor-pointer underline decoration-dotted underline-offset-2">
        {children}
      </TooltipTrigger>
      <TooltipContent className={'max-w-42'}>{content}</TooltipContent>
    </Tooltip>
  );
};

const Price: FC<PriceProps> = ({
  marketAddress,
  price,
  triggerPriceAboveAllowed,
  isMarket,
  className,
  placeholderText = EMPTY_DISPLAY,
  tooltipContent,
  onEdit,
}) => {
  const { t } = useLingui();
  const inst = useInstStore((state) => state.getInsts())[marketAddress || ''];
  const pxDispDecimal = inst?.pxDispDecimal;

  const marketIsDisabled = useMarketIsDisabled(marketAddress);

  return (
    <div
      className={cn(
        'font-plex flex items-center gap-1 leading-tight max-md:text-sm',
        className,
      )}
    >
      <PriceTextTooltip content={tooltipContent}>
        <>
          {isMarket
            ? t`Market Price`
            : triggerPriceAboveAllowed !== undefined
              ? triggerPriceAboveAllowed
                ? '≥ '
                : '≤ '
              : ''}
          {!isMarket && price
            ? truncateFormat(price, pxDispDecimal, {
                style: 'currency',
                currency: 'USD',
              })
            : placeholderText}
        </>
      </PriceTextTooltip>

      {onEdit && (
        <MarketIsClosedTooltip marketAddress={marketAddress}>
          <PencilLineIcon
            role="button"
            size={14}
            className={cn(
              'text-t-430 hover:text-t-1100 cursor-pointer',
              marketIsDisabled ? 'cursor-not-allowed' : '',
            )}
            onClick={(e) => {
              e.stopPropagation();
              if (marketIsDisabled) return;
              // edit price dialog
              onEdit();
            }}
          />
        </MarketIsClosedTooltip>
      )}
    </div>
  );
};

export default Price;
