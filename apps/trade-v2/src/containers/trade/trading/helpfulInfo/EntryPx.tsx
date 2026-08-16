import { FC, memo } from 'react';
import { useLingui } from '@lingui/react/macro';
import { useShallow } from 'zustand/react/shallow';
import { BN } from '@repo/lib/calc';
import { EMPTY_DISPLAY, percentFormat, truncateFormat } from '@repo/lib/format';
import { cn, Tooltip, TooltipContent, TooltipTrigger } from '@repo/ui';
import { useInstStore } from '@/common';
import { ORDER_TYPE } from '@/common/services/enum';

import ListItem from '@/components/ListItem';
import { useTradeGlobalStore } from '@/stores/trade/global';
import { usePreferenceStore } from '@/stores/trade/preference';
import { useTradeStore } from '../store';

interface EntryPxProps {
  hasPosition: boolean;
  curEntryPrice?: string | BN;
  nextEntryPrice?: string | BN;
}

const EntryPx: FC<EntryPxProps> = ({
  hasPosition,
  curEntryPrice,
  nextEntryPrice,
}) => {
  const { t } = useLingui();
  const instId = useTradeGlobalStore((state) => state.instId);
  const inst = useInstStore((state) => state.getInst(state, instId));
  const pxDispDecimal = inst?.pxDispDecimal;
  const slippage = usePreferenceStore((state) => state.slippage);
  const dispSlippage = percentFormat(slippage);
  const [smDialogOpen, orderType] = useTradeStore(
    useShallow((state) => [state.smDialogOpen, state.orderType]),
  );

  const dispCurEntryPrice = truncateFormat(curEntryPrice, pxDispDecimal, {
    style: 'currency',
    currency: 'USD',
  });
  const dispNextEntryPrice = truncateFormat(nextEntryPrice, pxDispDecimal, {
    style: 'currency',
    currency: 'USD',
  });

  const hasNextEntryPrice = dispNextEntryPrice !== EMPTY_DISPLAY;

  return (
    <ListItem
      label={t`Entry Price`}
      value={
        hasPosition && hasNextEntryPrice ? (
          <>
            <span className={'text-t-270'}>{dispCurEntryPrice}</span>
            <span className="text-secondary-foreground">{' → '}</span>
            <Tooltip>
              <TooltipTrigger
                className={cn(
                  'decoration-t-430 underline decoration-dotted underline-offset-3',
                )}
              >
                {dispNextEntryPrice}
              </TooltipTrigger>
              <TooltipContent
                side="left"
                className="w-[224px]"
                inDialog={smDialogOpen}
                collisionBoundary={document.querySelector('.tradingContainer')}
              >
                <p>{t`Your current position's entry price will change from ${
                  dispCurEntryPrice
                } to ${dispNextEntryPrice}.`}</p>
              </TooltipContent>
            </Tooltip>
          </>
        ) : (
          <Tooltip>
            <TooltipTrigger
              className={cn(
                'decoration-t-430 decoration-dotted underline-offset-3',
                !hasNextEntryPrice ? 'cursor-auto no-underline' : 'underline',
              )}
            >
              {hasPosition ? dispCurEntryPrice : dispNextEntryPrice}
            </TooltipTrigger>

            {hasNextEntryPrice && (
              <TooltipContent
                side="left"
                className="w-[224px]"
                inDialog={smDialogOpen}
                collisionBoundary={document.querySelector('.tradingContainer')}
              >
                <p>
                  {orderType === ORDER_TYPE.limit
                    ? t`Order execution is based on oracle price, which may differ slightly from the chart price.`
                    : t`The position opens at ${dispNextEntryPrice} with a maximum ${
                        dispSlippage
                      } slippage. Adjust the slippage amount via the trading panel.`}
                </p>
              </TooltipContent>
            )}
          </Tooltip>
        )
      }
    />
  );
};

export default memo(EntryPx);
